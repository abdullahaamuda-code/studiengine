// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { 
  callTextAI, 
  callVisionAI, 
  processPDFForQuiz, 
  fixLatex, 
  parseAIJson, 
  normalizeQuestions 
} from "@/lib/ai";
import { isVisionPayload, parseVisionPayload } from "@/lib/pdf";

const MAX_VISION_PAGES = 5;
const MAX_CHARS_FREE = 8000;
const MAX_CHARS_PREMIUM = 20000;

function truncate(s: string, max: number) {
  return s.length <= max ? s : s.slice(0, max) + "\n[truncated]";
}

function stripAnswersFromText(text: string): string {
  // Remove lines that contain "Ans:" or "Answer:" for PQ generation
  const lines = text.split('\n');
  const cleanedLines = lines.filter(line => {
    const lowerLine = line.toLowerCase();
    return !lowerLine.includes('ans:') && 
           !lowerLine.includes('answer:') &&
           !lowerLine.includes('correct answer') &&
           !lowerLine.match(/^ans\.?/i);
  });
  return cleanedLines.join('\n');
}

function buildPrompt(type: string, count: number): string {
  const math = `Math in $...$: $\\frac{a}{b}$, $\\lim_{x\\to 0}$, $\\sqrt{x}$, $x^2$, $\\sin(x)$.`;
  const opts = `Options labeled A. B. C. D. always.`;
  const fmt = `[{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]`;
  
  if (type === "notes_quiz") {
    return `Nigerian exam AI. Generate EXACTLY ${count} MCQs from the material.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: ${fmt}
EXACTLY ${count} questions. Answer = A/B/C/D. Always include explanation.`;
  }
  
  if (type === "pq_quiz") {
    return `Convert these past exam questions into a quiz.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: ${fmt}
Extract EVERY question. Do NOT limit the count. Answer = A/B/C/D. Always include explanation.`;
  }
  
  return "";
}

function friendlyError(msg: string): string {
  if (msg.includes("too large") || msg.includes("TPM") || msg.includes("TPD"))
    return "Content too long. Try pasting fewer questions or a shorter section.";
  if (msg.includes("rate") || msg.includes("429") || msg.includes("busy"))
    return "AI is busy right now. Please wait a few seconds and try again.";
  if (msg.includes("401") || msg.includes("Invalid API"))
    return "Server configuration error. Please contact support.";
  if (msg.includes("narrative") || msg.includes("story"))
    return "This appears to be a story/novel. Studiengine works best with educational content like past questions, lecture notes, and textbooks.";
  return "Something went wrong. Please try again.";
}

function isNarrativeContent(text: string): boolean {
  const narrativeIndicators = [
    'chapter', 'story', 'told', 'said', 'asked', 'replied', 
    'whispered', 'shouted', 'cried', 'laughed', 'walked',
    'ran', 'entered', 'left', 'came', 'went', 'looked',
    'saw', 'heard', 'felt', 'thought', 'wondered', 'narrated'
  ];
  
  const lowerText = text.toLowerCase();
  let narrativeCount = 0;
  
  for (const indicator of narrativeIndicators) {
    if (lowerText.includes(indicator)) {
      narrativeCount++;
    }
  }
  
  return narrativeCount > 10;
}

const VISION_EXTRACT_PROMPT = `Extract ALL questions from these exam pages as plain text.
Include: question number, full question text, all options A B C D, correct answer marked [CORRECT] if visible.
Preserve math exactly: keep \\frac, \\int, \\sqrt, \\lim, \\sin with backslashes intact.
Extract every question visible. Do not skip any.`;

