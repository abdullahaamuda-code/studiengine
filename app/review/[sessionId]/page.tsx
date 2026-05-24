"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import MathText from "@/components/MathText";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  year?: string;
  subject?: string | null;
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: 8, display: "block", flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="rv-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d0f1a" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="rv-s" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="60%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="rv-l" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e2440" />
            <stop offset="100%" stopColor="#252b50" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#rv-bg)" />
        <rect x="160" y="96" width="260" height="52" rx="26" fill="url(#rv-l)" opacity="0.9" />
        <rect x="96" y="166" width="320" height="52" rx="26" fill="url(#rv-l)" opacity="0.78" />
        <rect x="96" y="236" width="330" height="52" rx="26" fill="url(#rv-l)" opacity="0.62" />
        <rect x="96" y="306" width="320" height="52" rx="26" fill="url(#rv-l)" opacity="0.46" />
        <rect x="96" y="376" width="220" height="52" rx="26" fill="url(#rv-l)" opacity="0.3" />
        <path
          d="M330 130 C330 130 330 86 256 86 C182 86 158 130 158 174 C158 218 194 238 256 256 C318 274 354 294 354 338 C354 382 330 426 256 426 C182 426 158 382 158 382"
          fill="none"
          stroke="url(#rv-s)"
          strokeWidth="42"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontSize: 15,
          fontWeight: 800,
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.02em",
          background: "linear-gradient(135deg,#f1f5f9,#818cf8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Studiengine
      </span>
    </div>
  );
}

