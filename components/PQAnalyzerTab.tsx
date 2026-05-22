"use client";
import { useState, useEffect } from "react";
import InputPanel from "./InputPanel";
import UpgradeModal from "./UpgradeModal";
import { useAuth } from "@/context/AuthContext";
import { getUsage, canGenerateQuiz, canScanPDF, incrementQuiz, incrementScan, getLimitsForUser } from "@/lib/limits";
import { useToast } from "./Toast";
import { useUsage } from "@/hooks/useUsage";

interface TopicItem { topic: string; frequency: string; count: number; likelyExam: boolean; }
interface Analysis {
  topTopics: TopicItem[]; patterns: string[];
  hotTopics: string[]; yearsCovered: string[];
  totalQuestions: number; advice: string; subjectArea: string;
}

function freqColor(f: string) {
  return f === "high" ? "#f87171" : f === "medium" ? "#fbbf24" : "#475569";
}
function freqBg(f: string) {
  return f === "high" ? "rgba(239,68,68,0.08)" : f === "medium" ? "rgba(251,191,36,0.07)" : "rgba(255,255,255,0.03)";
}
function freqBorder(f: string) {
  return f === "high" ? "rgba(239,68,68,0.2)" : f === "medium" ? "rgba(251,191,36,0.18)" : "rgba(255,255,255,0.07)";
}