export async function POST(req: NextRequest) {
  try {
    const { type, content, images, count = 10, isPremium = false } = await req.json();

    console.log("[generate] type:", type, "images:", images?.length || 0, "count:", count, "premium:", isPremium);

    if (!content?.trim() && !images?.length) {
      return NextResponse.json({ error: "No content provided." }, { status: 400 });
    }

    const prompt = buildPrompt(type, count);
    if (!prompt) {
      return NextResponse.json({ error: "Invalid request type." }, { status: 400 });
    }

    // ============ VISION PATH (Scanned PDFs) ============
    if (images && images.length > 0) {
      const pages = images.slice(0, MAX_VISION_PAGES);
      console.log("[generate] vision: processing", pages.length, "pages");

      let extracted = "";
      try {
        extracted = await callVisionAI(pages, VISION_EXTRACT_PROMPT);
        console.log("[generate] Vision extracted:", extracted.length, "chars");
      } catch (e: any) {
        console.error("[generate] Vision failed:", e.message);
        return NextResponse.json(
          { error: "Could not read the scanned PDF. Try copying the text and pasting it instead." },
          { status: 422 }
        );
      }

      if (!extracted || extracted.length < 20) {
        return NextResponse.json(
          { error: "Could not extract text from the PDF. Try copying and pasting the text instead." },
          { status: 422 }
        );
      }

      // Check if content is narrative (story/novel)
      if (isNarrativeContent(extracted)) {
        return NextResponse.json(
          { error: "This appears to be a story/novel, not exam questions. Studiengine is designed for educational content like JAMB/WAEC past questions, lecture notes, and textbooks." },
          { status: 422 }
        );
      }

      const safe = truncate(fixLatex(extracted), MAX_CHARS_FREE);
      let userMsg = safe;
      
      if (type === "pq_quiz") {
        // Strip answers from the content before sending
        const stripped = stripAnswersFromText(safe);
        userMsg = `Convert these past questions into a quiz. Return ONLY the JSON array. Do NOT include the answers from the source material - generate fresh answers based on the questions:\n\n${stripped}`;
      }

      const raw = await callTextAI(
        [
          { role: "system", content: prompt },
          { role: "user", content: userMsg },
        ],
        4000,
        isPremium
      );

      const rawQs = parseAIJson(raw);
      if (!rawQs?.length) {
        console.error("[generate] vision parse failed:", raw.slice(0, 200));
        return NextResponse.json(
          { error: "Could not generate questions from this scan. Try copying the text and pasting it for better results." },
          { status: 422 }
        );
      }

      const normalized = normalizeQuestions(rawQs);
      const totalFound = normalized.length;
      console.log("[generate] vision found:", totalFound, "requested:", count);
      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound,
        requested: count,
        notice: totalFound < count ? `Found ${totalFound} questions in this scan. Showing all ${totalFound}.` : null,
      });
    }

    // ============ TEXT PATH ============
    let finalContent = content;
    
    // Check if this is a vision payload from PDF extraction
    if (isVisionPayload(content)) {
      const { images: visionImages } = parseVisionPayload(content);
      if (visionImages && visionImages.length > 0) {
        console.log("[generate] Processing vision payload with", visionImages.length, "images");
        let extracted = "";
        try {
          extracted = await callVisionAI(visionImages.slice(0, MAX_VISION_PAGES), VISION_EXTRACT_PROMPT);
        } catch (e: any) {
          console.error("[generate] Vision extraction failed:", e.message);
          return NextResponse.json(
            { error: "Could not read scanned PDF. Try copying the text instead." },
            { status: 422 }
          );
        }
        if (extracted && extracted.length > 20) {
          finalContent = extracted;
        }
      }
    }

    // Check if content is narrative (story/novel)
    if (isNarrativeContent(finalContent)) {
      return NextResponse.json(
        { error: "This appears to be a story/novel, not exam questions. Studiengine is designed for educational content like JAMB/WAEC past questions, lecture notes, and textbooks." },
        { status: 422 }
      );
    }

    const maxChars = isPremium ? MAX_CHARS_PREMIUM : MAX_CHARS_FREE;
    
    // Process long text through chunk+summarize
    let processedContent = finalContent;
    if (finalContent.length > maxChars) {
      console.log("[generate] Processing long text through chunk+summarize...");
      processedContent = await processPDFForQuiz(finalContent, count, isPremium);
    }
    
    const safe = truncate(fixLatex(processedContent), maxChars);
    let userMsg = safe;
    
    if (type === "pq_quiz") {
      // Strip answers from the content before sending
      const stripped = stripAnswersFromText(safe);
      userMsg = `Convert these past questions into a quiz. Return ONLY the JSON array. Do NOT include the answers from the source material - generate fresh answers based on the questions:\n\n${stripped}`;
    }

    const raw = await callTextAI(
      [
        { role: "system", content: prompt },
        { role: "user", content: userMsg },
      ],
      4000,
      isPremium
    );

    const rawQs = parseAIJson(raw);
    if (!rawQs?.length) {
      console.error("[generate] parse failed, raw preview:", raw.slice(0, 300));
      return NextResponse.json(
        { error: "Could not generate questions. Please try again with shorter content." },
        { status: 422 }
      );
    }

    const normalized = normalizeQuestions(rawQs);
    const totalFound = normalized.length;
    
    console.log("[generate] success: found", totalFound, "questions, requested", count);
    
    return NextResponse.json({
      questions: normalized.slice(0, count),
      totalFound,
      requested: count,
      notice: totalFound < count
        ? `Generated ${totalFound} questions from this content. Try adding more material for ${count}.`
        : null,
    });
    
  } catch (err: any) {
    console.error("[generate] FATAL:", err.message);
    return NextResponse.json(
      { error: friendlyError(err.message) },
      { status: 500 }
    );
  }
}
