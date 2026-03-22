import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const BATCH_SIZE = 5;
const MAX_TEXT_CHARS = 6000;

function truncateContent(content: string): string {
  return content.length <= MAX_TEXT_CHARS ? content : content.slice(0, MAX_TEXT_CHARS) + "\n[truncated]";
}

function friendlyError(e: any): string {
  const msg = String(e?.message || e);
  if (msg.includes("too large") || msg.includes("TPM") || msg.includes("tokens")) return "Content too long. Try pasting fewer questions.";
  if (msg.includes("429") || msg.includes("rate")) return "AI is busy right now. Please wait a few seconds and try again.";
  if (msg.includes("401") || msg.includes("API key")) return "Server configuration error. Please contact support.";
  return "Something went wrong. Please try again.";
}

function parseAIJson(raw: string): any {
  const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const arr = clean.match(/\[[\s\S]*\]/)?.[0];
  if (!arr) return null;
  try { return JSON.parse(arr); } catch (_) {}
  try { return JSON.parse(arr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")); } catch (_) {}
  return null;
}

// Force A. B. C. D. labels on all options
function normalizeQuestions(questions: any[]): any[] {
  if (!Array.isArray(questions)) return [];
  const LABELS = ["A", "B", "C", "D"];
  return questions.map((q, qi) => {
    if (!q || typeof q !== "object") return q;
    let options: string[] = (q.options || []).slice(0, 4);
    
    // Check if already properly labeled
    const properlyLabeled = options.length >= 2 && options.every((opt: string, i: number) =>
      typeof opt === "string" && new RegExp(`^${LABELS[i]}[.)\\s]`, "i").test(opt)
    );
    
    if (!properlyLabeled) {
      options = options.map((opt: string, i: number) => {
        const s = typeof opt === "string" ? opt.replace(/^[A-Za-z][.)]\s*/, "").trim() : String(opt);
        return `${LABELS[i]}. ${s}`;
      });
    } else {
      // Normalize format to always be "A. text" not "A) text" or "A.text"
      options = options.map((opt: string, i: number) => {
        const s = opt.replace(/^[A-Za-z][.)]\s*/, "").trim();
        return `${LABELS[i]}. ${s}`;
      });
    }
    
    // Normalize answer to single letter
    const rawAnswer = String(q.answer || "A").trim().toUpperCase();
    const answer = rawAnswer.match(/^([ABCD])/)?.[1] || "A";
    
    return { ...q, id: q.id || qi + 1, options, answer };
  });
}

async function callGroqWithRetry(apiKey: string, model: string, messages: any[], maxTokens = 3000, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, temperature: 0.3, max_tokens: maxTokens, messages }),
      });
      if (res.status === 429 || res.status === 503) {
        if (attempt < retries) { await new Promise(r => setTimeout(r, attempt * 2000)); continue; }
        throw new Error("AI is busy right now. Please wait a few seconds and try again.");
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message || `Error ${res.status}`);
      }
      const data = await res.json();
      return data.choices[0].message.content as string;
    } catch (e: any) {
      if (attempt === retries) throw e;
      if (e.message?.includes("busy") || e.message?.includes("rate")) {
        await new Promise(r => setTimeout(r, attempt * 2000));
      } else throw e;
    }
  }
  throw new Error("Failed after retries");
}

function buildSystemPrompt(type: string, count: number): string {
  const mathRules = `Math: wrap in $...$. Examples: $\\frac{a}{b}$, $\\lim_{x\\to 0}$, $\\sqrt{x}$, $x^2$, $\\sin(x)$, $\\theta$.`;
  const optRules = `Options MUST be labeled A. B. C. D. always. Relabel if original uses other labels. Ignore checkmarks/ticks.`;

  if (type === "notes_quiz") return `Nigerian university exam AI. Generate EXACTLY ${count} MCQ questions from the given material.
Return ONLY a raw JSON array, no markdown, no backticks.
${mathRules}
${optRules}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]
IMPORTANT: Generate EXACTLY ${count} questions. Not fewer, not more. If material is limited, create variations.
answer is single letter A B C D. Always include explanation.`;

  if (type === "pq_quiz") return `Convert Nigerian past exam questions into a quiz.
Return ONLY a raw JSON array, no markdown, no backticks.
${mathRules}
${optRules}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"...","year":""}]
Extract as many questions as possible up to ${count}. answer is single letter A B C D. Always include explanation.`;

  return "";
}

