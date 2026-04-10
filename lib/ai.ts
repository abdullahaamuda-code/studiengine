// lib/ai.ts - ONE FILE TO RULE ALL AI CALLS

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// ============ GROQ CALL WITH RETRY ============
async function callGroq(
  key: string,
  model: string,
  messages: any[],
  maxTokens = 3000
): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
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
          await new Promise((r) => setTimeout(r, attempt * 2000));
          continue;
        }
        throw new Error("rate_limited");
      }
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Groq ${res.status}`);
      }
      
      const data = await res.json();
      return data.choices[0].message.content;
      
    } catch (e: any) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  throw new Error("rate_limited");
}

// ============ OPENROUTER CALL (FREE FALLBACK) ============
async function callOpenRouter(messages: any[], maxTokens = 3000): Promise<string> {
  const orKey = process.env.OPENROUTER_API_KEY;
  if (!orKey) throw new Error("No OpenRouter key");
  
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${orKey}`,
      "HTTP-Referer": "https://studiengine.vercel.app",
      "X-Title": "Studiengine",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenRouter ${res.status}`);
  }
  
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ============ TEXT AI (Groq → OpenRouter) ============
export async function callTextAI(
  messages: any[],
  maxTokens = 3000,
  isPremium = false
): Promise<string> {
  // Build array of keys (without Set to avoid TS error)
  const keys: string[] = [];
  
  if (isPremium && process.env.GROQ_PREMIUM_KEY) {
    keys.push(process.env.GROQ_PREMIUM_KEY);
  }
  if (process.env.GROQ_TEXT_KEY) {
    keys.push(process.env.GROQ_TEXT_KEY);
  }
  if (process.env.GROQ_ANALYZE_KEY) {
    keys.push(process.env.GROQ_ANALYZE_KEY);
  }
  if (process.env.GROQ_VISION_KEY) {
    keys.push(process.env.GROQ_VISION_KEY);
  }
  if (process.env.GROQ_API_KEY) {
    keys.push(process.env.GROQ_API_KEY);
  }
  
  // Remove duplicates manually
  const uniqueKeys: string[] = [];
  for (const k of keys) {
    if (!uniqueKeys.includes(k)) {
      uniqueKeys.push(k);
    }
  }
  
  // Try all Groq keys
  for (const key of uniqueKeys) {
    try {
      return await callGroq(key, TEXT_MODEL, messages, maxTokens);
    } catch (e: any) {
      if (e.message.includes("rate") || e.message.includes("429")) {
        console.log("Groq key rate limited, trying next...");
        continue;
      }
      throw e;
    }
  }
  
  // Fallback to OpenRouter
  console.log("All Groq keys failed, falling back to OpenRouter...");
  try {
    return await callOpenRouter(messages, maxTokens);
  } catch (e: any) {
    console.error("OpenRouter also failed:", e.message);
    throw new Error("All AI providers unavailable. Please try again in a few minutes.");
  }
}

// ============ VISION AI (Gemini → Groq Vision) ============
export async function callVisionAI(
  images: string[],
  prompt: string
): Promise<string> {
  // Try Gemini first
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
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
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.length > 50) return text;
      }
    } catch (e) {
      console.error("Gemini vision failed:", e);
    }
  }
  
  // Fallback to Groq Vision
  const visionKeys: string[] = [];
  if (process.env.GROQ_VISION_KEY) visionKeys.push(process.env.GROQ_VISION_KEY);
  if (process.env.GROQ_TEXT_KEY) visionKeys.push(process.env.GROQ_TEXT_KEY);
  if (process.env.GROQ_ANALYZE_KEY) visionKeys.push(process.env.GROQ_ANALYZE_KEY);
  if (process.env.GROQ_API_KEY) visionKeys.push(process.env.GROQ_API_KEY);
  
  const imageContent = images.map((b64) => ({
    type: "image_url",
    image_url: { url: `data:image/jpeg;base64,${b64}` },
  }));
  
  for (const key of visionKeys) {
    try {
      return await callGroq(
        key,
        VISION_MODEL,
        [{ role: "user", content: [...imageContent, { type: "text", text: prompt }] }],
        2000
      );
    } catch (e: any) {
      if (e.message.includes("rate")) continue;
      throw e;
    }
  }
  
  throw new Error("Vision AI unavailable. Try copying text instead of scanning.");
}

// ============ PDF PROCESSING (CHUNK + SUMMARIZE) ============
export async function processPDFForQuiz(
  pdfText: string,
  numQuestions: number,
  isPremium: boolean
): Promise<string> {
  const maxChars = isPremium ? 20000 : 8000;
  
  // If text is short enough, use directly
  if (pdfText.length <= maxChars) {
    return pdfText;
  }
  
  // Chunk the text (max 5 chunks)
  const chunks = chunkText(pdfText, 5);
  console.log(`📄 Split into ${chunks.length} chunks`);
  
  // Summarize each chunk
  const summaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`📝 Summarizing chunk ${i + 1}/${chunks.length}...`);
    try {
      const summary = await callTextAI([
        {
          role: "system",
          content: "Summarize this section in 3-5 bullet points. Keep ALL important facts, numbers, dates, and key details. Do NOT omit information."
        },
        { role: "user", content: chunks[i] }
      ], 1000, isPremium);
      summaries.push(summary);
    } catch (e) {
      console.error(`Failed to summarize chunk ${i + 1}:`, e);
      summaries.push(chunks[i].slice(0, 2000));
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Combine summaries
  const fullContext = summaries.join('\n\n---\n\n');
  console.log(`✅ Combined context: ${fullContext.length} chars`);
  
  return fullContext.length > maxChars ? fullContext.slice(0, maxChars) : fullContext;
}

function chunkText(text: string, maxChunks: number): string[] {
  const words = text.split(/\s+/);
  const chunkSize = Math.ceil(words.length / maxChunks);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  
  return chunks;
}

// ============ MATH FORMATTING FIX ============
export function fixLatex(text: string): string {
  return text
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/√/g, '\\sqrt{')
    .replace(/π/g, '\\pi')
    .replace(/∞/g, '\\infty')
    .replace(/≤/g, '\\le ')
    .replace(/≥/g, '\\ge ')
    .replace(/≠/g, '\\neq ')
    .replace(/\brac\{/g, "\\frac{")
    .replace(/\bint_/g, "\\int_")
    .replace(/\bint\^/g, "\\int^")
    .replace(/\blim_/g, "\\lim_")
    .replace(/\bsqrt\{/g, "\\sqrt{")
    .replace(/\btheta\b/g, "\\theta")
    .replace(/\balpha\b/g, "\\alpha")
    .replace(/\bbeta\b/g, "\\beta")
    .replace(/\bsigma\b/g, "\\sigma")
    .replace(/\binfty\b/g, "\\infty")
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');
}

// ============ JSON PARSING HELPERS ============
export function parseAIJson(raw: string): any {
  const trimmed = raw.trim();
  if (trimmed.length < 10) return null;

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
    try {
      return JSON.parse(clean.slice(start, end + 1));
    } catch (_) {}
  }

  return null;
}

export function normalizeQuestions(qs: any[]): any[] {
  if (!Array.isArray(qs)) return [];
  const L = ["A", "B", "C", "D"];
  return qs.map((q, i) => {
    if (!q || typeof q !== "object") return q;
    const opts = (q.options || [])
      .slice(0, 4)
      .map((o: string, j: number) => {
        const text = typeof o === "string"
          ? o.replace(/^[A-Za-z][.)]\s*/, "").trim()
          : String(o);
        return `${L[j]}. ${text}`;
      });
    const ans = String(q.answer || "A")
      .trim()
      .toUpperCase()
      .match(/^([ABCD])/)?.[1] || "A";
    return { ...q, id: q.id || i + 1, options: opts, answer: ans };
  });
}
