import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const BATCH_SIZE = 5;
const MAX_CHARS = 6000;
const MAX_CHARS_VISION = 10000;

// For JSON conversion chunks
const MAX_CHARS_PER_JSON_CHUNK = 2500; // safe per-call size

function truncate(s: string, max = MAX_CHARS) {
  return s.length <= max ? s : s.slice(0, max) + "\n[truncated]";
}

function parseAIJson(raw: string): any {
  let clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  try {
    const r = JSON.parse(clean);
    return Array.isArray(r) ? r : null;
  } catch (_) {}
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start !== -1 && end > start) {
    const arr = clean.slice(start, end + 1);
    try { return JSON.parse(arr); } catch (_) {}
    try { return JSON.parse(arr.replace(/\\(?!["\\\/bfnrtu])/g, "\\\\")); } catch (_) {}
    try { return JSON.parse(arr.replace(/[\x00-\x1F\x7F]/g, " ")); } catch (_) {}
  }
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
  const L = ["A", "B", "C", "D"];
  return qs.map((q, i) => {
    if (!q || typeof q !== "object") return q;
    const opts = (q.options || []).slice(0, 4).map((o: string, j: number) => {
      const text =
        typeof o === "string"
          ? o.replace(/^[A-Za-z][.)]\s*/, "").trim()
          : String(o);
      return `${L[j]}. ${text}`;
    });
    const ans =
      String(q.answer || "A")
        .trim()
        .toUpperCase()
        .match(/^([ABCD])/)?.[1] || "A";

    const explanation =
      typeof q.explanation === "string" && q.explanation.trim().length > 0
        ? q.explanation.trim()
        : "The chosen option is correct based on the information in the question and options.";

    return { ...q, id: q.id || i + 1, options: opts, answer: ans, explanation };
  });
}

function friendlyError(msg: string): string {
  if (msg.includes("too large") || msg.includes("TPM") || msg.includes("tokens"))
    return "Content too long. Try pasting fewer questions.";
  if (msg.includes("busy") || msg.includes("rate") || msg.includes("429"))
    return "AI is busy. Please wait a few seconds and try again.";
  if (msg.includes("401") || msg.includes("Invalid API") || msg.includes("api_key"))
    return "Server configuration error. Please contact support.";
  return `Error: ${msg.slice(0, 120)}`;
}

async function callGroq(
  apiKey: string,
  model: string,
  messages: any[],
  maxTokens = 3000
): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: maxTokens,
        messages,
      }),
    });
    if (res.status === 429 || res.status === 503) {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 5000));
        continue;
      }
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

async function generateText(
  messages: any[],
  maxTokens = 3000,
  isPremium = false
): Promise<string> {
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
      if (
        e.message.includes("rate") ||
        e.message.includes("429") ||
        e.message.includes("busy") ||
        e.message.includes("TPD")
      )
        continue;
      throw e;
    }
  }
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orKey}`,
        "HTTP-Referer": "https://studiengine.vercel.app",
        "X-Title": "Studiengine",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });
    if (res.ok)
      return (await res.json()).choices?.[0]?.message?.content || "";
  }
  throw new Error("AI is busy. Please wait and try again.");
}

async function callGemini(images: string[], prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No Gemini key");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const parts: any[] = images.map((b64) => ({
    inline_data: { mime_type: "image/jpeg", data: b64 },
  }));
  parts.push({ text: prompt });
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.1 },
      }),
    });
    if (res.status === 429) {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 8000));
        continue;
      }
      throw new Error("Gemini rate limited");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `Gemini ${res.status}`);
    }
    return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  throw new Error("Gemini failed");
}

async function callGroqVision(
  images: string[],
  prompt: string
): Promise<string> {
  const keys = [
    process.env.GROQ_VISION_KEY,
    process.env.GROQ_TEXT_KEY,
    process.env.GROQ_ANALYZE_KEY,
    process.env.GROQ_API_KEY,
  ].filter(Boolean) as string[];
  const unique = keys.filter((k, i) => keys.indexOf(k) === i);
  const imageContent = images.map((b64) => ({
    type: "image_url",
    image_url: { url: `data:image/jpeg;base64,${b64}` },
  }));
  for (const key of unique) {
    try {
      return await callGroq(
        key,
        VISION_MODEL,
        [
          {
            role: "user",
            content: [...imageContent, { type: "text", text: prompt }],
          },
        ],
        2000
      );
    } catch (e: any) {
      if (e.message.includes("rate")) continue;
      throw e;
    }
  }
  throw new Error("Vision AI busy.");
}

async function extractBatch(images: string[], prompt: string): Promise<string> {
  try {
    return await callGemini(images, prompt);
  } catch (e: any) {
    console.log("[generate] Gemini failed:", e.message, "- trying Groq vision");
    return await callGroqVision(images, prompt);
  }
}

const EXTRACT_PROMPT = `Extract ALL questions from these exam pages as plain text.
For each question include: question number, full question text, all options A B C D, correct answer marked [CORRECT] if visible.
KEEP ALL MATH EXACTLY: preserve \\\\frac, \\\\int, \\\\sqrt, \\\\lim, \\\\sin and all backslashes. Do not simplify math.
Extract every single question. Be thorough. Do not skip any.`;

function fixLatex(text: string): string {
  return text
    .replace(/(?<!\\)frac\{/g, "\\\\frac{")
    .replace(/(?<!\\)int_/g, "\\\\int_")
    .replace(/(?<!\\)int\^/g, "\\\\int^")
    .replace(/(?<!\\)lim_/g, "\\\\lim_")
    .replace(/(?<!\\)sqrt\{/g, "\\\\sqrt{")
    .replace(/\btheta\b/g, "\\\\theta")
    .replace(/\balpha\b/g, "\\\\alpha")
    .replace(/\bbeta\b/g, "\\\\beta")
    .replace(/\bsigma\b/g, "\\\\sigma")
    .replace(/\binfty\b/g, "\\\\infty");
}

function buildPrompt(type: string, count: number): string {
  const math = `Math MUST be in $...$: $\\\\frac{a}{b}$, $\\\\int_0^e$, $\\\\lim_{x\\\\to 0}$, $\\\\sqrt{x}$, $x^2$, $\\\\sin(x)$.`;
  const opts = `Options MUST be labeled A. B. C. D. Ignore checkmarks.`;
  if (type === "notes_quiz")
    return `Nigerian exam AI. Generate EXACTLY ${count} MCQs from the material.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]