export default function PQAnalyzerTab() {
  const { userId, isGuest } = useAuth();
  const { show } = useToast();
  const { hasActivePremium } = useUsage();
  const isPremium = hasActivePremium;

  const [analysis, setAnalysis]           = useState<Analysis | null>(null);
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [progress, setProgress]           = useState(0);
  const [showUpgrade, setShowUpgrade]     = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [usageInfo, setUsageInfo]         = useState<{ quizCount: number } | null>(null);

  const limits    = getLimitsForUser(isPremium, isGuest);
  const quizLimit = isGuest ? 2 : isPremium ? Infinity : 4;

  useEffect(() => {
    if (!userId) return;
    getUsage(userId).then(u => setUsageInfo({ quizCount: u.quizCount })).catch(() => {});
  }, [userId]);

  async function handleSubmit(content: string, images?: string[]) {
    if (!userId) { setError("Please sign in or continue as guest first."); return; }
    setError(""); setLoading(true); setProgress(0);
    try {
      const usageDoc = await getUsage(userId);
      if (!canGenerateQuiz(usageDoc, isGuest) && !isPremium) {
        setUpgradeReason(`You've used all ${quizLimit} analyses for today. Upgrade for unlimited.`);
        setShowUpgrade(true); setLoading(false); return;
      }
      if (images?.length && !canScanPDF(usageDoc, isGuest) && !isPremium) {
        setUpgradeReason("You've used all free PDF scans for today. Upgrade for unlimited scans.");
        setShowUpgrade(true); setLoading(false); return;
      }

      const trimmedImages = images ? images.slice(0, limits.maxPages) : undefined;
      const batches = trimmedImages ? Math.ceil(trimmedImages.length / 5) : 1;
      let prog = 10; setProgress(prog);
      const interval = setInterval(() => {
        prog = Math.min(prog + (90/batches)/3, 90);
        setProgress(Math.round(prog));
      }, 1000);

      const body = trimmedImages?.length ? { content:"", images:trimmedImages } : { content };
      const res  = await fetch("/api/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
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

  /* ─────────── RESULTS VIEW ─────────── */
  if (analysis) return (
    <>
      <style>{`
        @keyframes an-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .an-wrap { animation:an-in 0.4s cubic-bezier(0.4,0,0.2,1); display:flex; flex-direction:column; gap:12px; }
        .an-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:16px; }
        .topic-row:not(:last-child) { border-bottom:1px solid rgba(255,255,255,0.05); }
        .pattern-row:not(:last-child) { border-bottom:1px solid rgba(255,255,255,0.05); }
        .back-btn:hover { background:rgba(255,255,255,0.06) !important; border-color:rgba(255,255,255,0.12) !important; }
      `}</style>

      <div className="an-wrap">
        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <div style={{ background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:13, padding:"14px 16px" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#6366f1", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>Subject</p>
            <p style={{ fontSize:16, fontWeight:800, color:"#f1f5f9", fontFamily:"var(--font-display)", margin:0, letterSpacing:"-0.01em" }}>{analysis.subjectArea || "General"}</p>
          </div>
          <div style={{ background:"rgba(56,189,248,0.07)", border:"1px solid rgba(56,189,248,0.18)", borderRadius:13, padding:"14px 16px" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#38bdf8", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>Questions</p>
            <p style={{ fontSize:16, fontWeight:800, color:"#f1f5f9", fontFamily:"var(--font-display)", margin:0, letterSpacing:"-0.01em" }}>{analysis.totalQuestions || "—"}</p>
          </div>
        </div>

        {/* Hot topics */}
        {analysis.hotTopics?.length > 0 && (
          <div style={{ background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:14, padding:"14px 16px" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#f87171", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
              <span>🔥</span> Focus These for Exam
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {analysis.hotTopics.map((t,i) => (
                <span key={i} style={{ fontSize:12.5, padding:"5px 13px", borderRadius:99, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#fca5a5", fontWeight:600 }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Topic frequency */}
        {analysis.topTopics?.length > 0 && (
          <div className="an-card">
            <p style={{ fontSize:11, fontWeight:700, color:"#334155", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:14 }}>Topic Frequency</p>
            <div style={{ display:"flex", flexDirection:"column" }}>
              {analysis.topTopics.map((t,i) => (
                <div key={i} className="topic-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:freqColor(t.frequency), boxShadow:`0 0 5px ${freqColor(t.frequency)}80`, flexShrink:0 }} />
                    <span style={{ fontSize:13, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.topic}</span>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0, marginLeft:8 }}>
                    {t.likelyExam && (
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", color:"#6ee7b7", fontWeight:600 }}>Likely Exam</span>
                    )}
                    <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", padding:"3px 9px", borderRadius:99, background:freqBg(t.frequency), border:`1px solid ${freqBorder(t.frequency)}`, color:freqColor(t.frequency) }}>
                      {t.frequency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patterns */}
        {analysis.patterns?.length > 0 && (
          <div className="an-card">
            <p style={{ fontSize:11, fontWeight:700, color:"#334155", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>Patterns Spotted</p>
            <div style={{ display:"flex", flexDirection:"column" }}>
              {analysis.patterns.map((p,i) => (
                <div key={i} className="pattern-row" style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"8px 0" }}>
                  <span style={{ color:"#818cf8", fontSize:13, flexShrink:0, marginTop:2, fontWeight:700 }}>→</span>
                  <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.65, margin:0 }}>{p}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategy */}
        {analysis.advice && (
          <div style={{ background:"linear-gradient(135deg,rgba(99,102,241,0.08),rgba(56,189,248,0.05))", border:"1px solid rgba(99,102,241,0.18)", borderRadius:14, padding:"14px 16px" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#818cf8", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>💬 Revision Strategy</p>
            <p style={{ fontSize:13.5, color:"#94a3b8", lineHeight:1.75, margin:0 }}>{analysis.advice}</p>
          </div>
        )}

        {/* Years covered */}
        {analysis.yearsCovered?.length > 0 && (
          <p style={{ fontSize:11.5, color:"#334155", textAlign:"center" }}>
            Years analyzed: {analysis.yearsCovered.join(", ")}
          </p>
        )}

        <button className="back-btn" onClick={() => setAnalysis(null)}
          style={{ width:"100%", padding:"12px 0", borderRadius:11, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", color:"var(--text-muted)", fontSize:13.5, cursor:"pointer", fontFamily:"var(--font-body)", transition:"all 0.2s", fontWeight:500 }}>
          ← Analyze New Questions
        </button>
      </div>
    </>
  );

  /* ─────────── INPUT VIEW ─────────── */
  const usedAll = usageInfo && !isPremium && usageInfo.quizCount >= quizLimit;

  return (
    <>
      <style>{`
        @keyframes an-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .an-input-wrap { animation:an-in 0.35s cubic-bezier(0.4,0,0.2,1); }
        .upgrade-nudge:hover { border-color:rgba(251,191,36,0.4) !important; background:rgba(251,191,36,0.09) !important; }
      `}</style>

      <div className="an-input-wrap" style={{ display:"flex", flexDirection:"column", gap:16 }}>

        <p style={{ fontSize:13.5, color:"var(--text-muted)", lineHeight:1.7, margin:0 }}>
          Paste past questions from any year — discover hot topics, repeated patterns, and get a smart revision strategy.
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

        {usedAll && (
          <button className="upgrade-nudge" onClick={() => { setUpgradeReason(`You've used all ${quizLimit} CBTs for today.`); setShowUpgrade(true); }}
            style={{ width:"100%", padding:"11px 14px", background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:11, cursor:"pointer", fontFamily:"var(--font-body)", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, transition:"all 0.2s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:16 }}>⚡</span>
              <div>
                <p style={{ fontSize:12.5, fontWeight:700, color:"#fbbf24", margin:"0 0 1px" }}>Daily limit reached</p>
                <p style={{ fontSize:11.5, color:"#92400e", margin:0 }}>Upgrade Premium for unlimited analyses every day</p>
              </div>
            </div>
            <span style={{ fontSize:12, color:"#fbbf24", fontWeight:700, flexShrink:0 }}>Upgrade →</span>
          </button>
        )}

        <InputPanel
          onSubmit={handleSubmit} loading={loading} progress={progress}
          placeholder={`Paste past questions here…\n\nMultiple years = better pattern detection.\n\nExample: JAMB 2019–2023 Chemistry, WAEC Biology, university exam questions…`}
          buttonLabel="Analyze Past Questions →"
          hint="The more years you include, the more accurate the pattern detection."
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
