import { NextRequest, NextResponse } from "next/server";
// if you put parseAIJson in a separate file, import it:
// import { parseAIJson } from "@/lib/parseAIJson";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const BATCH_SIZE = 5;
const MAX_CHARS = 6000;

// ---------- parser ----------
function parseAIJson(raw: string): any {
  if (!raw) return null;

  let clean = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  if (/^Request Entity Too Large|^<html|^<!doctype html|^Rate limit/i.test(clean)) {
    return null;
  }

  const arrMatch = clean.match(/\[[\s\S]*\]/);
  const objMatch = clean.match(/\{[\s\S]*\}/);
  const jsonStr = arrMatch?.[0] ?? objMatch?.[0];

  if (!jsonStr) {
    const objects: any[] = [];
    const objRegex = /\{[^{}]*"question"[^{}]*\}/g;
    let m;
    while ((m = objRegex.exec(clean)) !== null) {
      try { objects.push(JSON.parse(m[0])); } catch (_) {}
    }
    return objects.length ? objects : null;
  }

  try { return JSON.parse(jsonStr); } catch (_) {}

  try {
    return JSON.parse(
      jsonStr.replace(/\\(?!["\\\/bfnrtu])/g, "\\\\")
    );
  } catch (_) {}

  try { return JSON.parse(jsonStr.replace(/\\/g, "")); } catch (_) {}

  const objects: any[] = [];
  const objRegex2 = /\{[^{}]*"question"[^{}]*\}/g;
  let m2;
  while ((m2 = objRegex2.exec(jsonStr)) !== null) {
    try { objects.push(JSON.parse(m2[0])); } catch (_) {}
  }
  return objects.length ? objects : null;
}
// ----------------------------

function truncate(s: string) {
  return s.length <= MAX_CHARS ? s : s.slice(0, MAX_CHARS) + "\n[truncated]";
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

function friendlyError(msg: string): string {
  if (msg.includes("too large") || msg.includes("TPM") || msg.includes("tokens")) return "Content too long. Try pasting fewer questions.";
  if (msg.includes("busy") || msg.includes("rate") || msg.includes("429")) return "AI is busy. Please wait a few seconds and try again.";
  if (msg.includes("401") || msg.includes("Invalid API") || msg.includes("api_key")) return "Server configuration error. Please contact support.";
  return `Error: ${msg.slice(0, 120)}`;
}

async function callGroq(apiKey: string, model: string, messages: any[], maxTokens = 3000): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.3, max_tokens: maxTokens, messages }),
    });
    if (res.status === 429 || res.status === 503) {
      if (attempt < 3) { await new Promise(r => setTimeout(r, attempt * 5000)); continue; }
      throw new Error("rate limited");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `Groq ${res.status}`);
    }
    return (await res.json()).choices[0].message.content as string;
  }
  throw new Error("rate limited");
}

async function callOpenRouter(messages: any[], maxTokens = 3000): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("No OpenRouter key");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "https://studiengine.vercel.app",
      "X-Title": "Studiengine",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages, max_tokens: maxTokens, temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `OpenRouter ${res.status}`);
  }
  return (await res.json()).choices?.[0]?.message?.content || "";
}

async function generateText(messages: any[], maxTokens = 3000, isPremium = false): Promise<string> {
  const keys = [
    isPremium ? process.env.GROQ_PREMIUM_KEY : null,
    process.env.GROQ_TEXT_KEY,
    process.env.GROQ_ANALYZE_KEY,
    process.env.GROQ_VISION_KEY,
    process.env.GROQ_API_KEY,
  ].filter(Boolean) as string[];

  const unique = keys.filter((k, i) => keys.indexOf(k) === i);

  for (const key of unique) {
    try {
      return await callGroq(key, TEXT_MODEL, messages, maxTokens);
    } catch (e: any) {
      if (e.message.includes("rate") || e.message.includes("429") || e.message.includes("busy")) {
        console.log("[generate] Groq key rate limited, trying next...");
        continue;
      }
      throw e;
    }
  }

  console.log("[generate] All Groq keys busy, trying OpenRouter...");
  return await callOpenRouter(messages, maxTokens);
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

async function callGroqVision(images: string[], prompt: string): Promise<string> {
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
      return await callGroq(key, VISION_MODEL, [{ role: "user", content: [...imageContent, { type: "text", text: prompt }] }], 2000);
    } catch (e: any) {
      if (e.message.includes("rate") || e.message.includes("429") || e.message.includes("busy")) continue;
      throw e;
    }
  }
  throw new Error("Vision AI busy. Please try again.");
}

