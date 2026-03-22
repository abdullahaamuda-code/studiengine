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

function friendlyError(msg: string): string {
  if (msg.includes("too large") || msg.includes("TPM") || msg.includes("tokens")) return "Content too long. Try pasting fewer questions.";
  if (msg.includes("429") || msg.includes("rate limit")) return "AI is busy. Please wait a few seconds and try again.";
  if (msg.includes("401") || msg.includes("Invalid API") || msg.includes("api_key")) return "Server configuration error. Please contact support.";
  return `Error: ${msg.slice(0, 100)}`;
}

async function groq(apiKey: string, model: string, messages: any[], maxTokens = 3000, retries = 4): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.3, max_tokens: maxTokens, messages }),
    });
    if (res.status === 429 || res.status === 503) {
      const wait = attempt * 5000; // 5s, 10s, 15s, 20s
      console.log(`[generate] rate limited, waiting ${wait}ms (attempt ${attempt})`);
      if (attempt < retries) { await new Promise(r => setTimeout(r, wait)); continue; }
      throw new Error("AI is busy. Please wait and try again.");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `Groq ${res.status}`);
    }
    return (await res.json()).choices[0].message.content as string;
  }
  throw new Error("Failed after retries");
}

// Try multiple keys in sequence — if one is rate limited, try the next
async function groqWithFallback(keys: string[], model: string, messages: any[], maxTokens = 3000): Promise<string> {
  const validKeys = keys.filter(Boolean);
  for (const key of validKeys) {
    try {
      return await groq(key, model, messages, maxTokens, 2);
    } catch (e: any) {
      if (e.message.includes("busy") || e.message.includes("rate") || e.message.includes("429")) {
        console.log("[generate] key rate limited, trying next key...");
        continue;
      }
      throw e; // Non-rate-limit error, don't try next key
    }
  }
  throw new Error("AI is busy. Please wait a few seconds and try again.");
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

const EXTRACT_PROMPT = `Extract ALL questions from these exam pages.
For each question: include the question text, all options (A B C D), and mark correct answer with [CORRECT] if visible.
For math: write fractions as (a/b), limits as lim(x->0), roots as sqrt(x), powers as x^2.
List every single question you can see. Be thorough.`;


// Gemini vision — much better for scanned documents, 1500 free req/day
async function geminiExtract(apiKey: string, images: string[], prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const parts: any[] = images.map(b64 => ({
    inline_data: { mime_type: "image/jpeg", data: b64 }
  }));
  parts.push({ text: prompt });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: 2000, temperature: 0.2 },
    }),
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
    const body = await req.json();
    const { type, content, images, count = 10, isPremium = false } = body;

    console.log("[generate] type:", type, "images:", images?.length || 0, "count:", count, "isPremium:", isPremium);

    if (!content?.trim() && !images?.length) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const prompt = buildPrompt(type, count);
    if (!prompt) return NextResponse.json({ error: "Invalid type: " + type }, { status: 400 });

    const textKey = process.env.GROQ_TEXT_KEY || process.env.GROQ_API_KEY;
    const visionKey = process.env.GROQ_VISION_KEY || process.env.GROQ_API_KEY;
    const premiumKey = process.env.GROQ_PREMIUM_KEY;

    console.log("[generate] keys: text=", !!textKey, "vision=", !!visionKey, "premium=", !!premiumKey);

    if (!textKey && !visionKey) {
      console.error("[generate] No API keys configured");
      return NextResponse.json({ error: "Server not configured. Contact support." }, { status: 500 });
    }

    const activeText = (isPremium && premiumKey) ? premiumKey : (textKey || "");
    const activeVision = (isPremium && premiumKey) ? premiumKey : (visionKey || "");

    if (images && images.length > 0) {
      // Vision path: extract text from pages, then convert to questions
      console.log("[generate] vision path, batches:", Math.ceil(images.length / BATCH_SIZE));

      const batches: string[][] = [];
      for (let i = 0; i < images.length; i += BATCH_SIZE) batches.push(images.slice(i, i + BATCH_SIZE));

      const extracted: string[] = [];
      for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        const imgs = batch.map((b64: string) => ({
          type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` },
        }));
        try {
          console.log(`[generate] extracting batch ${b+1}/${batches.length}`);
          const geminiKey = process.env.GEMINI_API_KEY;
          let text: string;
          if (geminiKey) {
            // Use Gemini — better for scanned docs, 1500 free req/day
            text = await geminiExtract(geminiKey, batch, EXTRACT_PROMPT);
          } else {
            // Fallback to Groq vision
            const allVisionKeys = [
              process.env.GROQ_VISION_KEY,
              process.env.GROQ_TEXT_KEY,
              process.env.GROQ_ANALYZE_KEY,
              process.env.GROQ_PREMIUM_KEY,
              process.env.GROQ_API_KEY,
            ].filter(Boolean) as string[];
            text = await groqWithFallback(allVisionKeys, VISION_MODEL, [{
              role: "user",
              content: [...imgs, { type: "text", text: EXTRACT_PROMPT }],
            }], 2000);
          }
          extracted.push(text);
          console.log(`[generate] batch ${b+1} extracted ${text.length} chars`);
          // Small delay between batches to avoid rate limiting
          if (b < batches.length - 1) await new Promise(r => setTimeout(r, 1000));
        } catch (e: any) {
          console.error(`[generate] batch ${b+1} failed:`, e.message);
        }
      }

      if (extracted.length === 0) {
        return NextResponse.json({ error: "Could not read PDF pages. Try a clearer scan." }, { status: 422 });
      }

      const combined = truncate(extracted.join("\n\n"));
      console.log("[generate] combined text length:", combined.length, "converting to questions...");

      const userMsg = type === "pq_quiz"
        ? `Convert ALL these extracted questions into a quiz JSON array:\n\n${combined}`
        : combined;

      const raw = await groq(activeText, TEXT_MODEL, [
        { role: "system", content: prompt },
        { role: "user", content: userMsg },
      ], 4000);

      console.log("[generate] raw response length:", raw.length, "first 100:", raw.slice(0, 100));

      const rawQs = parseAIJson(raw);
      if (!rawQs || !rawQs.length) {
        console.error("[generate] parse failed, raw:", raw.slice(0, 300));
        return NextResponse.json({ error: "Could not parse questions from PDF content. Please try again." }, { status: 422 });
      }

      const normalized = normalizeQuestions(rawQs);
      const totalFound = normalized.length;
      console.log("[generate] found", totalFound, "questions, requested", count);

      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound,
        requested: count,
        notice: totalFound < count ? `Found ${totalFound} questions in this PDF (you selected ${count}).` : null,
      });

    } else {
      // Text path
      console.log("[generate] text path, content length:", content?.length);

      const safe = truncate(content);
      const userMsg = type === "pq_quiz"
        ? `Convert these past questions into a quiz. Return ONLY the JSON array:\n\n${safe}`
        : safe;

      const raw = await groq(activeText, TEXT_MODEL, [
        { role: "system", content: prompt },
        { role: "user", content: userMsg },
      ], 3000);

      const rawQs = parseAIJson(raw);
      if (!rawQs || !rawQs.length) {
        return NextResponse.json({ error: "Could not generate questions. Please try again." }, { status: 422 });
      }

      const normalized = normalizeQuestions(rawQs);
      const totalFound = normalized.length;

      return NextResponse.json({
        questions: normalized.slice(0, count),
        totalFound,
        requested: count,
        notice: totalFound < count ? `Generated ${totalFound} questions from this content (you selected ${count}).` : null,
      });
    }

  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[generate] FATAL:", msg);
    return NextResponse.json({ error: friendlyError(msg) }, { status: 500 });
  }
}