function ReviewInner() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [subject, setSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);

  const [userQuestion, setUserQuestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState(false);

  const explanationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    getDoc(doc(db, "reviewSessions", sessionId as string))
      .then((snap) => {
        if (!snap.exists()) {
          setError("Review session not found or expired.");
          setLoading(false);
          return;
        }
        const data = snap.data();
        setQuestions(data.questions || []);
        setSubject(data.subject || null);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load review session.");
        setLoading(false);
      });
  }, [sessionId]);

  useEffect(() => {
    setExplanation("");
    setUserQuestion("");
    setCopied(false);
  }, [currentIdx]);

  useEffect(() => {
    if (explanationRef.current) {
      explanationRef.current.scrollTop = explanationRef.current.scrollHeight;
    }
  }, [explanation]);

  async function streamExplanation() {
    const q = questions[currentIdx];
    if (!q || streaming) return;

    setExplanation("");
    setStreaming(true);

    try {
      await addDoc(collection(db, "events"), {
        type: "ai_explain",
        createdAt: serverTimestamp(),
        userId: "unknown",
        sessionId: sessionId || null,
        questionIndex: currentIdx,
      });
    } catch {
    }

    try {
      const groqKey = process.env.NEXT_PUBLIC_GROQ_KEY;
      if (!groqKey) {
        setExplanation("NEXT_PUBLIC_GROQ_KEY not configured.");
        setStreaming(false);
        return;
      }

      const prompt = userQuestion.trim()
        ? `You are helping a student understand an exam question.

Question:
${q.question}

Options:
${q.options.map((o) => `- ${o}`).join("\n")}

Correct answer:
${q.answer}

Official explanation:
${q.explanation}

The student asks:
"${userQuestion}"

Write a clear, detailed answer in Markdown.
Use:
- a short title
- headings
- numbered steps where useful
- bullets for key points
- simple language
- enough detail for a student to understand fully
- if needed, explain why wrong options are wrong`
        : `You are helping a student revise an exam question.

Question:
${q.question}

Options:
${q.options.map((o) => `- ${o}`).join("\n")}

Correct answer:
${q.answer}

Official explanation:
${q.explanation}

Write a detailed revision note in Markdown.
Use:
- a short title
- headings like "Step 1", "Why this answer is correct", "Why the others are wrong"
- numbered steps
- bullets
- simple language
- clear exam-style explanation
- practical memory tips
- keep it well structured and easy to read`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 900,
          stream: true,
          messages: [
            {
              role: "system",
              content:
                "You are a patient expert tutor helping a Nigerian student. Always respond in clean Markdown. Make explanations detailed, readable, and step-by-step. Use headings, numbered lists, and bullets. Avoid dumping one long paragraph.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok || !res.body) {
        setExplanation("Could not get explanation. Please try again.");
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const token = json.choices?.[0]?.delta?.content || "";
            if (token) {
              setExplanation((prev) => prev + token);
            }
          } catch {
          }
        }
      }
    } catch (e: any) {
      setExplanation(`Error: ${e.message || "Something went wrong."}`);
    }

    setStreaming(false);
  }

  function copyExplanation() {
    navigator.clipboard.writeText(explanation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const q = questions[currentIdx];

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080c14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            border: "2.5px solid rgba(255,255,255,0.08)",
            borderTopColor: "#818cf8",
            borderRadius: "50%",
            animation: "rv-spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes rv-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  if (error)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080c14",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "var(--font-body)",
          gap: 14,
        }}
      >
        <p
          style={{
            fontSize: 16,
            color: "#f1f5f9",
            fontWeight: 700,
          }}
        >
          Session not found
        </p>
        <p style={{ fontSize: 13, color: "#475569" }}>{error}</p>
        <button
          onClick={() => router.push("/app")}
          style={{
            padding: "11px 24px",
            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            border: "none",
            borderRadius: 11,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Back to App
        </button>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080c14",
        fontFamily: "var(--font-body)",
        color: "#f1f5f9",
      }}
    >
      <style>{`
        @keyframes rv-spin { to{transform:rotate(360deg)} }
        @keyframes rv-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .rv-nav-btn {
          padding: 8px 16px;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #64748b;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .rv-nav-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.07);
          color: #94a3b8;
        }
        .rv-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .explain-btn {
          width: 100%;
          padding: 13px 0;
          border-radius: 11px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .explain-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(99,102,241,0.4);
        }
        .explain-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .q-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          color: #f1f5f9;
          padding: 11px 14px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
          transition: all 0.2s;
          resize: none;
          line-height: 1.55;
        }
        .q-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .copy-btn {
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04);
          color: #64748b;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .copy-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #94a3b8;
        }

        .q-idx-pill {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
          font-family: inherit;
        }

        .markdown {
          color: #cbd5e1;
          line-height: 1.85;
          font-size: 14px;
        }
        .markdown h1,
        .markdown h2,
        .markdown h3 {
          color: #f8fafc;
          margin-top: 1.1em;
          margin-bottom: 0.5em;
          line-height: 1.3;
        }
        .markdown h1 { font-size: 1.2rem; }
        .markdown h2 { font-size: 1.05rem; }
        .markdown h3 { font-size: 0.98rem; }
        .markdown p {
          margin: 0.55em 0;
        }
        .markdown ul,
        .markdown ol {
          margin: 0.5em 0 0.7em 1.25em;
          padding-left: 1em;
        }
        .markdown li {
          margin: 0.25em 0;
        }
        .markdown strong {
          color: #fff;
        }
        .markdown code {
          background: rgba(255,255,255,0.07);
          padding: 0.15rem 0.35rem;
          border-radius: 0.35rem;
          color: #e2e8f0;
        }
        .markdown pre {
          background: rgba(15,23,42,0.9);
          padding: 0.9rem;
          border-radius: 0.8rem;
          overflow-x: auto;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .markdown blockquote {
          border-left: 3px solid rgba(129,140,248,0.5);
          padding-left: 0.9rem;
          margin: 0.8rem 0;
          color: #a5b4fc;
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-5%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            right: "-5%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 65%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 760,
          margin: "0 auto",
          padding: "0 16px 60px",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(8,12,20,0.92)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "12px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {subject && (
              <span
                style={{
                  fontSize: 11,
                  color: "#818cf8",
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  padding: "3px 10px",
                  borderRadius: 99,
                  fontWeight: 600,
                }}
              >
                📚 {subject}
              </span>
            )}
            <button
              onClick={() => router.push("/app")}
              style={{
                fontSize: 12,
                padding: "6px 13px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#64748b",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← Back
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6366f1",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Extensive Review
          </p>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
              margin: "0 0 6px",
              color: "#f1f5f9",
            }}
          >
            Question {currentIdx + 1} of {questions.length}
          </h1>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 5,
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
                maxWidth: 520,
              }}
            >
              {questions.map((_, i) => (
                <button
                  key={i}
                  className="q-idx-pill"
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    borderColor:
                      i === currentIdx
                        ? "rgba(99,102,241,0.5)"
                        : "rgba(255,255,255,0.08)",
                    background:
                      i === currentIdx
                        ? "rgba(99,102,241,0.2)"
                        : "rgba(255,255,255,0.03)",
                    color: i === currentIdx ? "#a5b4fc" : "#475569",
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {q && (
          <div
            key={currentIdx}
            style={{
              animation: "rv-in 0.3s cubic-bezier(0.4,0,0.2,1)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "18px 18px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {q.year && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: "#818cf8",
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    padding: "3px 10px",
                    borderRadius: 99,
                    display: "inline-block",
                    marginBottom: 12,
                    fontWeight: 600,
                  }}
                >
                  {q.year}
                </span>
              )}

              <div style={{ width: "100%" }}>
                <p
                  style={{
                    fontSize: 15,
                    color: "#f1f5f9",
                    lineHeight: 1.75,
                    fontWeight: 500,
                    margin: "0 0 16px",
                  }}
                >
                  <MathText text={q.question} />
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {q.options.map((opt, idx) => {
                    const hasLabel = /^[ABCD]\.\s/i.test(opt);
                    const letter = hasLabel
                      ? opt.charAt(0).toUpperCase()
                      : ["A", "B", "C", "D"][idx] || "?";
                    const content = hasLabel ? opt.slice(3).trim() : opt;
                    const isCorrect = letter === q.answer.toUpperCase();

                    return (
                      <div
                        key={opt}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                          padding: "9px 12px",
                          borderRadius: 10,
                          border: "1px solid",
                          borderColor: isCorrect
                            ? "rgba(52,211,153,0.4)"
                            : "rgba(255,255,255,0.06)",
                          background: isCorrect
                            ? "rgba(4,47,29,0.5)"
                            : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 800,
                            background: isCorrect
                              ? "rgba(52,211,153,0.25)"
                              : "rgba(255,255,255,0.05)",
                            color: isCorrect ? "#34d399" : "#334155",
                          }}
                        >
                          {isCorrect ? "✓" : letter}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: isCorrect ? "#6ee7b7" : "#64748b",
                            lineHeight: 1.55,
                            flex: 1,
                          }}
                        >
                          <MathText text={content} />
                        </span>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 12px",
                      background: "rgba(99,102,241,0.06)",
                      border: "1px solid rgba(99,102,241,0.15)",
                      borderRadius: 10,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#818cf8",
                        marginBottom: 4,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Official Explanation
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      <MathText text={q.explanation} />
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "16px",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#f1f5f9",
                  margin: "0 0 10px",
                }}
              >
                Ask for a detailed explanation
              </p>

              <textarea
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="What didn't you understand? Leave blank for a full breakdown."
                rows={2}
                className="q-input"
                style={{ marginBottom: 10 }}
                disabled={streaming}
              />

              <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <button
                  className="explain-btn"
                  onClick={streamExplanation}
                  disabled={streaming}
                  style={{
                    width: "100%",
                    maxWidth: 420,
                    background: streaming
                      ? "rgba(99,102,241,0.3)"
                      : "linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)",
                    border: "1px solid rgba(129,140,248,0.4)",
                    color: "#fff",
                    boxShadow: streaming ? "none" : "0 4px 20px rgba(99,102,241,0.3)",
                  }}
                >
                  {streaming ? (
                    <>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          border: "2px solid rgba(255,255,255,0.2)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                          animation: "rv-spin 0.65s linear infinite",
                        }}
                      />
                      Explaining…
                    </>
                  ) : explanation ? (
                    "Re-explain →"
                  ) : (
                    "Explain this question →"
                  )}
                </button>
              </div>
            </div>

            {(explanation || streaming) && (
              <div
                style={{
                  background: "rgba(10,13,22,0.97)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 16,
                  overflow: "hidden",
                  animation: "rv-in 0.3s ease",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: streaming ? "#818cf8" : "#34d399",
                        boxShadow: `0 0 6px ${
                          streaming
                            ? "rgba(129,140,248,0.8)"
                            : "rgba(52,211,153,0.8)"
                        }`,
                        animation: streaming ? "cursor-blink 1s infinite" : "none",
                      }}
                    />
                    <span style={{ fontSize: 12, color: "#475569" }}>
                      {streaming ? "AI is explaining…" : "Explanation ready"}
                    </span>
                  </div>
                  {explanation && !streaming && (
                    <button className="copy-btn" onClick={copyExplanation}>
                      {copied ? "✓ Copied!" : "Copy"}
                    </button>
                  )}
                </div>

                <div
                  ref={explanationRef}
                  style={{
                    padding: "16px",
                    maxHeight: 430,
                    overflowY: "auto",
                  }}
                >
                  {explanation ? (
                    <div className="markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {explanation}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#818cf8",
                            animation: `cursor-blink 1.2s ease-in-out ${
                              i * 0.2
                            }s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <button
                className="rv-nav-btn"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => i - 1)}
              >
                ← Previous
              </button>
              <span
                style={{
                  fontSize: 12,
                  color: "#334155",
                  alignSelf: "center",
                }}
              >
                {currentIdx + 1} / {questions.length}
              </span>
              <button
                className="rv-nav-btn"
                disabled={currentIdx === questions.length - 1}
                onClick={() => setCurrentIdx((i) => i + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#080c14",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              border: "2.5px solid rgba(255,255,255,0.08)",
              borderTopColor: "#818cf8",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }
    >
      <ReviewInner />
    </Suspense>
  );
}
