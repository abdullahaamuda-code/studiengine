import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const BATCH_SIZE = 5;
const MAX_CHARS = 6000;
const MAX_CHARS_VISION = 10000;

function truncate(s: string, max = MAX_CHARS) {
  return s.length <= max ? s : s.slice(0, max) + "\n[truncated]";
}

function parseAIJson(raw: string): any {
  let clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  try { const r = JSON.parse(clean); return Array.isArray(r) ? r : null; } catch (_) {}
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start !== -1 && end > start) {
    const arr = clean.slice(start, end + 1);
    try { return JSON.parse(arr); } catch (_) {}
    try { return JSON.parse(arr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")); } catch (_) {}
    try { return JSON.parse(arr.replace(/[\x00-\x1F\x7F]/g, " ")); } catch (_) {}
  }
  // Last resort: extract individual objects
  const objects: any[] = [];
  const objRegex = /\{[^{}]*"question"[^{}]*\}/g;
  let m;
  while ((m = objRegex.exec(clean)) !== null) {
    try { objects.push(JSON.parse(m[0])); } catch (_) {}
  }
  if (objects.length > 0) return objects;
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

async function callGroq(apiKey: string, model: string, messages: any[], maxTokens = 3000, maxCap = 8000): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.3, max_tokens: Math.min(maxTokens, maxCap), messages }),
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
    try { return await callGroq(key, TEXT_MODEL, messages, maxTokens); }
    catch (e: any) {
      if (e.message.includes("rate") || e.message.includes("429") || e.message.includes("busy")) { continue; }
      throw e;
    }
  }
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orKey}`, "HTTP-Referer": "https://studiengine.vercel.app", "X-Title": "Studiengine" },
      body: JSON.stringify({ model: "meta-llama/llama-3.1-8b-instruct:free", messages, max_tokens: maxTokens, temperature: 0.3 }),
    });
    if (res.ok) return (await res.json()).choices?.[0]?.message?.content || "";
  }
  throw new Error("AI is busy. Please wait and try again.");
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
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { maxOutputTokens: 8192, temperature: 0.1 } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Gemini ${res.status}`);
  }
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callGroqVision(images: string[], prompt: string): Promise<string> {
  const keys = [process.env.GROQ_VISION_KEY, process.env.GROQ_TEXT_KEY, process.env.GROQ_ANALYZE_KEY, process.env.GROQ_API_KEY].filter(Boolean) as string[];
  const unique = keys.filter((k, i) => keys.indexOf(k) === i);
  const imageContent = images.map(b64 => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` } }));
  for (const key of unique) {
    try { return await callGroq(key, VISION_MODEL, [{ role: "user", content: [...imageContent, { type: "text", text: prompt }] }], 2000); }
    catch (e: any) { if (e.message.includes("rate")) continue; throw e; }
  }
  throw new Error("Vision AI busy.");
}

async function extractBatch(images: string[], prompt: string): Promise<string> {
  try { return await callGemini(images, prompt); }
  catch (e: any) {
    console.log("[generate] Gemini failed:", e.message, "- trying Groq vision");
    return await callGroqVision(images, prompt);
  }
}

// Ask Gemini to return JSON directly — skip the two-step extract+convert
function buildGeminiPrompt(type: string, count: number): string {
  return `You are a Nigerian exam question extractor. Extract ALL MCQ questions from these exam pages.
Return ONLY a valid JSON array. No text before or after. No markdown fences.
MATH: Wrap ALL math in $...$. Use proper LaTeX: $\\frac{a}{b}$, $\\int_0^1$, $\\sqrt{x}$, $\\lim_{x\\to 0}$, $\\sin(x)$, $x^2$.
OPTIONS: Label A. B. C. D. always.
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"Brief explanation"}]
Extract EVERY question visible. Do not stop early. Do not limit count.`;
}

const EXTRACT_PROMPT = "placeholder";


// Fix LaTeX that got broken during vision extraction
// Gemini sometimes strips backslashes: rac{} -> \frac{}, int -> \int etc
function fixLatex(text: string): string {
  return text
    .replace(/\brac\{/g, "\\frac{")           // rac{ -> \frac{
    .replace(/\bint_/g, "\\int_")              // int_ -> \int_
    .replace(/\bint\^/g, "\\int^")             // int^ -> \int^
    .replace(/\blim_/g, "\\lim_")              // lim_ -> \lim_
    .replace(/\bsqrt\{/g, "\\sqrt{")           // sqrt{ -> \sqrt{
    .replace(/\btheta\b/g, "\\theta")         // theta -> \theta
    .replace(/\balpha\b/g, "\\alpha")         // alpha -> \alpha
    .replace(/\bbeta\b/g, "\\beta")           // beta -> \beta
    .replace(/\bsigma\b/g, "\\sigma")         // sigma -> \sigma
    .replace(/\bpi\b/g, "\\pi")               // pi -> \pi
    .replace(/\bsum_/g, "\\sum_")              // sum_ -> \sum_
    .replace(/\binfty\b/g, "\\infty");        // infty -> \infty
}

function buildPrompt(type: string, count: number): string {
  const math = `Math MUST be wrapped in $...$. Examples: $\\frac{a}{b}$, $\\int_0^e$, $\\lim_{x\\to 0}$, $\\sqrt{x}$, $x^2$, $\\sin(x)$. Convert any plain math like (a/b) to $\\frac{a}{b}$.`;
  const opts = `Options MUST be labeled A. B. C. D. Ignore checkmarks. Relabel if needed.`;
  if (type === "notes_quiz") return `Nigerian exam AI. Generate EXACTLY ${count} MCQs from the material.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]
