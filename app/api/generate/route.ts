import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const BATCH_SIZE = 5;
const MAX_CHARS = 6000;

function truncate(s: string) {
  return s.length <= MAX_CHARS ? s : s.slice(0, MAX_CHARS) + "\n[truncated]";
}

function parseAIJson(raw: string): any {
  const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const arr = clean.match(/\[[\s\S]*\]/)?.[0];
  if (!arr) return null;
  try { return JSON.parse(arr); } catch (_) {}
  try { return JSON.parse(arr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")); } catch (_) {}
  return null;
}

function normalizeQuestions(qs: any[]): any[] {
  if (!Array.isArray(qs)) return [];
  const L = ["A","B","C","D"];
  return qs.map((q, i) => {
    if (!q || typeof q !== "object") return q;
    const opts = (q.options || []).slice(0, 4).map((o: string, j: number) => {
      const text = typeof o === "string" ? o.replace(/^[A-Za-z][.)]\s*/, "").trim() : String(o);
      return `${L[j]}. ${text}`;
    });
    const ans = String(q.answer || "A").trim().toUpperCase().match(/^([ABCD])/)?.[1] || "A";
    return { ...q, id: q.id || i + 1, options: opts, answer: ans };
  });
}

// All Groq keys for text fallback
function getGroqKeys(): string[] {
  return [
    process.env.GROQ_TEXT_KEY,
    process.env.GROQ_ANALYZE_KEY,
    process.env.GROQ_VISION_KEY,
    process.env.GROQ_PREMIUM_KEY,
    process.env.GROQ_API_KEY,
  ].filter(Boolean) as string[];
}

async function callGroqKey(key: string, messages: any[], maxTokens = 3000): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: TEXT_MODEL, temperature: 0.3, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Groq ${res.status}`);
  }
  return (await res.json()).choices[0].message.content as string;
}

async function callText(messages: any[], maxTokens = 3000): Promise<string> {
  const keys = getGroqKeys();
  for (const key of keys) {
    try {
      return await callGroqKey(key, messages, maxTokens);
    } catch (e: any) {
      const isRateLimit = e.message.includes("429") || e.message.includes("rate") || e.message.includes("busy");
      console.log(`[generate] text key failed: ${e.message.slice(0,60)}, isRateLimit: ${isRateLimit}`);
      if (!isRateLimit) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error("AI is busy. Please try again in a moment.");
}

// Gemini vision extraction
async function geminiVision(apiKey: string, images: string[], prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const parts: any[] = [
    ...images.map(b64 => ({ inline_data: { mime_type: "image/jpeg", data: b64 } })),
    { text: prompt }
  ];
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.1 },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[generate] Gemini error:", JSON.stringify(data).slice(0, 200));
    throw new Error(data?.error?.message || `Gemini ${res.status}`);
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("[generate] Gemini empty response:", JSON.stringify(data).slice(0, 200));
    throw new Error("Gemini returned empty response");
  }
  return text;
}

// OpenRouter vision fallback (free tier)
async function openRouterVision(apiKey: string, images: string[], prompt: string): Promise<string> {
  const imageContent = images.map(b64 => ({
    type: "image_url",
    image_url: { url: `data:image/jpeg;base64,${b64}` }
  }));
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://studiengine.vercel.app",
      "X-Title": "Studiengine",
    },
    body: JSON.stringify({
      model: "google/gemini-flash-1.5",
      max_tokens: 2000,
      messages: [{ role: "user", content: [...imageContent, { type: "text", text: prompt }] }],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[generate] OpenRouter error:", JSON.stringify(data).slice(0, 200));
    throw new Error(data?.error?.message || `OpenRouter ${res.status}`);
  }
  return data.choices[0].message.content as string;
}

// Groq vision fallback
async function groqVision(images: string[], prompt: string): Promise<string> {
  const keys = getGroqKeys();
  const imageContent = images.map(b64 => ({
    type: "image_url",
    image_url: { url: `data:image/jpeg;base64,${b64}` }
  }));
  for (const key of keys) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          max_tokens: 2000,
          temperature: 0.2,
          messages: [{ role: "user", content: [...imageContent, { type: "text", text: prompt }] }],
        }),
      });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 3000)); continue; }
      if (!res.ok) continue;
      const data = await res.json();
      return data.choices[0].message.content as string;
    } catch { continue; }
  }
  throw new Error("All vision APIs rate limited");
}

// Main vision extractor — tries Gemini → OpenRouter → Groq
async function extractFromImages(images: string[], prompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;

  if (geminiKey) {
    try {
      console.log("[generate] trying Gemini vision...");
      const text = await geminiVision(geminiKey, images, prompt);
      console.log("[generate] Gemini success, chars:", text.length);
      return text;
    } catch (e: any) {
      console.error("[generate] Gemini failed:", e.message);
    }
  }

  if (orKey) {
    try {
      console.log("[generate] trying OpenRouter vision...");
      const text = await openRouterVision(orKey, images, prompt);
      console.log("[generate] OpenRouter success, chars:", text.length);
      return text;
    } catch (e: any) {
      console.error("[generate] OpenRouter failed:", e.message);
    }
  }

  console.log("[generate] trying Groq vision fallback...");
  return groqVision(images, prompt);
}

function buildPrompt(type: string, count: number): string {
  const math = `Math: wrap in $...$. E.g. $\\frac{a}{b}$, $\\lim_{x\\to 0}$, $\\sqrt{x}$, $x^2$, $\\sin(x)$.`;
  const opts = `Options MUST be labeled A. B. C. D. Ignore checkmarks. Relabel if needed.`;
  if (type === "notes_quiz") return `Nigerian exam AI. Generate EXACTLY ${count} MCQs from the material.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]
