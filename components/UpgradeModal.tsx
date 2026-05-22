"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Props { onClose: () => void; reason?: string; }

const FREE_FEATURES = [
  "4 CBTs per day",
  "Up to 15 questions per session",
  "Basic review (first 3 questions)",
  "PQ Analyzer",
  "Text PDF upload (up to 10 pages)",
  "Built-in calculator",
];

const PREMIUM_FEATURES = [
  { text: "Unlimited CBT generations every day",       hot: true  },
  { text: "Up to 30 questions per session",            hot: false },
  { text: "Full review of ALL answered questions",     hot: true  },
  { text: "AI step-by-step explanations for every Q", hot: true  },
  { text: "CBT history, stats & score tracking",      hot: false },
  { text: "Upload long PDFs (up to 30 pages)",        hot: false },
  { text: "Image scanning — notes from photos (beta)",hot: false },
];

const PLANS = [
  { id:"monthly",   label:"Monthly",   price:"₦600",   sub:"per month",     badge:null,   savings:null        },
  { id:"quarterly", label:"Quarterly", price:"₦1,600", sub:"per 3 months",  badge:"SAVE", savings:"Save ₦200" },
  { id:"annual",    label:"Annual",    price:"₦6,000", sub:"per year",       badge:"BEST", savings:"Save ₦1,200" },
] as const;

type PlanId = "monthly" | "quarterly" | "annual";

