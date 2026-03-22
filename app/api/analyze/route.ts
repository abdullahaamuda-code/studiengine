import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const BATCH_SIZE = 5;
const MAX_CHARS = 6000;

function truncate(s: string) {
  return s.length <= MAX_CHARS ? s : s.slice(0, MAX_CHARS) + "\n[truncated]";
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

function friendlyError(msg: string): string {
  if (msg.includes("too large") || msg.includes("TPM") || msg.includes("TPD") || msg.includes("tokens")) return "Content too long. Try pasting fewer questions.";
  if (msg.includes("busy") || msg.includes("rate") || msg.includes("429")) return "AI is busy. Please wait a few seconds and try again.";
  if (msg.includes("401") || msg.includes("Invalid API")) return "Server configuration error. Please contact support.";
  return "Something went wrong. Please try again.";
}

async function callGroq(key: string, model: string, messages: any[], maxTokens = 2000): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, temperature: 0.3, max_tokens: maxTokens, messages }),
  });
  if (res.status === 429 || res.status === 503) throw new Error("rate limited");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Groq ${res.status}`);
  }
  return (await res.json()).choices[0].message.content as string;
}

async function callGemini(images: string[], prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No Gemini key");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
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
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function extractBatch(images: string[], prompt: string): Promise<string> {
  try {
    return await callGemini(images, prompt);
  } catch (e: any) {
    console.log("[analyze] Gemini failed:", e.message, "- trying Groq vision");
    const keys = [
      process.env.GROQ_VISION_KEY,
      process.env.GROQ_TEXT_KEY,
      process.env.GROQ_ANALYZE_KEY,
      process.env.GROQ_API_KEY,
    ].filter(Boolean) as string[];
    const unique = keys.filter((k, i) => keys.indexOf(k) === i);
    const imageContent = images.map(b64 => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` } }));
    for (const key of unique) {
      try {
        return await callGroq(key, VISION_MODEL, [{ role: "user", content: [...imageContent, { type: "text", text: prompt }] }], 1500);
      } catch (e2: any) {
        if (e2.message.includes("rate")) continue;
        throw e2;
      }
    }
    throw new Error("Vision AI busy");
  }
}

async function callText(messages: any[]): Promise<string> {
  const keys = [
    process.env.GROQ_ANALYZE_KEY,
    process.env.GROQ_TEXT_KEY,
    process.env.GROQ_VISION_KEY,
    process.env.GROQ_PREMIUM_KEY,
    process.env.GROQ_API_KEY,
  ].filter(Boolean) as string[];
  const unique = keys.filter((k, i) => keys.indexOf(k) === i);

  for (const key of unique) {
    try {
      return await callGroq(key, TEXT_MODEL, messages, 2000);
    } catch (e: any) {
      if (e.message.includes("rate") || e.message.includes("429") || e.message.includes("busy") || e.message.includes("TPD")) {
        console.log("[analyze] key busy, trying next...");
        continue;
      }
      throw e;
    }
  }

  // OpenRouter fallback
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    console.log("[analyze] trying OpenRouter...");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orKey}`, "HTTP-Referer": "https://studiengine.vercel.app", "X-Title": "Studiengine" },
      body: JSON.stringify({ model: "meta-llama/llama-3.1-8b-instruct:free", messages, max_tokens: 2000, temperature: 0.3 }),
    });
    if (res.ok) return (await res.json()).choices?.[0]?.message?.content || "";
  }

  throw new Error("AI is busy. Please wait a few seconds and try again.");
}

const SYSTEM_PROMPT = `You are a Nigerian exam analyst for JAMB, WAEC, NECO, and university past questions.
Analyze the provided past questions and identify patterns, repeated topics, and likely exam areas.
Return ONLY a valid JSON object. No markdown, no backticks, no extra text.
Format: {"topTopics":[{"topic":"...","frequency":"high|medium|low","count":5,"likelyExam":true}],"patterns":["..."],"hotTopics":["..."],"yearsCovered":["2019"],"totalQuestions":25,"advice":"2-3 sentences","subjectArea":"Chemistry"}`;

const EXTRACT_PROMPT = `Extract all questions, topics, and years visible on these exam pages. Return as plain text only.`;

export async function POST(req: NextRequest) {
  try {
    const { content, images } = await req.json();
    if (!content?.trim() && !images?.length) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    let textToAnalyze = "";

    if (images && images.length > 0) {
      const batches: string[][] = [];
      for (let i = 0; i < images.length; i += BATCH_SIZE) batches.push(images.slice(i, i + BATCH_SIZE));

      const parts: string[] = [];
      for (let b = 0; b < batches.length; b++) {
        try {
          console.log(`[analyze] extracting batch ${b+1}/${batches.length}`);
          const text = await extractBatch(batches[b], EXTRACT_PROMPT);
          if (text) parts.push(text);
          if (b < batches.length - 1) await new Promise(r => setTimeout(r, 500));
        } catch (e: any) {
          console.error(`[analyze] batch ${b+1} failed:`, e.message);
        }
      }

      if (parts.length === 0) {
        return NextResponse.json({ error: "Could not read PDF pages. Try a clearer scan." }, { status: 422 });
      }
      textToAnalyze = truncate(parts.join("\n\n"));
    } else {
      textToAnalyze = truncate(content);
    }

    const raw = await callText([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Analyze these past questions:\n\n${textToAnalyze}` },
    ]);

    const analysis = parseAIJson(raw);
    if (!analysis) {
      console.error("[analyze] parse failed:", raw.slice(0, 200));
      return NextResponse.json({ error: "Could not parse analysis. Please try again." }, { status: 422 });
    }
    return NextResponse.json({ analysis });

  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[analyze] FATAL:", msg);
    return NextResponse.json({ error: friendlyError(msg) }, { status: 500 });
  }
}
