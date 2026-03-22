import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { question, options, answer, explanation, userQuestion } = await req.json();
    const key = process.env.GROQ_PREMIUM_KEY || process.env.GROQ_TEXT_KEY || process.env.GROQ_API_KEY;
    if (!key) return NextResponse.json({ error: "Server configuration error." }, { status: 500 });

    const optionsText = (options || []).map((o: string) => `  ${o}`).join("\n");

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL, temperature: 0.4, max_tokens: 500,
        messages: [
          { role: "system", content: `You are an expert Nigerian exam tutor. Explain CBT questions clearly and thoroughly. For math show step-by-step working. For theory explain the concept deeply. Use Nigerian exam context (JAMB, WAEC, university). Keep under 300 words. Be educational and encouraging.` },
          { role: "user", content: `Question: ${question}\nOptions:\n${optionsText}\nCorrect Answer: ${answer}\nBrief explanation: ${explanation || "Not provided"}\n\nStudent asks: ${userQuestion || "Please explain this in detail with full working/reasoning."}` },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: (err as any)?.error?.message || "AI error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ explanation: data.choices[0].message.content });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
