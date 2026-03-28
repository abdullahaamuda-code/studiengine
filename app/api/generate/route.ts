import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_VISION_PAGES = 5;

// Different limits for free vs premium (text path)
const MAX_CHARS_FREE = 6000;
const MAX_CHARS_PREMIUM = 15000;

// Shared truncate helper
function truncate(s: string, max: number) {
  return s.length <= max ? s : s.slice(0, max) + "\n[truncated]";
}

function parseAIJson(raw: string): any {
  const trimmed = raw.trim();
  if (
    trimmed.startsWith("Request Entity") ||
    trimmed.startsWith("<!") ||
    trimmed.startsWith("Error") ||
    trimmed.length < 10
  )
    return null;

  const clean = trimmed
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  try {
    const r = JSON.parse(clean);
    return Array.isArray(r) ? r : null;
  } catch (_) {}

  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start !== -1 && end > start) {
    const arr = clean.slice(start, end + 1);
    try {
      return JSON.parse(arr);
    } catch (_) {}
    try {
      return JSON.parse(arr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\"));
    } catch (_) {}
    try {
      return JSON.parse(arr.replace(/[\x00-\x1F\x7F]/g, " "));
    } catch (_) {}
  }

  const objects: any[] = [];
  const objRegex = /\{[^{}]*"question"[^{}]*\}/g;
  let m;
  while ((m = objRegex.exec(clean)) !== null) {
    try {
      objects.push(JSON.parse(m[0]));
    } catch (_) {}
  }
  return objects.length > 0 ? objects : null;
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
    return { ...q, id: q.id || i + 1, options: opts, answer: ans };
  });
}

function friendlyError(msg: string): string {
  if (msg.includes("too large") || msg.includes("TPM") || msg.includes("TPD"))
    return "Content too long. Try pasting fewer questions or a shorter section.";
  if (msg.includes("rate") || msg.includes("429") || msg.includes("busy"))
    return "AI is busy right now. Please wait a few seconds and try again.";
  if (msg.includes("401") || msg.includes("Invalid API"))
    return "Server configuration error. Please contact support.";
  return "Something went wrong. Please try again.";
}

async function callGroq(
  key: string,
  model: string,
  messages: any[],
  maxTokens = 3000
): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model, temperature: 0.3, max_tokens: maxTokens, messages }),
    });
    if (res.status === 429 || res.status === 503) {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 4000));
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

async function callText(
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
  if (!key) throw new Error("No Gemini key configured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const parts: any[] = [
    ...images.map((b64) => ({
      inline_data: { mime_type: "image/jpeg", data: b64 },
    })),
    { text: prompt },
  ];
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.1 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Gemini ${res.status}`);
  }
  return (
    (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || ""
  );
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
  throw new Error("Vision AI busy");
}

function buildPrompt(type: string, count: number): string {
  const math = `Math in $...$: $\\frac{a}{b}$, $\\lim_{x\\to 0}$, $\\sqrt{x}$, $x^2$, $\\sin(x)$.`;
  const opts = `Options labeled A. B. C. D. always.`;
  const fmt =
    `[{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],` +
    `"answer":"A","explanation":"..."}]`;
  if (type === "notes_quiz")
    return `Nigerian exam AI. Generate EXACTLY ${count} MCQs from the material.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: ${fmt}
EXACTLY ${count} questions. Answer = A/B/C/D. Always include explanation.`;
  if (type === "pq_quiz")
    return `Convert past exam questions into a quiz.
Return ONLY a JSON array, no markdown. ${math} ${opts}
Format: ${fmt}
Extract EVERY question. Do NOT limit the count. Answer = A/B/C/D. Always include explanation.`;
  return "";
}

const VISION_EXTRACT_PROMPT = `Extract ALL questions from these exam pages as plain text.
Include: question number, full question text, all options A B C D, correct answer marked [CORRECT] if visible.
Preserve math exactly: keep \\frac, \\int, \\sqrt, \\lim, \\sin with backslashes intact.
Extract every question visible. Do not skip any.`;

function fixLatex(text: string): string {
  return text
    .replace(/\brac\{/g, "\\frac{")
    .replace(/\bint_/g, "\\int_")
    .replace(/\bint\^/g, "\\int^")
    .replace(/\blim_/g, "\\lim_")
    .replace(/\bsqrt\{/g, "\\sqrt{")
    .replace(/\btheta\b/g, "\\theta")
    .replace(/\balpha\b/g, "\\alpha")
    .replace(/\bbeta\b/g, "\\beta")
    .replace(/\bsigma\b/g, "\\sigma")
    .replace(/\binfty\b/g, "\\infty");
}

export async function POST(req: NextRequest) {
  try {
    const { type, content, images, count = 10, isPremium = false } =
      await req.json();

    console.log(
      "[generate] type:",
      type,
      "images:",
      images?.length || 0,
      "count:",
      count,
      "premium:",
      isPremium
    );

    if (!content?.trim() && !images?.length) {
      return NextResponse.json(
        { error: "No content provided." },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(type, count);
    if (!prompt)
      return NextResponse.json(
        { error: "Invalid request type." },
        { status: 400 }
      );

    // ── VISION PATH (scanned PDF — beta, max 5 pages) ─────────────────────────
    if (images && images.length > 0) {
      const pages = images.slice(0, MAX_VISION_PAGES);
      console.log(
        "[generate] vision: processing",
        pages.length,
        "pages (max",
        MAX_VISION_PAGES,
        ")"
      );

      let extracted = "";
      try {
        extracted = await callGemini(pages, VISION_EXTRACT_PROMPT);
        console.log(
          "[generate] Gemini extracted:",
          extracted.length,
          "chars"
        );
      } catch (e: any) {
        console.log(
          "[generate] Gemini failed:",
          e.message,
          "- trying Groq vision"
        );
        try {
          extracted = await callGroqVision(pages, VISION_EXTRACT_PROMPT);
          console.log(
            "[generate] Groq vision extracted:",
            extracted.length,
            "chars"
          );
        } catch (e2: any) {
          console.error(
            "[generate] both vision models failed:",
            e2.message
          );
          return NextResponse.json(
            {
              error:
                "Could not read the scanned PDF. Scanned PDF support is in beta — try copying the text and pasting it instead.",
            },
            { status: 422 }
          );
        }
      }

      if (!extracted || extracted.length < 20) {
        return NextResponse.json(
          {
            error:
              "Could not extract text from the PDF. Try copying the text and pasting it instead.",
          },
          { status: 422 }
        );
      }

      // vision: keep using 6000 chars for stability
      const safeVision = truncate(fixLatex(extracted), MAX_CHARS_FREE);
      const userMsg =
        type === "pq_quiz"
          ? `Convert ALL these extracted questions into a JSON array:\n\n${safeVision}`
          : safeVision;

      const raw = await callText(
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
          {
            error:
              "Could not generate questions from this scan. Try copying the text and pasting it for better results.",
          },
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
        notice:
          totalFound < count
            ? `Found ${totalFound} questions in this scan. Showing all ${totalFound}.`
            : null,
      });
    }

    // ── TEXT PATH (reliable) ──────────────────────────────────────────────────
    const maxChars = isPremium ? MAX_CHARS_PREMIUM : MAX_CHARS_FREE;
    const safe = truncate(content, maxChars);

    const userMsg =
      type === "pq_quiz"
        ? `Convert these past questions into a quiz. Return ONLY the JSON array:\n\n${safe}`
        : safe;

    const raw = await callText(
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
      notice:
        totalFound < count
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
