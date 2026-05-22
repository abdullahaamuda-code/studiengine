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
import { useUsage } from "@/hooks/useUsage";

export default function PQQuizTab({ onCBTComplete }: { onCBTComplete?: () => void }) {
  const { userId, isGuest } = useAuth();
  const { show } = useToast();
  const { hasActivePremium } = useUsage();
  const isPremium = hasActivePremium;

  const [questions, setQuestions]         = useState<any[] | null>(null);
  const [error, setError]                 = useState("");
  const [notice, setNotice]               = useState("");
  const [subject, setSubject]             = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [count, setCount]                 = useState(10);
  const [showUpgrade, setShowUpgrade]     = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [progress, setProgress]           = useState(0);
  const [timerSeconds, setTimerSeconds]   = useState<number | null>(null);
  const [usageInfo, setUsageInfo]         = useState<{ quizCount: number } | null>(null);

  const limits    = getLimitsForUser(isPremium, isGuest);
  const quizLimit = isGuest ? 2 : isPremium ? Infinity : 4;

  useEffect(() => {
    if (!userId) return;
    getUsage(userId).then(u => setUsageInfo({ quizCount: u.quizCount })).catch(() => {});
  }, [userId]);

  async function handleSubmit(content: string, images?: string[]) {
    if (!userId) { setError("Please sign in or continue as guest first."); return; }
    setError(""); setNotice(""); setLoading(true); setProgress(10);

    try {
      const usageDoc = await getUsage(userId);
      if (!canGenerateQuiz(usageDoc, isGuest) && !isPremium) {
        setUpgradeReason(`You've used all ${quizLimit} CBTs for today. Upgrade for unlimited access.`);
        setShowUpgrade(true); setLoading(false); setProgress(0); return;
      }
      if (images?.length && !canScanPDF(usageDoc, isGuest) && !isPremium) {
        setUpgradeReason("You've used all free PDF scans for today. Upgrade for unlimited scans.");
        setShowUpgrade(true); setLoading(false); setProgress(0); return;
      }

      const trimmedImages = images ? images.slice(0, limits.maxPages) : undefined;
      const interval = setInterval(() => setProgress(p => Math.min(p + 2, 88)), 800);

      const body = trimmedImages?.length
        ? { type:"pq_quiz", content:"", images:trimmedImages, count, isPremium }
        : { type:"pq_quiz", content, count, isPremium };

      const res  = await fetch("/api/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      clearInterval(interval); setProgress(100);

      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Something went wrong."); setLoading(false); setProgress(0); return; }

      await incrementQuiz(userId);
      if (trimmedImages?.length) await incrementScan(userId);
      if (data.notice)  setNotice(data.notice);
      if (data.subject) setSubject(data.subject);
      setQuestions(data.questions || []);
      show(`${(data.questions||[]).length} questions ready!`, "success");
    } catch (e: any) { setError(e.message || "Network error."); }
    setLoading(false); setProgress(0);
  }

  if (questions) return (
    <QuizPlayer
      questions={questions}
      onReset={() => { setQuestions(null); setNotice(""); setSubject(null); }}
      userId={userId} isPremium={isPremium}
      onComplete={onCBTComplete}
      notice={notice} timerSeconds={timerSeconds} subject={subject}
    />
  );

  const usedAll = usageInfo && !isPremium && usageInfo.quizCount >= quizLimit;

  return (
    <>
      <style>{`
        @keyframes pq-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pq-wrap { animation:pq-in 0.35s cubic-bezier(0.4,0,0.2,1); }
        .upgrade-nudge:hover { border-color:rgba(251,191,36,0.4) !important; background:rgba(251,191,36,0.09) !important; }
      `}</style>

      <div className="pq-wrap" style={{ display:"flex", flexDirection:"column", gap:16 }}>

        <p style={{ fontSize:13.5, color:"var(--text-muted)", lineHeight:1.7, margin:0 }}>
          Paste past questions or upload a PDF — converted to a live interactive CBT with answers and AI explanations.
        </p>

        {/* Usage tracker */}
        {usageInfo && !isPremium && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:11 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background: usedAll ? "#f87171" : usageInfo.quizCount >= quizLimit*0.75 ? "#fbbf24" : "#34d399", boxShadow:`0 0 6px ${usedAll ? "rgba(248,113,113,0.6)" : usageInfo.quizCount >= quizLimit*0.75 ? "rgba(251,191,36,0.6)" : "rgba(52,211,153,0.6)"}` }} />
              <span style={{ fontSize:12.5, color:"var(--text-muted)" }}>CBTs used today</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color: usedAll ? "#f87171" : "#f1f5f9" }}>
                {usageInfo.quizCount} <span style={{ color:"var(--text-muted)", fontWeight:400 }}>/ {quizLimit}</span>
              </span>
              <div style={{ width:60, height:4, background:"rgba(255,255,255,0.07)", borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min((usageInfo.quizCount/quizLimit)*100,100)}%`, background: usedAll ? "linear-gradient(90deg,#ef4444,#dc2626)" : "linear-gradient(90deg,#6366f1,#38bdf8)", borderRadius:99, transition:"width 0.4s ease" }} />
              </div>
            </div>
          </div>
        )}

        {/* Limit hit nudge */}
        {usedAll && (
          <button className="upgrade-nudge" onClick={() => { setUpgradeReason(`You've used all ${quizLimit} CBTs for today.`); setShowUpgrade(true); }}
            style={{ width:"100%", padding:"11px 14px", background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:11, cursor:"pointer", fontFamily:"var(--font-body)", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, transition:"all 0.2s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:16 }}>⚡</span>
              <div>
                <p style={{ fontSize:12.5, fontWeight:700, color:"#fbbf24", margin:"0 0 1px" }}>Daily limit reached</p>
                <p style={{ fontSize:11.5, color:"#92400e", margin:0 }}>Upgrade Premium for unlimited CBTs every day</p>
              </div>
            </div>
            <span style={{ fontSize:12, color:"#fbbf24", fontWeight:700, flexShrink:0 }}>Upgrade →</span>
          </button>
        )}

        <QuestionCountSelector value={count} onChange={setCount} maxAllowed={limits.maxQuestions} />

        {notice && (
          <div style={{ display:"flex", gap:8, padding:"9px 12px", background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.18)", borderRadius:10, fontSize:12.5, color:"#fde68a" }}>
            <span style={{ flexShrink:0 }}>ℹ️</span>{notice}
          </div>
        )}

        <TimerSetup onStart={setTimerSeconds} selected={timerSeconds} />

        <InputPanel
          onSubmit={handleSubmit} loading={loading} progress={progress}
          placeholder={`Paste your past questions here…\n\nExamples:\n• JAMB 2022 Chemistry\n• WAEC 2019 Mathematics objectives\n• University exam questions`}
          buttonLabel="Convert to CBT →"
          hint="Questions with A B C D options will be preserved as-is."
        />

        {error && (
          <div style={{ display:"flex", gap:8, padding:"10px 14px", background:"rgba(36,10,10,0.7)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:10, fontSize:13, color:"#fca5a5" }}>
            <span style={{ flexShrink:0 }}>⚠</span>{error}
          </div>
        )}
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} reason={upgradeReason} />}
    </>
  );
}