EXACTLY ${count} questions. Answer = single letter A B C D. Always include explanation.`;
  if (type === "pq_quiz")
    return `Convert Nigerian past exam questions into a quiz.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"...","year":""}]
Extract EVERY question. Do NOT stop early. Do NOT limit count. Answer = single letter A B C D. Always explain.`;
  return "";
}

// ---- HELPERS FOR CHUNK + MERGE (VISION → JSON) -----------------------------

function splitCombinedIntoQuestionBlocks(text: string): string[] {
  const parts = text
    .split(/(?=Question\s+\d+|\*\*Question\s+\d+|\n##\s*\d+)/gi)
    .filter(Boolean);
  if (parts.length <= 1) return [text];
  return parts;
}

function groupBlocksIntoChunks(blocks: string[], maxCharsPerChunk: number): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const block of blocks) {
    if (!block.trim()) continue;
    if ((current + "\n\n" + block).length > maxCharsPerChunk) {
      if (current.trim()) chunks.push(current.trim());
      current = block;
    } else {
      current = current ? current + "\n\n" + block : block;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function convertChunkToJson(
  chunk: string,
  type: string,
  isPremium: boolean
): Promise<any[]> {
  const sys =
    type === "pq_quiz"
      ? `You are converting OCR'd past exam questions into JSON.
The text already has question numbers and options A, B, C, D, sometimes [CORRECT].
For THIS CHUNK ONLY, convert EVERY question visible into JSON objects.
Return ONLY a JSON array. Do NOT summarize or skip.
Every object MUST include a non-empty "explanation" explaining why the correct option is right.`
      : `You are converting OCR'd study material into MCQ JSON.
For THIS CHUNK ONLY, create MCQs that cover the questions in the text.
Return ONLY a JSON array.
Every object MUST include a non-empty "explanation" explaining why the correct option is right.`;

  const user = `TEXT CHUNK (only convert questions from this chunk):\n\n${chunk}\n\nReturn ONLY a JSON array like:
[{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"short clear explanation"}]`;

  const raw = await generateText(
    [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    2500,
    isPremium
  );

  const parsed = parseAIJson(raw);
  if (!parsed || !parsed.length) return [];
  return parsed;
}

// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
      content,
      images,
      count = 10,
      isPremium = false,
      action,
      existingQuestions,
      fillCount,
      topic,
    } = body;

    console.log(
      "[generate] type:",
      type,
      "images:",
      images?.length || 0,
      "count:",
      count,
      "action:",
      action
    );

    // Fill remaining
    if (action === "fill_remaining") {
      const n = fillCount || 5;
      const raw = await generateText(
        [
          {
            role: "system",
            content: `Generate exactly ${n} NEW MCQ questions about: "${
              topic || "same exam subject"
            }". No repeats. Return ONLY JSON array. Math in $...$. Options A. B. C. D. Always explain. Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]`,
          },
          {
            role: "user",
            content: `Generate exactly ${n} fresh questions. Return only the JSON array.`,
          },
        ],
        3000,
        isPremium
      );
      const rawQs = parseAIJson(raw);
      if (!rawQs?.length)
        return NextResponse.json(
          { error: "Could not generate additional questions." },
          { status: 422 }
        );
      const normalized = normalizeQuestions(rawQs);
      const startId = (existingQuestions?.length || 0) + 1;
      normalized.forEach((q, i) => {
        q.id = startId + i;
      });
      return NextResponse.json({ questions: normalized.slice(0, n) });
    }

    if (!content?.trim() && !images?.length) {
      return NextResponse.json(
        { error: "No content provided" },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(type, count);
    if (!prompt)
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    // ---- IMAGES BRANCH WITH CHUNK + EARLY STOP ---------------------------
    if (images && images.length > 0) {
      const batches: string[][] = [];
      for (let i = 0; i < images.length; i += BATCH_SIZE)
        batches.push(images.slice(i, i + BATCH_SIZE));

      const extracted: string[] = [];
      for (let b = 0; b < batches.length; b++) {
        try {
          console.log(
            `[generate] extracting batch ${b + 1}/${batches.length}`
          );
          const text = await extractBatch(batches[b], EXTRACT_PROMPT);
          if (text) {
            extracted.push(text);
            console.log(
              `[generate] batch ${b + 1}: ${text.length} chars`
            );
          }
          if (b < batches.length - 1)
            await new Promise((r) => setTimeout(r, 1500));
        } catch (e: any) {
          console.error(
            `[generate] batch ${b + 1} failed:`,
            e.message
          );
        }
      }

      if (extracted.length === 0) {
        return NextResponse.json(
          { error: "Could not read PDF pages. Try a clearer scan." },
          { status: 422 }
        );
      }

      const rawCombined = extracted.join("\n\n");
      const combined = truncate(
        fixLatex(rawCombined),
        MAX_CHARS_VISION
      );
      console.log(
        "[generate] combined:",
        combined.length,
        "chars from",
        extracted.length,
        "batches"
      );
      console.log(
        "[generate] combined snippet:",
        combined.slice(0, 300)
      );

      const blocks = splitCombinedIntoQuestionBlocks(combined);
      const jsonChunks = groupBlocksIntoChunks(
        blocks,
        MAX_CHARS_PER_JSON_CHUNK
      );
      console.log(
        "[generate] jsonChunks:",
        jsonChunks.length,
        "blocks:",
        blocks.length
      );

      const allRawQs: any[] = [];
      const targetWithBuffer = count + 3;

      for (let i = 0; i < jsonChunks.length; i++) {
        const chunk = jsonChunks[i];
        console.log(
          `[generate] converting chunk ${i + 1}/${jsonChunks.length}, len:`,
          chunk.length
        );
        try {
          const chunkQs = await convertChunkToJson(
            chunk,
            type,
            isPremium
          );
          console.log(
            `[generate] chunk ${i + 1} ->`,
            chunkQs.length,
            "questions"
          );
          allRawQs.push(...chunkQs);

          if (allRawQs.length >= targetWithBuffer) {
            console.log(
              "[generate] early stop (vision): got enough questions:",
              allRawQs.length
            );
            break;
          }
        } catch (e: any) {
          console.error(
            `[generate] chunk ${i + 1} JSON failed:`,
            e.message
          );
        }
      }

      if (!allRawQs.length) {
        return NextResponse.json(
          { error: "Could not parse questions. Please try again." },
          { status: 422 }
        );
      }

      const normalized = normalizeQuestions(allRawQs);
      const totalFound = normalized.length;
      const needsChoice =
        jsonChunks.length === 1 && totalFound > 0 && totalFound < count;

      console.log(
        "[generate] found (merged):",
        totalFound,
        "requested:",
        count,
        "needsChoice:",
        needsChoice
      );

      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound,
        requested: count,
        needsChoice,
        notice: needsChoice
          ? `Only ${totalFound} questions found. Try setting count to ${totalFound}.`
          : null,
      });
    }

    // ---- TEXT BRANCH (IMPROVED PROMPT) -----------------------------------
    const safe = truncate(content);
    const userMsg =
      type === "pq_quiz"
        ? `The text below is a list of past exam questions with their options.
Your job: convert EVERY question you see into JSON objects. Do not skip any. Do not summarize.
TEXT:
${safe}

Return ONLY a JSON array like:
[{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"short clear explanation","year":""}]`
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
    if (!rawQs?.length)
      return NextResponse.json(
        { error: "Could not generate questions. Please try again." },
        { status: 422 }
      );

    const normalized = normalizeQuestions(rawQs);
    const totalFound = normalized.length;
    const needsChoice = totalFound > 0 && totalFound < count;
    return NextResponse.json({
      questions: normalized.slice(0, count),
      totalFound,
      requested: count,
      needsChoice,
      notice: needsChoice
        ? `Only ${totalFound} questions generated. Try setting count to ${totalFound}.`
        : null,
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[generate] FATAL:", msg);
    return NextResponse.json(
      { error: friendlyError(msg) },
      { status: 500 }
    );
  }
}
