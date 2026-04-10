// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { callTextAI, callVisionAI, processPDFForQuiz, fixLatex, parseAIJson, normalizeQuestions } from "@/lib/ai";
import { isVisionPayload, parseVisionPayload } from "@/lib/pdf";

const MAX_VISION_PAGES = 5;
const MAX_CHARS_FREE = 8000;
const MAX_CHARS_PREMIUM = 20000;

function truncate(s: string, max: number) {
  return s.length <= max ? s : s.slice(0, max) + "\n[truncated]";
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
    return `Convert past exam questions into a quiz.
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
  if (msg.includes("unavailable"))
    return "AI service is busy. Try again in a minute.";
  return "Something went wrong. Please try again.";
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

      const safe = truncate(fixLatex(extracted), MAX_CHARS_FREE);
      const userMsg = type === "pq_quiz"
        ? `Convert ALL these extracted questions into a JSON array:\n\n${safe}`
        : safe;

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
          { error: "Could not generate questions from this scan. Try copying the text instead." },
          { status: 422 }
        );
      }

      const normalized = normalizeQuestions(rawQs);
      const totalFound = normalized.length;
      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound,
        requested: count,
        notice: totalFound < count ? `Found ${totalFound} questions. Showing all ${totalFound}.` : null,
      });
    }

    // ============ TEXT PATH ============
    // First, check if this is a vision payload from PDF
    let finalContent = content;
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

    const maxChars = isPremium ? MAX_CHARS_PREMIUM : MAX_CHARS_FREE;
    
    // Process PDF text (chunk + summarize if needed)
    let processedContent = finalContent;
    if (finalContent.length > maxChars) {
      console.log("[generate] Processing long text through chunk+summarize...");
      processedContent = await processPDFForQuiz(finalContent, count, isPremium);
    }
    
    const safe = truncate(fixLatex(processedContent), maxChars);
    const userMsg = type === "pq_quiz"
      ? `Convert these past questions into a quiz. Return ONLY the JSON array:\n\n${safe}`
      : safe;

    const raw = await callTextAI(
      [
        { role: "system", content: prompt },
        { role: "user", content: userMsg },
      ],
      3000,
      isPremium
    );

    const rawQs = parseAIJson(raw);
    if (!rawQs?.length) {
      return NextResponse.json(
        { error: "Could not generate questions. Please try again." },
        { status: 422 }
      );
    }

    const normalized = normalizeQuestions(rawQs);
    const totalFound = normalized.length;
    return NextResponse.json({
      questions: normalized.slice(0, count),
      totalFound,
      requested: count,
      notice: totalFound < count
        ? `Generated ${totalFound} questions. Try adding more material for ${count}.`
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
