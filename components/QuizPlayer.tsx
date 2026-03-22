"use client";
import { useState, useEffect, useCallback } from "react";
import MathText from "./MathText";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  year?: string;
}

interface QuizPlayerProps {
  questions: Question[];
  onReset: () => void;
  userId?: string;
  isPremium?: boolean;
  onComplete?: () => void;
}

export default function QuizPlayer({ questions, onReset, userId, isPremium, onComplete }: QuizPlayerProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [wrongOnes, setWrongOnes] = useState<Question[]>([]);
  const [animKey, setAnimKey] = useState(0);
  const [saved, setSaved] = useState(false);

  const q = questions[current];
  const total = questions.length;

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (done) return;
      if (!revealed) {
        const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
        const idx = map[e.key.toLowerCase()];
        if (idx !== undefined && q.options[idx]) {
          pick(q.options[idx]);
        }
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

  async function saveHistory(finalScore: number) {
    if (!isPremium || !userId || saved) return;
    try {
      await addDoc(collection(db, "users", userId, "history"), {
        questions, score: finalScore, total,
        pct: Math.round((finalScore / total) * 100),
        createdAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (e) { console.error("Failed to save history:", e); }
  }

  function pick(opt: string) {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    const correct = opt.charAt(0).toUpperCase() === q.answer.toUpperCase();
    if (correct) setScore(s => s + 1);
    else setWrongOnes(w => [...w, q]);
  }

  function next() {
    if (current + 1 >= total) {
      saveHistory(score);
      setDone(true);
      if (onComplete) onComplete();
      return;
    }
    setAnimKey(k => k + 1);
    setCurrent(c => c + 1);
    setSelected(null);
    setRevealed(false);
  }

  if (done) {
    const finalPct = Math.round((score / total) * 100);
    const grade = finalPct >= 80
      ? { emoji: "🔥", label: "Excellent!", color: "#4ade80", msg: "You know this material. Keep it sharp." }
      : finalPct >= 60
      ? { emoji: "📚", label: "Good effort", color: "#fbbf24", msg: "Review the ones you got wrong before exam day." }
      : { emoji: "💪", label: "Keep grinding", color: "#f87171", msg: "More revision needed. Focus on the missed topics." };

    return (
      <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Score */}
        <div style={{ textAlign: "center", padding: "24px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{grade.emoji}</div>
          <div style={{ fontSize: 38, fontWeight: 800, fontFamily: "var(--font-display)", color: grade.color, marginBottom: 4 }}>{score}/{total}</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: 6 }}>{grade.label}</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 280, margin: "0 auto" }}>{grade.msg}</p>
          <div style={{ position: "relative", width: 100, height: 100, margin: "20px auto 0" }}>
            <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={grade.color} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - finalPct / 100)}`}
                style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: grade.color, fontFamily: "var(--font-display)" }}>
              {finalPct}%
            </div>
          </div>
          {isPremium && saved && <p style={{ fontSize: 11, color: "#4ade80", marginTop: 12 }}>✓ Saved to your history</p>}
        </div>

        {/* Extensive review */}
        <div className="glass" style={{ borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              Extensive Review
            </p>
            {!isPremium && (
              <span style={{ fontSize: 10, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", padding: "3px 8px", borderRadius: 20 }}>
                ⚡ Premium — full access
              </span>
            )}
          </div>

          {questions.map((rq, i) => {
            const isLocked = !isPremium && i >= 3;
            const userWasWrong = wrongOnes.some(w => w.id === rq.id);

            return (
              <div key={i} className={isLocked ? "review-locked" : ""} style={{
                padding: "12px 0",
                borderBottom: i < questions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                position: "relative",
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: userWasWrong ? "#f87171" : "#4ade80", flexShrink: 0, marginTop: 2 }}>
                    {userWasWrong ? "✗" : "✓"}
                  </span>
                  <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.55 }}>
                    <MathText text={rq.question} />
                  </p>
                </div>
                <div style={{ paddingLeft: 18 }}>
                  <p style={{ fontSize: 12, color: "#4ade80", marginBottom: 4 }}>
                    Answer: {rq.answer}. <MathText text={rq.options.find(o => o.charAt(0).toUpperCase() === rq.answer.toUpperCase())?.slice(3) || ""} />
                  </p>
                  {rq.explanation && (
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      <MathText text={rq.explanation} />
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Lock overlay for non-premium */}
          {!isPremium && questions.length > 3 && (
            <div style={{ marginTop: 12, padding: "14px 16px", background: "linear-gradient(135deg,rgba(234,179,8,0.08),rgba(251,191,36,0.05))", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4, fontWeight: 600 }}>
                🔒 {questions.length - 3} more questions locked
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Upgrade to Premium for full review of all questions</p>
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={onReset} style={{ padding: "13px 0", borderRadius: 12, fontSize: 14 }}>← New CBT</button>
      </div>
    );
  }

  const pct = Math.round((current / total) * 100);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>{current + 1} / {total}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>⚡ {score} correct</span>
          <button onClick={onReset} className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6 }}>Quit</button>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 2, height: 3, marginBottom: 4 }}>
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right", marginBottom: 20 }}>
        Press A B C D to answer • Space/Enter for next
      </p>

      <div key={animKey} className="animate-in glass" style={{ borderRadius: 16, padding: "20px 18px", marginBottom: 14 }}>
        {q.year && <span style={{ fontSize: 10, color: "#60a5fa", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.25)", padding: "3px 10px", borderRadius: 20, display: "inline-block", marginBottom: 12 }}>{q.year}</span>}
        <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.7, fontWeight: 500 }}><MathText text={q.question} /></p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {q.options.map((opt) => {
          const letter = opt.charAt(0).toUpperCase();
          const isCorrect = letter === q.answer.toUpperCase();
          const isSelected = selected === opt;
          let cls = "option-default";
          if (revealed) { if (isCorrect) cls = "option-correct"; else if (isSelected) cls = "option-wrong"; }
          const optContent = opt.slice(2).trim();
          return (
            <button key={opt} onClick={() => pick(opt)} className={cls}
              style={{ padding: "12px 14px", borderRadius: 11, textAlign: "left", fontSize: 14, cursor: revealed ? "default" : "pointer", fontFamily: "var(--font-body)", lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: revealed && isCorrect ? "rgba(22,163,74,0.3)" : revealed && isSelected ? "rgba(220,38,38,0.3)" : "rgba(255,255,255,0.06)", color: revealed && isCorrect ? "#4ade80" : revealed && isSelected ? "#f87171" : "var(--text-muted)" }}>
                {revealed && isCorrect ? "✓" : revealed && isSelected ? "✗" : letter}
              </span>
              <span style={{ flex: 1 }}><MathText text={optContent || opt} /></span>
            </button>
          );
        })}
      </div>

      {revealed && q.explanation && (
        <div className="animate-fade glass-static" style={{ borderRadius: 12, padding: "12px 14px", marginBottom: 14, borderColor: "rgba(59,130,246,0.2)" }}>
          <p style={{ fontSize: 12, color: "#60a5fa", marginBottom: 4, fontWeight: 600 }}>EXPLANATION</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}><MathText text={q.explanation} /></p>
        </div>
      )}

      {revealed && (
        <button className="btn-primary animate-fade" onClick={next} style={{ width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 14 }}>
          {current + 1 >= total ? "See Results →" : "Next Question →"}
        </button>
      )}
    </div>
  );
}