Generate EXACTLY ${count} questions. Answer = single letter A/B/C/D. Always include explanation.`;
  if (type === "pq_quiz") return `Convert Nigerian past exam questions into a structured quiz.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"...","year":""}]
Extract EVERY question you see. Do not stop early. Do not limit the count. Answer = single letter A/B/C/D. Always include explanation.`;
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, content, images, count = 10, isPremium = false, action, existingQuestions, fillCount, topic } = body;

    console.log("[generate] type:", type, "images:", images?.length || 0, "count:", count, "action:", action);

    // ── Fill remaining questions ──────────────────────────────────────────────
    if (action === "fill_remaining") {
      const n = fillCount || 5;
      const raw = await generateText([
        { role: "system", content: `Generate exactly ${n} NEW MCQ questions about: "${topic || "the same exam subject"}".
Do NOT repeat any existing questions. Return ONLY a JSON array, no markdown.
Math in $...$: $\\frac{a}{b}$, $\\sqrt{x}$, $x^2$, $\\sin(x)$. Options A. B. C. D. Always include explanation.
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]` },
        { role: "user", content: `Generate exactly ${n} fresh questions. Return only the JSON array.` },
      ], 3000, isPremium);
      const rawQs = parseAIJson(raw);
      if (!rawQs || !rawQs.length) {
        return NextResponse.json({ error: "Could not generate additional questions." }, { status: 422 });
      }
      const normalized = normalizeQuestions(rawQs);
      const startId = (existingQuestions?.length || 0) + 1;
      normalized.forEach((q, i) => { q.id = startId + i; });
      return NextResponse.json({ questions: normalized.slice(0, n) });
    }

    // ── Normal generation ─────────────────────────────────────────────────────
    if (!content?.trim() && !images?.length) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const prompt = buildPrompt(type, count);
    if (!prompt) return NextResponse.json({ error: "Invalid type: " + type }, { status: 400 });

    if (images && images.length > 0) {
      const batches: string[][] = [];
      for (let i = 0; i < images.length; i += BATCH_SIZE) batches.push(images.slice(i, i + BATCH_SIZE));

      const geminiPrompt = buildGeminiPrompt(type, count);
      const allQuestions: any[] = [];

      for (let b = 0; b < batches.length; b++) {
        try {
          console.log(`[generate] batch ${b+1}/${batches.length}`);
          // Ask Gemini to return JSON directly — no separate conversion step
          const raw = await callGemini(batches[b], geminiPrompt);
          console.log(`[generate] batch ${b+1} raw:`, raw.slice(0, 100));
          const batchQs = parseAIJson(raw);
          if (Array.isArray(batchQs) && batchQs.length > 0) {
            allQuestions.push(...batchQs);
            console.log(`[generate] batch ${b+1}: found ${batchQs.length} questions, total: ${allQuestions.length}`);
          } else {
            // Gemini failed to return JSON — fall back to Groq vision extract then convert
            console.log(`[generate] batch ${b+1}: JSON parse failed, trying Groq fallback`);
            try {
              const extracted = await callGroqVision(batches[b], `Extract questions as plain text with options and answers.`);
              if (extracted) {
                const fallbackRaw = await generateText([
                  { role: "system", content: prompt },
                  { role: "user", content: `Convert to JSON array:\n\n${extracted}` },
                ], 3000, isPremium);
                const fallbackQs = parseAIJson(fallbackRaw);
                if (Array.isArray(fallbackQs)) allQuestions.push(...fallbackQs);
              }
            } catch (fe: any) { console.error(`[generate] batch ${b+1} fallback failed:`, fe.message); }
          }
          if (b < batches.length - 1) await new Promise(r => setTimeout(r, 300));
        } catch (e: any) { console.error(`[generate] batch ${b+1} failed:`, e.message); }
      }

      if (allQuestions.length === 0) {
        return NextResponse.json({ error: "Could not extract questions from PDF. Try a clearer scan." }, { status: 422 });
      }

      let rawQs = allQuestions;

      if (!rawQs || !rawQs.length) {
        return NextResponse.json({ error: "Could not parse questions. Please try again." }, { status: 422 });
      }

      const normalized = normalizeQuestions(rawQs);
      const totalFound = normalized.length;
      const needsChoice = totalFound > 0 && totalFound < count;
      console.log("[generate] found:", totalFound, "requested:", count, "needsChoice:", needsChoice);
      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound, requested: count, needsChoice,
        notice: needsChoice ? `Only ${totalFound} questions found in this PDF. Try setting your count to ${totalFound}.` : null,
      });

    } else {
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
        totalFound, requested: count, needsChoice,
        notice: needsChoice ? `Only ${totalFound} questions could be generated. Try setting your count to ${totalFound}.` : null,
      });
    }

  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[generate] FATAL:", msg);
    return NextResponse.json({ error: friendlyError(msg) }, { status: 500 });
  }
}
