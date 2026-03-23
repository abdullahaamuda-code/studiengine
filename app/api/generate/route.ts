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
  // Strip markdown fences
  let clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  
  // Try 1: direct parse
  try { const r = JSON.parse(clean); return Array.isArray(r) ? r : null; } catch (_) {}
  
  // Try 2: find array with greedy match from first [ to last ]
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    const arr = clean.slice(start, end + 1);
    try { return JSON.parse(arr); } catch (_) {}
    // Try 3: fix bad backslashes
    try { return JSON.parse(arr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")); } catch (_) {}
    // Try 4: remove control characters
    try { return JSON.parse(arr.replace(/[\x00-\x1F\x7F]/g, " ")); } catch (_) {}
  }
  
  // Try 5: extract individual question objects and build array manually
  const objects: any[] = [];
  const objRegex = /\{[^{}]*"question"[^{}]*\}/g;
  let match;
  while ((match = objRegex.exec(clean)) !== null) {
    try { objects.push(JSON.parse(match[0])); } catch (_) {}
  }
  if (objects.length > 0) return objects;
  
  console.error("[parse] all strategies failed, raw sample:", clean.slice(0, 300));
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

function friendlyError(msg: string): string {
  if (msg.includes("too large") || msg.includes("TPM") || msg.includes("tokens")) return "Content too long. Try pasting fewer questions.";
  if (msg.includes("busy") || msg.includes("rate") || msg.includes("429")) return "AI is busy. Please wait a few seconds and try again.";
  if (msg.includes("401") || msg.includes("Invalid API") || msg.includes("api_key")) return "Server configuration error. Please contact support.";
  return `Error: ${msg.slice(0, 120)}`;
}

// ── Single Groq key call ──────────────────────────────────────────────────────
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

// ── OpenRouter fallback ───────────────────────────────────────────────────────
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

// ── Text generation with full fallback chain ──────────────────────────────────
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

  // All Groq keys exhausted — try OpenRouter
  console.log("[generate] All Groq keys busy, trying OpenRouter...");
  return await callOpenRouter(messages, maxTokens);
}

// ── Gemini vision ─────────────────────────────────────────────────────────────
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

// ── Groq vision fallback ──────────────────────────────────────────────────────
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

// ── Extract text from image batch ─────────────────────────────────────────────
async function extractBatch(images: string[], prompt: string): Promise<string> {
  try {
    return await callGemini(images, prompt);
  } catch (e: any) {
    console.log("[generate] Gemini failed:", e.message, "- falling back to Groq vision");
    return await callGroqVision(images, prompt);
  }
}

// ── Prompts ───────────────────────────────────────────────────────────────────
function buildPrompt(type: string, count: number): string {
  const math = `Math: wrap in $...$. E.g. $\\frac{a}{b}$, $\\lim_{x\\to 0}$, $\\sqrt{x}$, $x^2$, $\\sin(x)$.`;
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

// ── Main handler ──────────────────────────────────────────────────────────────
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
      // Vision path: extract text from all pages, then convert to questions
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
        return NextResponse.json({ error: "Could not read PDF pages. Try a clearer scan." }, { status: 422 });
      }

      const combined = truncate(extracted.join("\n\n"));
      const userMsg = type === "pq_quiz"
        ? `Convert ALL these extracted questions into a quiz JSON array:\n\n${combined}`
        : combined;

      const raw = await generateText([
        { role: "system", content: prompt },
        { role: "user", content: userMsg },
      ], 4000, isPremium);

      let rawQs = parseAIJson(raw);
      
      // If parse failed, retry with a dead-simple prompt
      if (!rawQs || !rawQs.length) {
        console.error("[generate] first parse failed, retrying with simple prompt. raw:", raw.slice(0, 200));
        try {
          const retryRaw = await generateText([
            { role: "system", content: `Return ONLY a JSON array of MCQ questions. No text before or after. Format exactly: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]` },
            { role: "user", content: `Convert this to a JSON question array. Return ONLY the array, nothing else:\n\n${combined.slice(0, 3000)}` },
          ], 3000, isPremium);
          rawQs = parseAIJson(retryRaw);
          console.error("[generate] retry result:", rawQs?.length || 0, "questions");
        } catch (retryErr: any) {
          console.error("[generate] retry failed:", retryErr.message);
        }
      }
      
      if (!rawQs || !rawQs.length) {
        return NextResponse.json({ error: "Could not parse questions from the content. The AI may have returned an unexpected format — please try again." }, { status: 422 });
      }

      const normalized = normalizeQuestions(rawQs);
      const totalFound = normalized.length;
      const needsChoice = totalFound > 0 && totalFound < count;
      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound, requested: count,
        needsChoice,
        notice: needsChoice ? `Only ${totalFound} questions found in this PDF. Try setting your count to ${totalFound}.` : null,
      });

    } else {
      // Text path
      const safe = truncate(content);
      const userMsg = type === "pq_quiz"
        ? `Convert these past questions into a quiz. Return ONLY the JSON array:\n\n${safe}`
        : safe;

      const raw = await generateText([
        { role: "system", content: prompt },
        { role: "user", content: userMsg },
      ], 3000, isPremium);

      const rawQs = parseAIJson(raw);
      if (!rawQs || !rawQs.length) {
        return NextResponse.json({ error: "Could not generate questions. Please try again." }, { status: 422 });
      }

      const normalized = normalizeQuestions(rawQs);
      const totalFound = normalized.length;
      const needsChoice = totalFound > 0 && totalFound < count;
      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound, requested: count,
        needsChoice,
        notice: needsChoice
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