const VISION_SUFFIX = `
Scanned exam pages. Extract ALL questions visible. Label options A. B. C. D. Ignore checkmarks.
Math in $...$: $\\frac{a}{b}$, $\\lim_{x\\to 0}$, $\\sqrt{x}$, $x^2$.
Return only the JSON array.`;

async function processVisionBatches(apiKey: string, systemPrompt: string, images: string[], type: string, count: number): Promise<any[]> {
  const batches: string[][] = [];
  for (let i = 0; i < images.length; i += BATCH_SIZE) batches.push(images.slice(i, i + BATCH_SIZE));
  const allQuestions: any[] = [];

  for (let b = 0; b < batches.length; b++) {
    if (type === "pq_quiz" && allQuestions.length >= count) break;
    const batch = batches[b];
    const imageContent = batch.map((b64: string) => ({
      type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` },
    }));
    const remaining = count - allQuestions.length;
    const batchPrompt = type === "pq_quiz"
      ? `Extract up to ${remaining} questions from these ${batch.length} page(s). Return only the JSON array.`
      : `Generate up to ${Math.min(remaining, Math.ceil(count / batches.length))} questions from these ${batch.length} page(s). Return only the JSON array.`;
    try {
      const raw = await callGroqWithRetry(apiKey, VISION_MODEL, [
        { role: "system", content: systemPrompt + VISION_SUFFIX },
        { role: "user", content: [...imageContent, { type: "text", text: batchPrompt }] },
      ], 3000);
      const parsed = parseAIJson(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((q: any, i: number) => { q.id = allQuestions.length + i + 1; });
        allQuestions.push(...parsed);
      }
    } catch (e: any) { console.error(`Batch ${b + 1} failed:`, e.message); }
  }
  return allQuestions;
}

export async function POST(req: NextRequest) {
  try {
    const { type, content, images, count = 10, isPremium = false } = await req.json();

    if (!content?.trim() && !images?.length) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(type, count);
    if (!systemPrompt) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    // Key selection — premium users get dedicated key
    const premiumKey = process.env.GROQ_PREMIUM_KEY;
    const textKey = process.env.GROQ_TEXT_KEY || process.env.GROQ_API_KEY;
    const visionKey = process.env.GROQ_VISION_KEY || process.env.GROQ_API_KEY;

    if (images && images.length > 0) {
      const key = (isPremium && premiumKey) ? premiumKey : visionKey;
      if (!key) return NextResponse.json({ error: "Server configuration error." }, { status: 500 });

      const rawQuestions = await processVisionBatches(key, systemPrompt, images, type, count);
      if (rawQuestions.length === 0) {
        return NextResponse.json({ error: "Could not extract questions from PDF. Try a clearer scan." }, { status: 422 });
      }

      const normalized = normalizeQuestions(rawQuestions);
      const totalFound = normalized.length;
      const final = normalized.slice(0, count);

      // If fewer found than requested, include a notice but don't error
      return NextResponse.json({
        questions: final,
        totalFound,
        requested: count,
        notice: totalFound < count ? `Found ${totalFound} questions in the PDF (you selected ${count}).` : null,
      });

    } else {
      const key = (isPremium && premiumKey) ? premiumKey : textKey;
      if (!key) return NextResponse.json({ error: "Server configuration error." }, { status: 500 });

      const safeContent = truncateContent(content);
      const userMessage = type === "pq_quiz"
        ? `Convert these past questions into a quiz. Return ONLY the JSON array:\n\n${safeContent}`
        : safeContent;

      const raw = await callGroqWithRetry(key, TEXT_MODEL, [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ], 3000);

      const rawQuestions = parseAIJson(raw);
      if (!rawQuestions || !Array.isArray(rawQuestions)) {
        return NextResponse.json({ error: "Could not generate questions. Please try again." }, { status: 422 });
      }

      const normalized = normalizeQuestions(rawQuestions);
      const totalFound = normalized.length;
      const final = normalized.slice(0, count);

      return NextResponse.json({
        questions: final,
        totalFound,
        requested: count,
        notice: totalFound < count ? `AI generated ${totalFound} questions from this content (you selected ${count}).` : null,
      });
    }

  } catch (err: any) {
    console.error("[/api/generate]", err.message);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
