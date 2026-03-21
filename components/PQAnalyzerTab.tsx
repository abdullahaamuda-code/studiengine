"use client";
import { useState, useEffect } from "react";
import InputPanel from "./InputPanel";
import UpgradeModal from "./UpgradeModal";
import { useAuth } from "@/context/AuthContext";
import { getUsage, canGenerateQuiz, canScanPDF, incrementQuiz, incrementScan, getLimitsForUser } from "@/lib/limits";
import { useToast } from "./Toast";

interface Analysis {
  topTopics: { topic: string; frequency: string; count: number; likelyExam: boolean }[];
  patterns: string[];
  hotTopics: string[];
  yearsCovered: string[];
  totalQuestions: number;
  advice: string;
  subjectArea: string;
}

export default function PQAnalyzerTab() {
  const { userId, isPremium, isGuest } = useAuth();
  const { show } = useToast();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [usageInfo, setUsageInfo] = useState<{quizCount:number} | null>(null);

  const limits = getLimitsForUser(isPremium, isGuest);
  const quizLimit = isGuest ? 2 : isPremium ? Infinity : 4;

  useEffect(() => {
    if (!userId) return;
    getUsage(userId).then(u => setUsageInfo({ quizCount: u.quizCount })).catch(() => {});
  }, [userId]);

  async function handleSubmit(content: string, images?: string[]) {
    if (!userId) { setError("Please sign in or continue as guest first."); return; }
    setError(""); setLoading(true); setProgress(0);
    try {
      const usage = await getUsage(userId);
      if (!canGenerateQuiz(usage, isGuest)) {
        setUpgradeReason(`You've used all ${quizLimit} analyses for today. Upgrade for unlimited.`);
        setShowUpgrade(true); setLoading(false); return;
      }
      if (images?.length && !canScanPDF(usage, isGuest)) {
        setUpgradeReason("You've used all free scanned PDF uploads for today. Upgrade for unlimited scans.");
        setShowUpgrade(true); setLoading(false); return;
      }
      const trimmedImages = images ? images.slice(0, limits.maxPages) : undefined;
      const batches = trimmedImages ? Math.ceil(trimmedImages.length / 5) : 1;
      let prog = 10; setProgress(prog);
      const interval = setInterval(() => { prog = Math.min(prog + (90 / batches) / 3, 90); setProgress(Math.round(prog)); }, 1000);
      const body = trimmedImages?.length ? { content: "", images: trimmedImages } : { content };
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      clearInterval(interval); setProgress(100);
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Something went wrong."); setLoading(false); return; }
      await incrementQuiz(userId);
      if (trimmedImages?.length) await incrementScan(userId);
      setAnalysis(data.analysis);
      show("Analysis complete!", "success");
    } catch (e: any) { setError(e.message || "Network error."); }
    setLoading(false); setProgress(0);
  }

  const freqColor = (f: string) => f === "high" ? "#f87171" : f === "medium" ? "#fbbf24" : "var(--text-muted)";

  if (analysis) return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="glass" style={{ borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Subject</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{analysis.subjectArea || "General"}</p>
        </div>
        <div className="glass" style={{ borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Questions</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{analysis.totalQuestions || "—"}</p>
        </div>
      </div>
      {analysis.hotTopics?.length > 0 && (
        <div className="glass" style={{ borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: 11, color: "#f87171", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>🔥 Focus These for Exam</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {analysis.hotTopics.map((t, i) => <span key={i} className="badge-hot" style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, fontWeight: 500 }}>{t}</span>)}
          </div>
        </div>
      )}
      {analysis.topTopics?.length > 0 && (
        <div className="glass" style={{ borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Topic Frequency</p>
          {analysis.topTopics.map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < analysis.topTopics.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: freqColor(t.frequency), flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{t.topic}</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {t.likelyExam && <span className="badge-exam" style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>Likely Exam</span>}
                <span style={{ fontSize: 11, color: freqColor(t.frequency), fontWeight: 600, textTransform: "uppercase" }}>{t.frequency}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {analysis.patterns?.length > 0 && (
        <div className="glass" style={{ borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Patterns Spotted</p>
          {analysis.patterns.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderBottom: i < analysis.patterns.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <span style={{ color: "#60a5fa", fontSize: 12, marginTop: 2, flexShrink: 0 }}>→</span>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{p}</p>
            </div>
          ))}
        </div>
      )}
      {analysis.advice && (
        <div style={{ borderRadius: 14, padding: 16, background: "linear-gradient(135deg,rgba(37,99,235,0.1),rgba(8,145,178,0.08))", border: "1px solid rgba(59,130,246,0.2)" }}>
          <p style={{ fontSize: 11, color: "#60a5fa", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>💬 Revision Strategy</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{analysis.advice}</p>
        </div>
      )}
      {analysis.yearsCovered?.length > 0 && <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>Years analyzed: {analysis.yearsCovered.join(", ")}</p>}
      <button onClick={() => setAnalysis(null)} className="btn-ghost" style={{ padding: "12px 0", borderRadius: 12, fontSize: 13, width: "100%" }}>← Analyze New Questions</button>
    </div>
  );

  return (
    <div className="animate-in">
      <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>
        Paste past questions from any year — get topic frequency, exam patterns, and a revision strategy.
      </p>
      {usageInfo && !isPremium && (
        <div style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>Quizzes today</span>
          <span style={{ color: usageInfo.quizCount >= quizLimit ? "#f87171" : "#4ade80", fontWeight: 600 }}>{usageInfo.quizCount} / {quizLimit}</span>
        </div>
      )}
      <InputPanel onSubmit={handleSubmit} loading={loading} progress={progress}
        placeholder={`Paste past questions here...\n\nMultiple years = better pattern detection.\n\nExample: JAMB 2019-2023 Chemistry, WAEC Biology, university exam questions...`}
        buttonLabel="Analyze Past Questions →"
        hint="The more years you include, the more accurate the pattern detection." />
      {error && <div style={{ marginTop: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>⚠️ {error}</div>}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} reason={upgradeReason} />}
    </div>
  );
}