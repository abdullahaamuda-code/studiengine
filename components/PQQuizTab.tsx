"use client";
import { useState, useEffect } from "react";
import InputPanel from "./InputPanel";
import QuizPlayer from "./QuizPlayer";
import QuestionCountSelector from "./QuestionCountSelector";
import UpgradeModal from "./UpgradeModal";
import TimerSetup from "./TimerSetup";
import { useAuth } from "@/context/AuthContext";
import { getUsage, canGenerateQuiz, canScanPDF, incrementQuiz, incrementScan, getLimitsForUser } from "@/lib/limits";
import { useToast } from "./Toast";

export default function PQQuizTab({ onCBTComplete }: { onCBTComplete?: () => void }) {
  const { userId, isPremium, isGuest } = useAuth();
  const { show } = useToast();
  const [questions, setQuestions] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(10);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [progress, setProgress] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [usageInfo, setUsageInfo] = useState<{quizCount: number} | null>(null);

  const limits = getLimitsForUser(isPremium, isGuest);
  const quizLimit = isGuest ? 2 : isPremium ? Infinity : 4;

  useEffect(() => {
    if (!userId) return;
    getUsage(userId).then(u => setUsageInfo({ quizCount: u.quizCount })).catch(() => {});
  }, [userId]);

  async function handleSubmit(content: string, images?: string[]) {
    if (!userId) { setError("Please sign in or continue as guest first."); return; }
    setError(""); setNotice(""); setLoading(true); setProgress(10);

    try {
      const usage = await getUsage(userId);
      if (!canGenerateQuiz(usage, isGuest)) {
        setUpgradeReason(`You've used all ${quizLimit} CBTs for today. Upgrade for unlimited access.`);
        setShowUpgrade(true); setLoading(false); setProgress(0); return;
      }
      if (images?.length && !canScanPDF(usage, isGuest)) {
        setUpgradeReason("You've used all free PDF scans for today. Upgrade for unlimited scans.");
        setShowUpgrade(true); setLoading(false); setProgress(0); return;
      }

      const trimmedImages = images ? images.slice(0, limits.maxPages) : undefined;
      const interval = setInterval(() => setProgress(p => Math.min(p + 2, 88)), 800);

      const body = trimmedImages?.length
        ? { type: "pq_quiz", content: "", images: trimmedImages, count, isPremium }
        : { type: "pq_quiz", content, count, isPremium };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      clearInterval(interval); setProgress(100);

      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Something went wrong."); setLoading(false); setProgress(0); return; }

      await incrementQuiz(userId);
      if (trimmedImages?.length) await incrementScan(userId);
      if (data.notice) setNotice(data.notice);
      if (data.subject) setSubject(data.subject);
      setQuestions(data.questions || []);
      show(`${(data.questions || []).length} questions ready!`, "success");
    } catch (e: any) {
      setError(e.message || "Network error.");
    }
    setLoading(false); setProgress(0);
  }

  if (questions) return (
    <QuizPlayer
      questions={questions}
      onReset={() => { setQuestions(null); setNotice(""); setSubject(null); }}
      userId={userId}
      isPremium={isPremium}
      onComplete={onCBTComplete}
      notice={notice}
      timerSeconds={timerSeconds}
      subject={subject}
    />
  );

  return (
    <div className="animate-in">
      <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>
        Paste past questions or upload a PDF — converted to interactive CBT with answers and explanations.
      </p>
      {usageInfo && !isPremium && (
        <div style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>CBTs today</span>
          <span style={{ color: usageInfo.quizCount >= quizLimit ? "#f87171" : "#4ade80", fontWeight: 600 }}>{usageInfo.quizCount} / {quizLimit}</span>
        </div>
      )}
      <QuestionCountSelector value={count} onChange={setCount} maxAllowed={limits.maxQuestions} />
      {notice && (
        <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 8, fontSize: 12, color: "#fbbf24" }}>
          ℹ️ {notice}
        </div>
      )}
      <TimerSetup onStart={setTimerSeconds} selected={timerSeconds} />
      <InputPanel
        onSubmit={handleSubmit}
        loading={loading}
        progress={progress}
        placeholder={`Paste your past questions here...\n\nExamples:\n• JAMB 2022 Chemistry questions\n• WAEC 2019 Mathematics objectives\n• University exam questions`}
        buttonLabel="Convert to CBT →"
        hint="Questions with A B C D options will be preserved."
      />
      {error && <div style={{ marginTop: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>⚠️ {error}</div>}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} reason={upgradeReason} />}
    </div>
  );
}
