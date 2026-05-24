"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MathText from "./MathText";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  year?: string;
  subject?: string | null;
}

interface QuizPlayerProps {
  questions: Question[];
  onReset: () => void;
  userId?: string;
  userEmail?: string | null;
  isPremium?: boolean;
  onComplete?: () => void;
  notice?: string;
  timerSeconds?: number | null;
  subject?: string | null;
}

interface TopicAnalysis {
  struggled: string[];
  strong: string[];
  advice: string;
}

export default function QuizPlayer({
  questions,
  onReset,
  userId,
  userEmail,
  isPremium,
  onComplete,
  notice,
  timerSeconds,
  subject,
}: QuizPlayerProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [wrongOnes, setWrongOnes] = useState<Question[]>([]);
  const [correctOnes, setCorrectOnes] = useState<Question[]>([]);
  const [animKey, setAnimKey] = useState(0);
  const [saved, setSaved] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(timerSeconds || null);
  const timerActive = !!timerSeconds;

  const [topicAnalysis, setTopicAnalysis] = useState<TopicAnalysis | null>(null);
  const [analyzingTopics, setAnalyzingTopics] = useState(false);
  const [showTopics, setShowTopics] = useState(false);

  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);

  const q = questions[current];
  const total = questions.length;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (done) return;
      if (!revealed) {
        const idx = ({ a: 0, b: 1, c: 2, d: 3 } as any)[
          e.key.toLowerCase()
        ];
        if (idx !== undefined && q.options[idx]) pick(q.options[idx]);
      } else {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          next();
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [revealed, done, q, current]);

  useEffect(() => {
    if (!timerActive || timeLeft === null || done) return;
    if (timeLeft <= 0) {
      finish(score);
      return;
    }
    const t = setTimeout(
      () => setTimeLeft((s) => (s !== null ? s - 1 : null)),
      1000,
    );
    return () => clearTimeout(t);
  }, [timerActive, timeLeft, done, score]);

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }

  async function saveHistory(finalScore: number) {
    if (!isPremium || !userId || saved) return;
    try {
      await addDoc(collection(db, "users", userId, "history"), {
        questions,
        score: finalScore,
        total,
        pct: Math.round((finalScore / total) * 100),
        subject: subject ?? questions[0]?.subject ?? null,
        createdAt: serverTimestamp(),
      });
      setSaved(true);
    } catch {
      // ignore
    }
  }

  async function logSession(finalScore: number) {
    // Log guests, free, and premium alike
    try {
      await addDoc(collection(db, "cbtSessions"), {
        userId: userId || "guest",
        userEmail: userEmail || null,
        questions,
        score: finalScore,
        total,
        pct: Math.round((finalScore / total) * 100),
        subject: subject ?? questions[0]?.subject ?? null,
        isPremium: isPremium || false,
        createdAt: serverTimestamp(),
      });
    } catch {
      // ignore
    }
  }

  async function analyzeTopics(wrongs: Question[], corrects: Question[]) {
    if (wrongs.length === 0 && corrects.length === 0) return;
    setAnalyzingTopics(true);
    try {
      const groqKey = process.env.NEXT_PUBLIC_GROQ_KEY;
      if (!groqKey) return;

      const wrongSummary = wrongs
        .map((q) => q.question.slice(0, 120))
        .join(" | ");
      const correctSummary = corrects
        .slice(0, 5)
        .map((q) => q.question.slice(0, 80))
        .join(" | ");

      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            max_tokens: 200,
            messages: [
              {
                role: "user",
                content: `Analyze these exam questions and identify specific topics/concepts.

Questions the student GOT WRONG: ${wrongSummary || "none"}
Questions the student GOT RIGHT: ${correctSummary || "none"}

Reply with ONLY valid JSON (no markdown, no explanation):
{
  "struggled": ["topic1", "topic2", "topic3"],
  "strong": ["topic1", "topic2"],
  "advice": "One practical sentence telling them exactly what to revise."
}

Keep topic names short (2-4 words max). Max 4 items per array.`,
              },
            ],
          }),
        },
      );

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setTopicAnalysis(parsed);
    } catch {
      setTopicAnalysis({
        struggled: wrongs
          .slice(0, 3)
          .map((q) =>
            q.question
              .split(" ")
              .slice(0, 4)
              .join(" "),
          ),
        strong: corrects
          .slice(0, 2)
          .map((q) =>
            q.question
              .split(" ")
              .slice(0, 4)
              .join(" "),
          ),
        advice:
          "Revisit the topics where you made mistakes and re-read those sections.",
      });
    }
    setAnalyzingTopics(false);
  }

  async function saveReviewSession(wrongs: Question[]) {
    if (!isPremium || wrongs.length === 0) return;
    setSavingReview(true);
    try {
      const id = Math.random().toString(36).slice(2, 10);
      await setDoc(doc(db, "reviewSessions", id), {
        questions,
        wrongOnes: wrongs,
        subject: subject ?? questions[0]?.subject ?? null,
        userId: userId || "guest",
        createdAt: serverTimestamp(),
      });
      setReviewSessionId(id);
    } catch {
      // ignore
    }
    setSavingReview(false);
  }

  function finish(finalScore: number) {
    const wrongs = wrongOnes;
    const corrects = correctOnes;
    saveHistory(finalScore);
    logSession(finalScore);
    analyzeTopics(wrongs, corrects);
    if (isPremium) saveReviewSession(wrongs);
    setDone(true);
    if (onComplete) onComplete();
  }

  function pick(opt: string) {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    const hasLabel = /^[ABCD]\.\s/i.test(opt);
    const letter = hasLabel
      ? opt.charAt(0).toUpperCase()
      : ["A", "B", "C", "D"][q.options.indexOf(opt)] || "?";
    const correct = letter === q.answer.toUpperCase();
    if (correct) setCorrectOnes((c) => [...c, q]);
    else setWrongOnes((w) => [...w, q]);
    if (correct) setScore((s) => s + 1);
  }

  function next() {
    if (current + 1 >= total) {
      finish(score);
      return;
    }
    setAnimKey((k) => k + 1);
    setCurrent((c) => c + 1);
    setSelected(null);
    setRevealed(false);
  }

  async function shareQuiz() {
    setSharing(true);
    setCopyMsg(null);
    try {
      const id = Math.random().toString(36).slice(2, 8);
      await setDoc(doc(db, "sharedQuizzes", id), {
        questions,
        subject: subject ?? questions[0]?.subject ?? null,
        count: questions.length,
        createdAt: serverTimestamp(),
        createdBy: userId || "guest",
      });

      // log shared_open event in events collection
      try {
        await addDoc(collection(db, "events"), {
          type: "shared_open",
          createdAt: serverTimestamp(),
          createdBy: userId || "guest",
        });
      } catch {
        // ignore logging errors
      }

      const url = `${window.location.origin}/cbt/${id}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopyMsg("✓ Link copied!");
      } catch {
        setCopyMsg("Long-press to copy the link below.");
      }
    } catch {
      setCopyMsg("Could not generate link. Try again.");
    }
    setSharing(false);
  }

  if (done) {
    const finalPct = Math.round((score / total) * 100);
    const grade =
      finalPct >= 80
        ? {
            emoji: "🔥",
            label: "Excellent work",
            color: "#34d399",
            sub: "You clearly know this material. Keep the momentum going.",
          }
        : finalPct >= 60
          ? {
              emoji: "📚",
              label: "Good effort",
              color: "#fbbf24",
              sub: "You're on the right track. A bit more revision will get you there.",
            }
          : {
              emoji: "💪",
              label: "Keep going",
              color: "#f87171",
              sub: "This is how you find the gaps. Now you know what to fix.",
            };

    return (
      <>
        <style>{`
          @keyframes res-in { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
          @keyframes topic-in { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
          @keyframes advice-in { from{opacity:0} to{opacity:1} }
          @keyframes dot-pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
          .res-wrap { animation:res-in 0.45s cubic-bezier(0.4,0,0.2,1); display:flex; flex-direction:column; gap:12px; }
          .topic-pill-bad { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:99px; background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.25); color:#fca5a5; font-size:12px; font-weight:600; animation:topic-in 0.4s ease both; }
          .topic-pill-good { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:99px; background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.25); color:#6ee7b7; font-size:12px; font-weight:600; animation:topic-in 0.4s ease both; }
          .retry-btn { width:100%; padding:13px 0; border-radius:11px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
          .retry-btn:hover { transform:translateY(-1px); }
          .share-btn:hover { background:rgba(56,189,248,0.14) !important; }
          .review-btn:hover { box-shadow:0 6px 24px rgba(251,191,36,0.3) !important; }
          .new-cbt:hover { box-shadow:0 6px 24px rgba(99,102,241,0.4) !important; transform:translateY(-1px); }
          .topics-toggle { width:100%; padding:11px 14px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:11px; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:space-between; transition:all 0.2s; color:#94a3b8; font-size:13px; }
          .topics-toggle:hover { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.12); }
        `}</style>

        <div className="res-wrap">
          <div style={{ textAlign: "center", padding: "24px 16px 16px" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>{grade.emoji}</div>
            <div
              style={{
                position: "relative",
                width: 100,
                height: 100,
                margin: "0 auto 14px",
              }}
            >
              <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="7"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={grade.color}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  strokeDashoffset={`${251 * (1 - finalPct / 100)}`}
                  style={{
                    transition:
                      "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
                    filter: `drop-shadow(0 0 6px ${grade.color}88)`,
                  }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: grade.color,
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {finalPct}%
                </span>
                <span
                  style={{ fontSize: 10, color: "#334155", marginTop: 1 }}
                >
                  {score}/{total}
                </span>
              </div>
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                color: "#f1f5f9",
                margin: "0 0 5px",
                letterSpacing: "-0.02em",
              }}
            >
              {grade.label}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#475569",
                margin: 0,
                lineHeight: 1.65,
                maxWidth: 280,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {grade.sub}
            </p>
            {isPremium && saved && (
              <p
                style={{
                  fontSize: 11,
                  color: "#34d399",
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                ✓ Saved to history
              </p>
            )}
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                }}
              >
                ◈
              </div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#f1f5f9",
                  margin: 0,
                }}
              >
                Performance breakdown
              </p>
            </div>

            {analyzingTopics ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 0",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#818cf8",
                      animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
                <span style={{ fontSize: 12, color: "#475569" }}>
                  Analysing your results…
                </span>
              </div>
            ) : topicAnalysis ? (
              <div>
                {topicAnalysis.struggled.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#f87171",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Needs work
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {topicAnalysis.struggled.map((t, i) => (
                        <span
                          key={t}
                          className="topic-pill-bad"
                          style={{ animationDelay: `${i * 0.08}s` }}
                        >
                          <span style={{ fontSize: 9 }}>✗</span>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {topicAnalysis.strong.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#34d399",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      You did well in
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {topicAnalysis.strong.map((t, i) => (
                        <span
                          key={t}
                          className="topic-pill-good"
                          style={{ animationDelay: `${i * 0.08}s` }}
                        >
                          <span style={{ fontSize: 9 }}>✓</span>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {topicAnalysis.advice && (
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "rgba(99,102,241,0.06)",
                      border: "1px solid rgba(99,102,241,0.15)",
                      borderRadius: 10,
                      fontSize: 12.5,
                      color: "#94a3b8",
                      lineHeight: 1.65,
                      animation: "advice-in 0.5s ease 0.3s both",
                    }}
                  >
                    <span
                      style={{
                        color: "#818cf8",
                        fontWeight: 700,
                      }}
                    >
                      Advice:{" "}
                    </span>
                    {topicAnalysis.advice}
                  </div>
                )}

                {wrongOnes.length > 0 && (
                  <button
                    className="topics-toggle"
                    onClick={() => setShowTopics((t) => !t)}
                    style={{ marginTop: 10 }}
                  >
                    <span>Questions you missed ({wrongOnes.length})</span>
                    <span
                      style={{
                        fontSize: 12,
                        transform: showTopics ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    >
                      ▾
                    </span>
                  </button>
                )}

                {showTopics && wrongOnes.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0,
                    }}
                  >
                    {wrongOnes.map((wq, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "9px 0",
                          borderBottom:
                            i < wrongOnes.length - 1
                              ? "1px solid rgba(255,255,255,0.04)"
                              : "none",
                          display: "flex",
                          gap: 8,
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            color: "#f87171",
                            fontSize: 11,
                            flexShrink: 0,
                            marginTop: 2,
                            fontWeight: 700,
                          }}
                        >
                          ✗
                        </span>
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: 12.5,
                              color: "#f1f5f9",
                              margin: "0 0 3px",
                              lineHeight: 1.5,
                            }}
                          >
                            <MathText
                              text={
                                wq.question.slice(0, 100) +
                                (wq.question.length > 100 ? "…" : "")
                              }
                            />
                          </p>
                          <p
                            style={{
                              fontSize: 11.5,
                              color: "#34d399",
                              margin: 0,
                            }}
                          >
                            ✓ {wq.answer}.{" "}
                            <MathText
                              text={
                                wq.options
                                  ?.find(
                                    (o) =>
                                      o
                                        .charAt(0)
                                        .toUpperCase() ===
                                      wq.answer?.toUpperCase(),
                                  )
                                  ?.slice(3) || ""
                              }
                            />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 12.5, color: "#334155", margin: 0 }}>
                No analysis available.
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {wrongOnes.length > 0 && (
              <button
                className="retry-btn"
                onClick={() => {
                  setDone(false);
                  setCurrent(0);
                  setSelected(null);
                  setRevealed(false);
                  setScore(0);
                  setWrongOnes([]);
                  setCorrectOnes([]);
                  setAnimKey((k) => k + 1);
                  setTopicAnalysis(null);
                  setShowTopics(false);
                  setSaved(false);
                }}
                style={{
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.22)",
                  color: "#fbbf24",
                }}
              >
                🔄 Retry {wrongOnes.length} wrong question
                {wrongOnes.length > 1 ? "s" : ""}
              </button>
            )}

            {isPremium ? (
              <button
                className="retry-btn review-btn"
                disabled={savingReview || !reviewSessionId}
                onClick={() =>
                  reviewSessionId && router.push(`/review/${reviewSessionId}`)
                }
                style={{
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.28)",
                  color: "#fbbf24",
                  boxShadow: "0 0 0 0 rgba(251,191,36,0)",
                  opacity: savingReview ? 0.6 : 1,
                }}
              >
                {savingReview ? "Preparing…" : "📖 Extensive Review"}
              </button>
            ) : (
              <div style={{ position: "relative" }}>
                <button
                  className="retry-btn"
                  style={{
                    background: "rgba(251,191,36,0.04)",
                    border: "1px solid rgba(251,191,36,0.16)",
                    color: "#fbbf24",
                    opacity: 0.95,
                    justifyContent: "center",
                    padding: "13px 44px 13px 18px",
                  }}
                >
                  📖 Extensive Review
                </button>
                <span
                  style={{
                    position: "absolute",
                    right: 10,
                    bottom: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fbbf24",
                    background: "rgba(8,12,20,0.92)",
                    border: "1px solid rgba(251,191,36,0.28)",
                    padding: "4px 8px",
                    borderRadius: 999,
                    pointerEvents: "none",
                  }}
                >
                  🔒
                </span>
              </div>
            )}

            <button
              className="retry-btn share-btn"
              onClick={shareQuiz}
              disabled={sharing}
              style={{
                background: "rgba(56,189,248,0.07)",
                border: "1px solid rgba(56,189,248,0.18)",
                color: "#38bdf8",
              }}
            >
              {sharing ? "Generating…" : copyMsg || "🔗 Share this CBT"}
            </button>

            {shareUrl && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgba(56,189,248,0.05)",
                  border: "1px solid rgba(56,189,248,0.14)",
                  borderRadius: 9,
                  fontSize: 11.5,
                  color: "#38bdf8",
                  wordBreak: "break-all",
                  textAlign: "center",
                }}
              >
                {shareUrl}
              </div>
            )}

            <button
              className="retry-btn new-cbt"
              onClick={onReset}
              style={{
                background:
                  "linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)",
                border: "1px solid rgba(129,140,248,0.4)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
              }}
            >
              ← New CBT
            </button>
          </div>
        </div>
      </>
    );
  }

  const pct = Math.round((current / total) * 100);

  return (
    <>
      <style>{`
        @keyframes qp-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes qp-fade { from{opacity:0} to{opacity:1} }
        .opt-btn { width:100%; padding:12px 14px; border-radius:11px; text-align:left; font-size:14px; cursor:pointer; font-family:inherit; line-height:1.6; display:flex; align-items:flex-start; gap:10px; transition:all 0.18s; }
        .opt-btn:disabled { cursor:default; }
        .opt-default { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:var(--text-primary); }
        .opt-default:not(:disabled):hover { background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); transform:translateX(3px); }
        .opt-correct { background:rgba(4,47,29,0.7) !important; border:1px solid rgba(52,211,153,0.5) !important; color:#6ee7b7 !important; box-shadow:0 0 16px rgba(52,211,153,0.1) !important; }
        .opt-wrong { background:rgba(36,10,10,0.7) !important; border:1px solid rgba(248,113,113,0.5) !important; color:#fca5a5 !important; }
        .opt-dimmed { opacity:0.45; }
        .next-btn:hover { box-shadow:0 8px 28px rgba(99,102,241,0.45) !important; transform:translateY(-1px); }
        .quit-btn:hover { background:rgba(255,255,255,0.07) !important; color:var(--text-secondary) !important; }
      `}</style>

      <div>
        {notice && (
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              gap: 8,
              padding: "9px 12px",
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.18)",
              borderRadius: 10,
              fontSize: 12.5,
              color: "#fde68a",
            }}
          >
            <span>ℹ️</span>
            {notice}
          </div>
        )}

        {subject && (
          <div style={{ marginBottom: 10 }}>
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
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              color: "var(--text-muted)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
            }}
          >
            {current + 1}{" "}
            <span style={{ color: "#334155" }}>/ {total}</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                color: "#34d399",
                fontWeight: 700,
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.2)",
                padding: "3px 9px",
                borderRadius: 99,
              }}
            >
              ✓ {score}
            </span>
            {timeLeft !== null && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: timeLeft < 60 ? "#f87171" : "#fbbf24",
                  background:
                    timeLeft < 60
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(251,191,36,0.1)",
                  border: `1px solid ${
                    timeLeft < 60
                      ? "rgba(239,68,68,0.3)"
                      : "rgba(251,191,36,0.25)"
                  }`,
                  padding: "3px 9px",
                  borderRadius: 99,
                  fontFamily: "var(--font-display)",
                }}
              >
                ⏱ {formatTime(timeLeft)}
              </span>
            )}
            <button
              className="quit-btn"
              onClick={onReset}
              style={{
                fontSize: 11.5,
                padding: "4px 11px",
                borderRadius: 7,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                transition: "all 0.15s",
              }}
            >
              Quit
            </button>
          </div>
        </div>

        <div
          style={{
            height: 3,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 99,
            marginBottom: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg,#6366f1,#38bdf8)",
              borderRadius: 99,
              transition: "width 0.4s ease",
              boxShadow: "0 0 8px rgba(99,102,241,0.4)",
            }}
          />
        </div>
        <p
          style={{
            fontSize: 10,
            color: "#1e293b",
            textAlign: "right",
            marginBottom: 18,
          }}
        >
          A B C D · Space/Enter for next
        </p>

        <div
          key={animKey}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "20px 18px",
            marginBottom: 12,
            animation: "qp-in 0.3s cubic-bezier(0.4,0,0.2,1)",
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
          <p
            style={{
              fontSize: 15,
              color: "#f1f5f9",
              lineHeight: 1.75,
              fontWeight: 500,
              margin: 0,
            }}
          >
            <MathText text={q.question} />
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
            marginBottom: 14,
          }}
        >
          {q.options.map((opt) => {
            const hasLabel = /^[ABCD]\.\s/i.test(opt);
            const letter = hasLabel
              ? opt.charAt(0).toUpperCase()
              : ["A", "B", "C", "D"][q.options.indexOf(opt)] || "?";
            const content = hasLabel ? opt.slice(3).trim() : opt;
            const isCorrect = letter === q.answer.toUpperCase();
            const isSelected = selected === opt;
            const cls = revealed
              ? isCorrect
                ? "opt-btn opt-correct"
                : isSelected
                  ? "opt-btn opt-wrong"
                  : "opt-btn opt-default opt-dimmed"
              : "opt-btn opt-default";

            return (
              <button
                key={opt}
                onClick={() => pick(opt)}
                className={cls}
                disabled={revealed}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    background:
                      revealed && isCorrect
                        ? "rgba(52,211,153,0.25)"
                        : revealed && isSelected
                          ? "rgba(239,68,68,0.2)"
                          : "rgba(255,255,255,0.06)",
                    color:
                      revealed && isCorrect
                        ? "#34d399"
                        : revealed && isSelected
                          ? "#f87171"
                          : "#475569",
                  }}
                >
                  {revealed && isCorrect
                    ? "✓"
                    : revealed && isSelected
                      ? "✗"
                      : letter}
                </span>
                <span style={{ flex: 1 }}>
                  <MathText text={content} />
                </span>
              </button>
            );
          })}
        </div>

        {revealed && q.explanation && (
          <div
            style={{
              borderRadius: 12,
              padding: "13px 15px",
              marginBottom: 12,
              background: "rgba(99,102,241,0.07)",
              border: "1px solid rgba(99,102,241,0.18)",
              animation: "qp-fade 0.3s ease",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#818cf8",
                marginBottom: 5,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Explanation
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#94a3b8",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              <MathText text={q.explanation} />
            </p>
          </div>
        )}

        {revealed && (
          <button
            className="next-btn"
            onClick={next}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              background: "linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)",
              border: "1px solid rgba(129,140,248,0.4)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
              transition: "all 0.2s",
              animation: "qp-fade 0.3s ease",
            }}
          >
            {current + 1 >= total ? "See Results →" : "Next Question →"}
          </button>
        )}
      </div>
    </>
  );
}
