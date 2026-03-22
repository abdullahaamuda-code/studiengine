import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const BATCH_SIZE = 5;
const MAX_TEXT_CHARS = 6000;

function truncate(content: string) {
  return content.length <= MAX_TEXT_CHARS ? content : content.slice(0, MAX_TEXT_CHARS) + "\n[truncated]";
}

function friendlyError(e: any): string {
  const msg = String(e?.message || e);
  if (msg.includes("too large") || msg.includes("TPM") || msg.includes("tokens")) return "Content too long. Try pasting fewer questions.";
  if (msg.includes("429") || msg.includes("rate")) return "AI is busy. Please wait a few seconds and try again.";
  if (msg.includes("401") || msg.includes("API key")) return "Server configuration error. Please contact support.";
  return "Something went wrong. Please try again.";
}

function parseAIJson(raw: string): any {
  const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  try { return JSON.parse(clean); } catch (_) {}
  const obj = clean.match(/\{[\s\S]*\}/)?.[0];
  if (!obj) return null;
  try { return JSON.parse(obj); } catch (_) {}
  try { return JSON.parse(obj.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")); } catch (_) {}
  return null;
}

async function callGroq(apiKey: string, model: string, messages: any[], maxTokens = 2000, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.3, max_tokens: maxTokens, messages }),
    });
    if (res.status === 429 || res.status === 503) {
      if (attempt < retries) { await new Promise(r => setTimeout(r, attempt * 2000)); continue; }
      throw new Error("AI is busy. Please wait and try again.");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `Error ${res.status}`);
    }
    const data = await res.json();
    return data.choices[0].message.content as string;
  }
  throw new Error("Failed after retries");
}

const SYSTEM_PROMPT = `You are a Nigerian exam analyst for JAMB, WAEC, NECO, and university past questions.
Analyze the provided past questions and identify patterns, repeated topics, and likely exam areas.
Return ONLY a valid JSON object. No markdown, no backticks, no extra text before or after.
Format: {"topTopics":[{"topic":"...","frequency":"high|medium|low","count":5,"likelyExam":true}],"patterns":["..."],"hotTopics":["..."],"yearsCovered":["2019"],"totalQuestions":25,"advice":"2-3 sentences","subjectArea":"Chemistry"}`;

const EXTRACT_PROMPT = `Extract all questions, topics, and years visible on these exam pages. Return as plain text only.`;


async function geminiExtract(apiKey: string, images: string[], prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const parts: any[] = images.map(b64 => ({ inline_data: { mime_type: "image/jpeg", data: b64 } }));
  parts.push({ text: prompt });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { maxOutputTokens: 2000, temperature: 0.2 } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Gemini ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function POST(req: NextRequest) {
  try {
    const { content, images } = await req.json();
    if (!content?.trim() && !images?.length) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    // All available keys for fallback
    const allKeys = [
      process.env.GROQ_ANALYZE_KEY,
      process.env.GROQ_TEXT_KEY,
      process.env.GROQ_VISION_KEY,
      process.env.GROQ_PREMIUM_KEY,
      process.env.GROQ_API_KEY,
    ].filter(Boolean) as string[];
    const uniqueKeys = Array.from(new Set(allKeys));
    const analyzeKey = uniqueKeys[0] || "";
    const visionKey = process.env.GROQ_VISION_KEY || uniqueKeys[0] || "";

    let textToAnalyze = "";

    if (images && images.length > 0) {
      if (!visionKey) return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
      const batches: string[][] = [];
      for (let i = 0; i < images.length; i += BATCH_SIZE) batches.push(images.slice(i, i + BATCH_SIZE));
      const parts: string[] = [];
      for (const batch of batches) {
        try {
          const geminiKey = process.env.GEMINI_API_KEY;
          let text: string;
          if (geminiKey) {
            text = await geminiExtract(geminiKey, batch, EXTRACT_PROMPT);
          } else {
            const imageContent = batch.map((b64: string) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` } }));
            text = await callGroq(visionKey!, VISION_MODEL, [{ role: "user", content: [...imageContent, { type: "text", text: EXTRACT_PROMPT }] }], 1500);
          }
          if (text) parts.push(text);
        } catch (e: any) { console.error("Vision batch failed:", e.message); }
      }
      if (parts.length === 0) return NextResponse.json({ error: "Could not read content from PDF. Try a clearer scan." }, { status: 422 });
      textToAnalyze = truncate(parts.join("\n\n"));
    } else {
      textToAnalyze = truncate(content);
    }

    if (!analyzeKey) return NextResponse.json({ error: "Server configuration error." }, { status: 500 });

    const raw = await callGroq(analyzeKey, TEXT_MODEL, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Analyze these past questions and return ONLY the JSON object:\n\n${textToAnalyze}` },
    ]);

    const analysis = parseAIJson(raw);
    if (!analysis) {
      console.error("[analyze] parse failed. Raw:", raw.slice(0, 300));
      return NextResponse.json({ error: "Could not parse analysis. Please try again." }, { status: 422 });
    }
    return NextResponse.json({ analysis });

  } catch (err: any) {
    console.error("[/api/analyze]", err.message);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