export default function UpgradeModal({ onClose, reason }: Props) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  async function handlePaystack() {
    if (!user?.email) {
      // Not signed in — redirect to auth
      window.location.href = "/auth?mode=signin";
      return;
    }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ email: user.email, plan: selectedPlan, userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Could not initiate payment."); setLoading(false); return; }
      // Redirect to Paystack checkout
      window.location.href = data.authorization_url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  function handleWhatsApp() {
    const email = user?.email || "no-email-provided";
    const msg   = `Hi, I want to upgrade my Studiengine account (${email}) to Premium — ${selectedPlan} plan. Please help me activate it.`;
    window.open(`https://wa.me/2348169936326?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(4,6,12,0.88)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{`
        @keyframes up-in  { from{opacity:0;transform:scale(0.96) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes up-spin{ to{transform:rotate(360deg)} }
        .plan-card { border-radius:12px; padding:14px 13px; cursor:pointer; transition:all 0.2s; text-align:left; font-family:var(--font-body); width:100%; border:1px solid; }
        .plan-active   { background:linear-gradient(135deg,rgba(99,102,241,0.18),rgba(56,189,248,0.1)); border-color:rgba(99,102,241,0.5); box-shadow:0 0 20px rgba(99,102,241,0.12); }
        .plan-inactive { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.08); }
        .plan-inactive:hover { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.13); }
        .pay-btn:not(:disabled):hover { box-shadow:0 8px 32px rgba(99,102,241,0.5) !important; transform:translateY(-1px); }
        .pay-btn:active { transform:translateY(0) !important; }
        .wa-btn:hover   { background:rgba(52,211,153,0.12) !important; }
      `}</style>

      <div style={{ background:"rgba(10,13,22,0.97)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:22, width:"100%", maxWidth:430, maxHeight:"92vh", overflowY:"auto", position:"relative", boxShadow:"0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.04)", animation:"up-in 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.5),transparent)" }} />

        {/* Close */}
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"#475569", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1, transition:"all 0.15s" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.1)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)";}}>×</button>

        {/* Header */}
        <div style={{ padding:"28px 24px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,rgba(251,191,36,0.15),rgba(245,158,11,0.08))", border:"1px solid rgba(251,191,36,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:14, boxShadow:"0 0 20px rgba(251,191,36,0.12)" }}>⚡</div>
          <h2 style={{ fontSize:22, fontWeight:800, fontFamily:"var(--font-display)", color:"#f1f5f9", margin:"0 0 8px", letterSpacing:"-0.02em" }}>Upgrade to Premium</h2>
          {reason ? (
            <div style={{ display:"flex", gap:8, padding:"9px 12px", background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:10, fontSize:13, color:"#fbbf24" }}>
              <span style={{ flexShrink:0 }}>⚠</span>{reason}
            </div>
          ) : (
            <p style={{ fontSize:13.5, color:"#475569", margin:0, lineHeight:1.6 }}>Unlock the full Studiengine experience — no limits.</p>
          )}
        </div>

        {/* Plan selector */}
        <div style={{ padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize:11, fontWeight:700, color:"#334155", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:11 }}>Choose a plan</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {PLANS.map(p => (
              <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                className={`plan-card ${selectedPlan===p.id ? "plan-active" : "plan-inactive"}`}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    {/* Radio dot */}
                    <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${selectedPlan===p.id ? "#818cf8" : "rgba(255,255,255,0.2)"}`, background:selectedPlan===p.id ? "rgba(99,102,241,0.3)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                      {selectedPlan===p.id && <div style={{ width:6, height:6, borderRadius:"50%", background:"#818cf8" }} />}
                    </div>
                    <div>
                      <p style={{ fontSize:13.5, fontWeight:700, color:"#f1f5f9", margin:"0 0 1px" }}>{p.label}</p>
                      {p.savings && <p style={{ fontSize:11, color:"#34d399", margin:0, fontWeight:600 }}>{p.savings}</p>}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontSize:20, fontWeight:800, color: selectedPlan===p.id ? "#f1f5f9" : "#94a3b8", fontFamily:"var(--font-display)", margin:"0 0 1px", letterSpacing:"-0.02em" }}>{p.price}</p>
                    <p style={{ fontSize:11, color:"#334155", margin:0 }}>{p.sub}</p>
                  </div>
                </div>
                {p.badge && (
                  <div style={{ position:"absolute", top:-1, right:12, fontSize:9, background: p.badge==="BEST" ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "rgba(52,211,153,0.2)", border: p.badge==="BEST" ? "none" : "1px solid rgba(52,211,153,0.3)", color:"#fff", padding:"2px 8px", borderRadius:"0 0 6px 6px", fontWeight:800, letterSpacing:"0.04em" }}>{p.badge}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ padding:"18px 24px" }}>
          <div style={{ marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#334155", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Free Plan</p>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {FREE_FEATURES.map((f,i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ width:14, height:14, borderRadius:4, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:9, color:"#334155" }}>✓</span>
                  <span style={{ fontSize:12.5, color:"#475569" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:"linear-gradient(135deg,rgba(99,102,241,0.07),rgba(56,189,248,0.04))", border:"1px solid rgba(99,102,241,0.18)", borderRadius:14, padding:"14px 16px" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#818cf8", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>⚡ Premium</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {PREMIUM_FEATURES.map((f,i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ width:16, height:16, borderRadius:5, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.28)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:9, color:"#34d399" }}>✓</span>
                  <span style={{ fontSize:12.5, color: f.hot ? "#f1f5f9" : "#94a3b8", fontWeight: f.hot ? 600 : 400, flex:1 }}>{f.text}</span>
                  {f.hot && <span style={{ fontSize:9, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.22)", color:"#fca5a5", padding:"1px 6px", borderRadius:99, fontWeight:800, flexShrink:0 }}>HOT</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ padding:"0 24px 26px", display:"flex", flexDirection:"column", gap:8 }}>
          {error && (
            <div style={{ display:"flex", gap:8, padding:"9px 12px", background:"rgba(36,10,10,0.7)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:9, fontSize:12.5, color:"#fca5a5" }}>
              <span style={{ flexShrink:0 }}>⚠</span>{error}
            </div>
          )}

          <button className="pay-btn" onClick={handlePaystack} disabled={loading}
            style={{ width:"100%", padding:"14px 0", background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)", border:"1px solid rgba(129,140,248,0.4)", borderRadius:12, color:"#fff", fontSize:15, fontWeight:800, cursor:loading?"not-allowed":"pointer", fontFamily:"var(--font-body)", letterSpacing:"-0.01em", boxShadow: loading ? "none" : "0 4px 24px rgba(99,102,241,0.35)", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading ? (
              <><span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"up-spin 0.65s linear infinite", display:"inline-block" }} /> Processing…</>
            ) : (
              <>Pay with Paystack →</>
            )}
          </button>

          <button className="wa-btn" onClick={handleWhatsApp}
            style={{ width:"100%", padding:"11px 0", borderRadius:11, border:"1px solid rgba(52,211,153,0.22)", background:"rgba(52,211,153,0.05)", color:"#34d399", fontSize:13, fontFamily:"var(--font-body)", cursor:"pointer", fontWeight:600, transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
            <span>💬</span> Pay via WhatsApp instead
          </button>

          <p style={{ textAlign:"center", fontSize:11, color:"#1e293b", marginTop:2 }}>
            Secured by Paystack · SSL encrypted · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