Generate EXACTLY ${count} questions. answer = single letter A/B/C/D. Always include explanation.`;
  if (type === "pq_quiz") return `Convert Nigerian past exam questions into a quiz.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"...","year":""}]
Extract up to ${count} questions. answer = single letter A/B/C/D. Always include explanation.`;
  return "";
}

const EXTRACT_PROMPT = `Extract ALL questions from these exam pages as plain text.
For each question include: question number, full question text, all options (A B C D), and mark correct answer with [CORRECT] if visible.
For math write: fractions as (a/b), limits as lim(x->0), roots as sqrt(x), powers as x^2.
Extract EVERY question you can see. Be thorough.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, content, images, count = 10, isPremium = false } = body;

    console.log("[generate] type:", type, "images:", images?.length || 0, "count:", count);

    if (!content?.trim() && !images?.length) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const prompt = buildPrompt(type, count);
    if (!prompt) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    if (images && images.length > 0) {
      const batches: string[][] = [];
      for (let i = 0; i < images.length; i += BATCH_SIZE) batches.push(images.slice(i, i + BATCH_SIZE));

      const extracted: string[] = [];
      for (let b = 0; b < batches.length; b++) {
        console.log(`[generate] extracting batch ${b+1}/${batches.length}`);
        try {
          const text = await extractFromImages(batches[b], EXTRACT_PROMPT);
          if (text) extracted.push(text);
        } catch (e: any) {
          console.error(`[generate] batch ${b+1} all APIs failed:`, e.message);
        }
        if (b < batches.length - 1) await new Promise(r => setTimeout(r, 500));
      }

      if (extracted.length === 0) {
        return NextResponse.json({ error: "Could not read PDF. Make sure GEMINI_API_KEY is set in Vercel env vars." }, { status: 422 });
      }

      const combined = truncate(extracted.join("\n\n"));
      console.log("[generate] total extracted chars:", combined.length, "converting to JSON...");

      const userMsg = type === "pq_quiz"
        ? `Convert ALL these extracted questions into a quiz JSON array:\n\n${combined}`
        : combined;

      const raw = await callText([
        { role: "system", content: prompt },
        { role: "user", content: userMsg },
      ], 4000);

      const rawQs = parseAIJson(raw);
      if (!rawQs || !rawQs.length) {
        console.error("[generate] parse failed. raw:", raw.slice(0, 300));
        return NextResponse.json({ error: "Could not parse questions. Please try again." }, { status: 422 });
      }

      const normalized = normalizeQuestions(rawQs);
      const totalFound = normalized.length;
      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound,
        requested: count,
        notice: totalFound < count ? `Found ${totalFound} questions in this PDF (you selected ${count}).` : null,
      });

    } else {
      const raw = await callText([
        { role: "system", content: prompt },
        { role: "user", content: type === "pq_quiz" ? `Convert to quiz JSON array:\n\n${truncate(content)}` : truncate(content) },
      ], 3000);

      const rawQs = parseAIJson(raw);
      if (!rawQs || !rawQs.length) {
        return NextResponse.json({ error: "Could not generate questions. Please try again." }, { status: 422 });
      }

      const normalized = normalizeQuestions(rawQs);
      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound: normalized.length,
        requested: count,
        notice: normalized.length < count ? `Generated ${normalized.length} questions (you selected ${count}).` : null,
      });
    }

  } catch (err: any) {
    console.error("[generate] FATAL:", err.message);
    return NextResponse.json({ error: err.message?.slice(0, 120) || "Server error" }, { status: 500 });
  }
}