async function extractBatch(images: string[], prompt: string): Promise<string> {
  try {
    return await callGemini(images, prompt);
  } catch (e: any) {
    console.log("[generate] Gemini failed:", e.message, "- falling back to Groq vision");
    return await callGroqVision(images, prompt);
  }
}

function buildPrompt(type: string, count: number): string {
  const math = `Math: wrap in $...$. E.g. $\\\\frac{a}{b}$, $\\\\lim_{x\\\\to 0}$, $\\\\sqrt{x}$, $x^2$, $\\\\sin(x)$.`;
  const opts = `Options MUST be labeled A. B. C. D. Ignore checkmarks. Relabel if needed.`;
  if (type === "notes_quiz") return `Nigerian exam AI. Generate EXACTLY ${count} MCQs from the material.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]
Generate EXACTLY ${count} questions. Answer = single letter A/B/C/D. Always include explanation.`;
  if (type === "pq_quiz") return `Convert Nigerian past exam questions into a quiz.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"...","year":""}]
Extract up to ${count} questions. Answer = single letter A/B/C/D. Always include explanation.`;
  return "";
}

const EXTRACT_PROMPT = `Extract ALL questions from these exam pages.
For each question include the question text, all options (A B C D), and mark correct answer with [CORRECT] if visible.
For math: write fractions as (a/b), limits as lim(x->0), roots as sqrt(x), powers as x^2.
Extract every single question visible. Be thorough.`;

export async function POST(req: NextRequest) {
  try {
    const { type, content, images, count = 10, isPremium = false } = await req.json();

    console.log("[generate] type:", type, "images:", images?.length || 0, "count:", count, "isPremium:", isPremium);

    if (!content?.trim() && !images?.length) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const prompt = buildPrompt(type, count);
    if (!prompt) return NextResponse.json({ error: "Invalid type: " + type }, { status: 400 });

    if (images && images.length > 0) {
      const batches: string[][] = [];
      for (let i = 0; i < images.length; i += BATCH_SIZE) batches.push(images.slice(i, i + BATCH_SIZE));

      const extracted: string[] = [];
      for (let b = 0; b < batches.length; b++) {
        try {
          console.log(`[generate] extracting batch ${b+1}/${batches.length}`);
          const text = await extractBatch(batches[b], EXTRACT_PROMPT);
          if (text) { extracted.push(text); console.log(`[generate] batch ${b+1}: ${text.length} chars`); }
          if (b < batches.length - 1) await new Promise(r => setTimeout(r, 500));
        } catch (e: any) {
          console.error(`[generate] batch ${b+1} failed:`, e.message);
        }
      }

      if (extracted.length === 0) {
        return NextResponse.json(
          { error: "Could not read PDF pages. Try a clearer scan or fewer pages." },
          { status: 422 }
        );
      }

      const combined = truncate(extracted.join("\n\n"));
      const userMsg = type === "pq_quiz"
        ? `The text below is OCR of exam questions. Convert EVERY question you see into JSON objects.
Do not skip any question. Do not summarize. Return ONLY the JSON array.

TEXT:
${combined}`
        : combined;

      const raw = await generateText(
        [
          { role: "system", content: prompt },
          { role: "user", content: userMsg },
        ],
        4000,
        isPremium
      );

      const rawQs = parseAIJson(raw);
      if (!rawQs || !rawQs.length) {
        console.error("[generate] parse failed:", raw.slice(0, 200));
        return NextResponse.json(
          {
            error:
              "We couldn’t read clear questions from this scan. The pages may be too blurry or too long. Try fewer pages or a clearer PDF and try again.",
          },
          { status: 422 }
        );
      }

      const normalized = normalizeQuestions(rawQs);
      const totalFound = normalized.length;
      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound,
        requested: count,
        notice:
          totalFound < count
            ? `Only ${totalFound} questions found in this PDF. Try setting your count to ${totalFound}.`
            : null,
      });

    } else {
      const safe = truncate(content);
      const userMsg = type === "pq_quiz"
        ? `The text below is a list of past exam questions. Convert EVERY question you see into JSON objects.
Do not skip any question. Do not summarize. Return ONLY the JSON array.

TEXT:
${safe}`
        : safe;

      const raw = await generateText(
        [
          { role: "system", content: prompt },
          { role: "user", content: userMsg },
        ],
        3000,
        isPremium
      );

      const rawQs = parseAIJson(raw);
      if (!rawQs || !rawQs.length) {
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
        notice:
          totalFound < count
            ? `Only ${totalFound} questions could be generated from this content. Try setting your count to ${totalFound}.`
            : null,
      });
    }

  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[generate] FATAL:", msg);
    return NextResponse.json({ error: friendlyError(msg) }, { status: 500 });
  }
}
