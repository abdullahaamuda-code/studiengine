import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const BATCH_SIZE = 5;

function parseAIJson(raw: string): any {
  let clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  try { return JSON.parse(clean); } catch (_) {}
  const objMatch = clean.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch (_) {}
    const fixed = objMatch[0].replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    try { return JSON.parse(fixed); } catch (_) {}
  }
  return null;
}

const SYSTEM_PROMPT = `You are a Nigerian exam analyst for JAMB, WAEC, NECO, and university past questions.
Analyze the provided past questions and identify patterns, repeated topics, and likely exam areas.
Return ONLY a valid JSON object. No markdown, no backticks, no extra text.
Format: {"topTopics":[{"topic":"...","frequency":"high|medium|low","count":5,"likelyExam":true}],"patterns":["..."],"hotTopics":["..."],"yearsCovered":["2019"],"totalQuestions":25,"advice":"2-3 sentences","subjectArea":"Chemistry"}`;

const VISION_SUFFIX = `\nThese are scanned past question paper images. Extract all question text, topics, and years visible. Return only the JSON object.`;

// For vision: extract raw text per batch, then do one final analysis
const EXTRACT_PROMPT = `Extract all questions, topics, and years visible on these exam pages. Return as plain text, one question per line. No JSON needed.`;

async function callGroq(apiKey: string, model: string, messages: any[], maxTokens = 2000) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.3, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Groq error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

export async function POST(req: NextRequest) {
  try {
    const { content, images } = await req.json();
    if (!content?.trim() && !images?.length) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const analyzeKey = process.env.GROQ_ANALYZE_KEY || process.env.GROQ_API_KEY;
    const visionKey = process.env.GROQ_VISION_KEY || process.env.GROQ_API_KEY;

    if (images && images.length > 0) {
      if (!visionKey) return NextResponse.json({ error: "Vision API key not configured" }, { status: 500 });

      // Step 1: Extract text from all pages in batches of 5
      const batches: string[][] = [];
      for (let i = 0; i < images.length; i += BATCH_SIZE) {
        batches.push(images.slice(i, i + BATCH_SIZE));
      }

      const extractedParts: string[] = [];
      for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        const imageContent = batch.map((b64: string) => ({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${b64}` },
        }));
        try {
          const text = await callGroq(visionKey, VISION_MODEL, [{
            role: "user",
            content: [...imageContent, { type: "text", text: EXTRACT_PROMPT }],
          }], 2000);
          extractedParts.push(text);
        } catch (e) {
          console.error(`Vision batch ${b + 1} failed:`, e);
        }
      }

      if (extractedParts.length === 0) {
        return NextResponse.json({ error: "Could not read content from PDF. Try a clearer scan." }, { status: 422 });
      }

      // Step 2: Analyze the combined extracted text with the text model
      const combined = extractedParts.join("\n\n");
      const raw = await callGroq(analyzeKey!, TEXT_MODEL, [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze these past questions:\n\n${combined}` },
      ]);

      const analysis = parseAIJson(raw);
      if (!analysis) return NextResponse.json({ error: "Could not parse analysis. Try again." }, { status: 422 });
      return NextResponse.json({ analysis });

    } else {
      if (!analyzeKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

      const raw = await callGroq(analyzeKey, TEXT_MODEL, [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze these past questions:\n\n${content}` },
      ]);

      const analysis = parseAIJson(raw);
      if (!analysis) return NextResponse.json({ error: "Could not parse analysis. Try again." }, { status: 422 });
      return NextResponse.json({ analysis });
    }

  } catch (err: any) {
    console.error("[/api/analyze]", err.message);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
