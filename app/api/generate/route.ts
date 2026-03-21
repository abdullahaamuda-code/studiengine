import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const BATCH_SIZE = 5;

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

function buildSystemPrompt(type: string, count: number): string {
  if (type === "notes_quiz") return `You are a Nigerian university exam prep AI. Generate exactly ${count} MCQ questions from the given material.
CRITICAL: Return ONLY a raw JSON array. No markdown, no backticks, no explanation, no LaTeX backslashes.
Use plain text for math: cos(x) not \\cos x, theta not \\theta, sqrt(x) not \\sqrt{x}.
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"1-2 sentence explanation of why this answer is correct"}]
Rules: options start with A. B. C. D. | answer is single letter A B C D | always include explanation field`;

  if (type === "pq_quiz") return `You are converting Nigerian past exam questions (JAMB, WAEC, NECO, university) into a quiz.
CRITICAL: Return ONLY a raw JSON array. No markdown, no backticks, no LaTeX backslashes.
Use plain text for math: cos(x) not \\cos x, theta not \\theta, sqrt(x) not \\sqrt{x}.
Format: [{"id":1,"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"1-2 sentence explanation","year":"2019 WAEC or empty string"}]
Rules:
- If the question already has A B C D options listed, use them exactly as written
- If no options exist, generate 4 plausible options
- answer field is a SINGLE letter only: A, B, C, or D — nothing else
- always include the explanation field
- extract as many questions as visible, up to ${count}`;

  return "";
}

const VISION_SUFFIX = `\nThese are scanned exam pages. Read all questions carefully.
No LaTeX backslashes. Write math in plain text: cos(x), sin(theta), x^2, sqrt(x).
Always include the explanation field. Return only the JSON array.`;

async function callGroq(apiKey: string, model: string, messages: any[], maxTokens = 4000) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.3, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Groq error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function processVisionBatches(apiKey: string, systemPrompt: string, images: string[], type: string, count: number): Promise<any[]> {
  const batches: string[][] = [];
  for (let i = 0; i < images.length; i += BATCH_SIZE) batches.push(images.slice(i, i + BATCH_SIZE));

  const allQuestions: any[] = [];

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const imageContent = batch.map((b64: string) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` } }));
    const batchPrompt = type === "pq_quiz"
      ? `Extract all questions you can find on these ${batch.length} page(s). Return only the JSON array.`
      : `Generate up to ${Math.ceil(count / batches.length)} questions from these ${batch.length} page(s). Return only the JSON array.`;
    try {
      const raw = await callGroq(apiKey, VISION_MODEL, [
        { role: "system", content: systemPrompt + VISION_SUFFIX },
        { role: "user", content: [...imageContent, { type: "text", text: batchPrompt }] },
      ]);
      const parsed = parseAIJson(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((q: any, i: number) => { q.id = allQuestions.length + i + 1; });
        allQuestions.push(...parsed);
      }
    } catch (e) { console.error(`Batch ${b + 1} failed:`, e); }
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
      if (!visionKey) return NextResponse.json({ error: "Vision API key not configured" }, { status: 500 });
      const questions = await processVisionBatches(visionKey, systemPrompt, images, type, count);
      if (questions.length === 0) return NextResponse.json({ error: "Could not extract questions from PDF. Try a clearer scan." }, { status: 422 });
      return NextResponse.json({ questions: questions.slice(0, count) });
    } else {
      if (!textKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });
      
      // For pq_quiz text, add a user message that's explicit about format
      const userMessage = type === "pq_quiz"
        ? `Convert these past questions into a quiz. Return ONLY the JSON array, nothing else:\n\n${content}`
        : content;

      const raw = await callGroq(textKey, TEXT_MODEL, [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ]);

      console.log("[generate] raw (first 200):", raw.slice(0, 200));

      const questions = parseAIJson(raw);
      if (!questions || !Array.isArray(questions)) {
        console.error("[generate] parse failed. Full raw:", raw);
        return NextResponse.json({ error: "Could not parse AI response. Try again." }, { status: 422 });
      }
      return NextResponse.json({ questions: questions.slice(0, count) });
    }
  } catch (err: any) {
    console.error("[/api/generate]", err.message);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}