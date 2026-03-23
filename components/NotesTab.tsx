"use client";
import { useState, useEffect } from "react";
import InputPanel from "./InputPanel";
import QuizPlayer from "./QuizPlayer";
import QuestionCountSelector from "./QuestionCountSelector";
import UpgradeModal from "./UpgradeModal";
import QuestionChoiceModal from "./QuestionChoiceModal";
import { useAuth } from "@/context/AuthContext";
import { getUsage, canGenerateQuiz, incrementQuiz, getLimitsForUser } from "@/lib/limits";
import { useToast } from "./Toast";

export default function NotesTab({ onCBTComplete }: { onCBTComplete?: () => void }) {
  const { userId, isPremium, isGuest } = useAuth();
  const { show } = useToast();
  const [questions, setQuestions] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [suggestedCount, setSuggestedCount] = useState<number | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<any[] | null>(null);
  const [showChoice, setShowChoice] = useState(false);
  const [filling, setFilling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(10);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [progress, setProgress] = useState(0);
  const [usageInfo, setUsageInfo] = useState<{quizCount: number} | null>(null);

  const limits = getLimitsForUser(isPremium, isGuest);
  const quizLimit = isGuest ? 2 : isPremium ? Infinity : 4;

  useEffect(() => {
    if (!userId) return;
    getUsage(userId).then(u => setUsageInfo({ quizCount: u.quizCount })).catch(() => {});
  }, [userId]);

  async function handleSubmit(content: string, images?: string[]) {
    if (!userId) { setError("Please sign in or continue as guest first."); return; }
    setError(""); setNotice(""); setLoading(true); setProgress(0);
    try {
      const usage = await getUsage(userId);
      if (!canGenerateQuiz(usage, isGuest)) {
        setUpgradeReason(`You've used all ${quizLimit} CBTs for today. Upgrade for unlimited access.`);
        setShowUpgrade(true); setLoading(false); return;
      }
      const trimmedImages = images ? images.slice(0, limits.maxPages) : undefined;
      const batches = trimmedImages ? Math.ceil(trimmedImages.length / 5) : 1;
      let prog = 10; setProgress(prog);
      const interval = setInterval(() => { prog = Math.min(prog + (90 / batches) / 3, 90); setProgress(Math.round(prog)); }, 1000);

      const body = trimmedImages?.length
        ? { type: "notes_quiz", content: "", images: trimmedImages, count, isPremium }
        : { type: "notes_quiz", content, count, isPremium };

      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      clearInterval(interval); setProgress(100);
      const data = await res.json();
      if (!res.ok || data.error) {
        const errMsg = data.error || "Something went wrong.";
        // If we know totalFound, show that instead of parse error
        if (data.totalFound === 0) {
          setError("No questions could be extracted. Try pasting the text directly instead of uploading.");
        } else {
          setError(errMsg);
        }
        setLoading(false); return;
      }
      await incrementQuiz(userId);
      const effectiveCount = Math.min(count, limits.maxQuestions);
      if (data.needsChoice && data.totalFound > 0 && data.totalFound < effectiveCount) {
        // Show choice modal instead of starting quiz
        setPendingQuestions(data.questions || []);
        setSuggestedCount(data.totalFound);
        setShowChoice(true);
        setLoading(false);
        return;
      }
      if (data.notice) {
        setNotice(data.notice);
        if (data.totalFound && data.totalFound < count) setSuggestedCount(data.totalFound);
      }
      setQuestions(data.questions || []);
      show(`${(data.questions || []).length} questions generated!`, "success");
    } catch (e: any) { setError(e.message || "Network error."); }
    setLoading(false); setProgress(0);
  }


  async function handleUseFound() {
    setShowChoice(false);
    setQuestions(pendingQuestions);
    setPendingQuestions(null);
  }

  async function handleFillRemaining() {
    if (!pendingQuestions || !suggestedCount) return;
    setFilling(true);
    const fillCount = count - suggestedCount;
    const topic = pendingQuestions[0]?.question?.slice(0, 80) || "the subject";
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fill_remaining", fillCount, topic, existingQuestions: pendingQuestions, isPremium }),
      });
      const data = await res.json();
      const filled = data.questions || [];
      setQuestions([...pendingQuestions, ...filled]);
    } catch {
      setQuestions(pendingQuestions);
    }
    setFilling(false);
    setShowChoice(false);
    setPendingQuestions(null);
  }

  if (questions) return <QuizPlayer questions={questions} onReset={() => { setQuestions(null); setNotice(""); setSuggestedCount(null); }} notice={notice} userId={userId} isPremium={isPremium} onComplete={onCBTComplete} />;

  return (
    <div className="animate-in">
      <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>
        Paste your lecture notes or upload a PDF — get CBT practice questions instantly.
      </p>
      {usageInfo && !isPremium && (
        <div style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>CBTs today</span>
          <span style={{ color: usageInfo.quizCount >= quizLimit ? "#f87171" : "#4ade80", fontWeight: 600 }}>{usageInfo.quizCount} / {quizLimit}</span>
        </div>
      )}
      <QuestionCountSelector value={count} onChange={setCount} maxAllowed={limits.maxQuestions} />
      {notice && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" as const }}>
          <span>ℹ️ {notice}</span>
          {suggestedCount && (
            <button onClick={() => { setCount(suggestedCount); setNotice(""); setSuggestedCount(null); }}
              style={{ fontSize: 11, padding: "4px 12px", background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 20, color: "#fbbf24", cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap" as const, fontWeight: 600 }}>
              Use {suggestedCount} →
            </button>
          )}
        </div>
      )}
      <InputPanel onSubmit={handleSubmit} loading={loading} progress={progress}
        placeholder={`Paste your lecture notes here...\n\nAny subject — Chemistry, Economics, Government, Biology, Physics, Mathematics...`}
        buttonLabel={`Generate ${count} CBT Questions →`}
        hint="Works best with at least 2-3 paragraphs of notes." />
      {error && <div style={{ marginTop: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>⚠️ {error}</div>}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} reason={upgradeReason} />}
      {showChoice && pendingQuestions && suggestedCount && (
        <QuestionChoiceModal
          found={suggestedCount}
          requested={Math.min(count, limits.maxQuestions)}
          isPremium={isPremium}
          onUseFound={handleUseFound}
          onFillRemaining={handleFillRemaining}
          filling={filling}
        />
      )}
    </div>
  );
}
