import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const BATCH_SIZE = 5;
const MAX_TEXT_CHARS = 6000;

function truncateContent(content: string): string {
  if (content.length <= MAX_TEXT_CHARS) return content;
  return content.slice(0, MAX_TEXT_CHARS) + "\n\n[Content truncated]";
}

function parseAIJson(raw: string): any {
  let clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const arrMatch = clean.match(/\[[\s\S]*\]/);
  const objMatch = clean.match(/\{[\s\S]*\}/);
  const jsonStr = arrMatch?.[0] ?? objMatch?.[0];
  if (!jsonStr) return null;
  try { return JSON.parse(jsonStr); } catch (_) {}
  const fixed = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  try { return JSON.parse(fixed); } catch (_) {}
  return null;
}

// Force A. B. C. D. labels on all options regardless of what AI returned
function normalizeQuestions(questions: any[]): any[] {
  if (!Array.isArray(questions)) return [];
  return questions.map((q, qi) => {
    if (!q || typeof q !== "object") return q;
    
    // Normalize options to always have A. B. C. D. prefix
    let options = q.options || [];
    const LABELS = ["A", "B", "C", "D"];
    
    // Check if options already have proper A. B. C. D. labels
    const hasProperLabels = options.length >= 2 && 
      options.every((opt: string, i: number) => 
        i < 4 && typeof opt === "string" && /^[ABCD]\.\s/i.test(opt)
      );
    
    if (!hasProperLabels) {
      // Strip any existing single-letter prefix and re-label
      options = options.slice(0, 4).map((opt: string, i: number) => {
        if (typeof opt !== "string") return `${LABELS[i]}. ${opt}`;
        // Remove existing label if present (single letter + period/dot/bracket + space)
        const stripped = opt.replace(/^[A-Za-z][.)]\s*/, "").trim();
        return `${LABELS[i]}. ${stripped}`;
      });
    }
    
    // Normalize answer to just be A, B, C, or D
    let answer = (q.answer || "A").toString().trim().toUpperCase();
    // Extract just the letter if answer is like "A." or "A) option text"
    const answerMatch = answer.match(/^([ABCD])/);
    answer = answerMatch ? answerMatch[1] : "A";
    
    return { ...q, options, answer, id: q.id || qi + 1 };
  });
}


function friendlyError(e: any): string {
  const msg: string = e?.message || String(e);
  if (msg.includes("too large") || msg.includes("TPM") || msg.includes("tokens")) {
    return "The content is too long. Try pasting fewer questions or a shorter section.";
  }
  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("Rate limit")) {
    return "AI is busy right now. Please wait a few seconds and try again.";
  }
  if (msg.includes("401") || msg.includes("API key")) {
    return "Server configuration error. Please contact support.";
  }
  return "Something went wrong. Please try again.";
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
  const mathRules = `For math: wrap in $...$. Examples: $\\frac{a}{b}$, $\\lim_{x\\to 0}$, $\\sqrt{x}$, $x^2$, $\\sin(x)$, $\\theta$. Plain text needs no dollar signs.`;
  const optionRules = `Options MUST be labeled A. B. C. D. always. Relabel if original uses other labels. Ignore checkmarks or ticks next to options.`;

  if (type === "notes_quiz") return `Nigerian university exam prep AI. Generate exactly ${count} MCQ questions from the given material.
Return ONLY a raw JSON array, no markdown, no backticks.
${mathRules}
${optionRules}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]
answer is single letter A B C D. Always include explanation.`;

  if (type === "pq_quiz") return `Convert Nigerian past exam questions into a quiz.
Return ONLY a raw JSON array, no markdown, no backticks.
${mathRules}
${optionRules}
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"...","year":""}]
answer is single letter A B C D. Always include explanation. Extract up to ${count} questions.`;

  return "";
}

const VISION_SUFFIX = `
Scanned exam pages. Extract all questions. Label options A. B. C. D. Ignore checkmarks next to options.
Math in $...$: fractions $\\frac{a}{b}$, limits $\\lim_{x\\to 0}$, roots $\\sqrt{x}$, powers $x^2$.
Return only the JSON array.`;

async function processVisionBatches(apiKey: string, systemPrompt: string, images: string[], type: string, count: number): Promise<any[]> {
  const batches: string[][] = [];
  for (let i = 0; i < images.length; i += BATCH_SIZE) batches.push(images.slice(i, i + BATCH_SIZE));

  const allQuestions: any[] = [];

  for (let b = 0; b < batches.length; b++) {
    if (allQuestions.length >= count) break;
    const batch = batches[b];
    const imageContent = batch.map((b64: string) => ({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${b64}` },
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
    } catch (e: any) {
      console.error(`Batch ${b + 1} failed:`, e.message);
    }
  }
  return allQuestions;
}

export async function POST(req: NextRequest) {
  try {
    const { type, content, images, count = 10 } = await req.json();

    if (!content?.trim() && !images?.length) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(type, count);
    if (!systemPrompt) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    const textKey = process.env.GROQ_TEXT_KEY || process.env.GROQ_API_KEY;
    const visionKey = process.env.GROQ_VISION_KEY || process.env.GROQ_API_KEY;

    if (images && images.length > 0) {
      if (!visionKey) return NextResponse.json({ error: "Server configuration error. Please contact support." }, { status: 500 });
      const questions = await processVisionBatches(visionKey, systemPrompt, images, type, count);
      if (questions.length === 0) return NextResponse.json({ error: "Could not extract questions from PDF. Try a clearer scan." }, { status: 422 });
      const normalized = normalizeQuestions(questions);
      const totalFound = normalized.length;
      return NextResponse.json({ questions: normalized.slice(0, count), totalFound });
    } else {
      if (!textKey) return NextResponse.json({ error: "Server configuration error. Please contact support." }, { status: 500 });
      const safeContent = truncateContent(content);
      const userMessage = type === "pq_quiz"
        ? `Convert these past questions into a quiz. Return ONLY the JSON array:\n\n${safeContent}`
        : safeContent;
      const raw = await callGroqWithRetry(textKey, TEXT_MODEL, [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ], 3000);
      const raw_questions = parseAIJson(raw);
      if (!raw_questions || !Array.isArray(raw_questions)) {
        return NextResponse.json({ error: "Could not generate questions. Please try again." }, { status: 422 });
      }
      const questions = normalizeQuestions(raw_questions);
      return NextResponse.json({ questions: questions.slice(0, count) });
    }
  } catch (err: any) {
    console.error("[/api/generate]", err.message);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
