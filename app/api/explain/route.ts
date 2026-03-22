import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

async function callWithFallback(messages: any[]): Promise<string> {
  const keys = [
    process.env.GROQ_PREMIUM_KEY,
    process.env.GROQ_TEXT_KEY,
    process.env.GROQ_ANALYZE_KEY,
    process.env.GROQ_VISION_KEY,
    process.env.GROQ_API_KEY,
  ].filter(Boolean) as string[];

  const unique = keys.filter((k, i) => keys.indexOf(k) === i);

  for (const key of unique) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: MODEL, temperature: 0.4, max_tokens: 500, messages }),
      });
      if (res.status === 429 || res.status === 503) { continue; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message || `Error ${res.status}`);
      }
      return (await res.json()).choices[0].message.content as string;
    } catch (e: any) {
      if (e.message.includes("rate") || e.message.includes("429") || e.message.includes("busy")) continue;
      throw e;
    }
  }

  // OpenRouter fallback
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orKey}`, "HTTP-Referer": "https://studiengine.vercel.app", "X-Title": "Studiengine" },
      body: JSON.stringify({ model: "meta-llama/llama-3.1-8b-instruct:free", messages, max_tokens: 500, temperature: 0.4 }),
    });
    if (res.ok) return (await res.json()).choices?.[0]?.message?.content || "";
  }

  throw new Error("AI is busy. Please try again.");
}

export async function POST(req: NextRequest) {
  try {
    const { question, options, answer, explanation, userQuestion } = await req.json();
    const optionsText = (options || []).map((o: string) => `  ${o}`).join("\n");
    const messages = [
      { role: "system", content: `You are an expert Nigerian exam tutor. Explain CBT questions clearly. For math show step-by-step working. For theory explain deeply. Use Nigerian exam context (JAMB, WAEC, university). Keep under 300 words. Be educational and encouraging.` },
      { role: "user", content: `Question: ${question}\nOptions:\n${optionsText}\nCorrect Answer: ${answer}\nBrief explanation: ${explanation || "Not provided"}\n\nStudent asks: ${userQuestion || "Please explain this in detail with full working and reasoning."}` },
    ];
    const result = await callWithFallback(messages);
    return NextResponse.json({ explanation: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not get explanation." }, { status: 500 });
  }
}
