"use client";
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
  { text: "Unlimited CBT generations every day",          hot: true  },
  { text: "Up to 30 questions per session",               hot: false },
  { text: "Full review of ALL answered questions",        hot: true  },
  { text: "AI step-by-step explanations for every Q",    hot: true  },
  { text: "CBT history, stats & score tracking",         hot: false },
  { text: "Upload long PDFs (up to 30 pages)",           hot: false },
  { text: "Scanned PDF support (beta)",                  hot: false },
];

export default function UpgradeModal({ onClose, reason }: Props) {
  const { user } = useAuth();

  function handlePayment() {
    const email = user?.email || "no-email-provided";
    const msg   = `Hi, I want to upgrade my Studiengine account (${email}) to Premium. Please help me activate it.`;
    const url   = `https://wa.me/2348169936326?text=${encodeURIComponent(msg)}`;
    alert("Payment coming soon! We're setting up Paystack.\n\nFor now, we'll open WhatsApp so you can message us to manually activate Premium.");
    if (typeof window !== "undefined") window.open(url, "_blank");
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(4,6,12,0.88)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{`
        @keyframes up-in { from{opacity:0;transform:scale(0.96) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .plan-card { transition: all 0.2s; }
        .plan-card:hover { transform: translateY(-2px); }
        .up-cta:hover { box-shadow: 0 8px 32px rgba(99,102,241,0.5) !important; }
        .wa-btn:hover { background: rgba(52,211,153,0.12) !important; }
      `}</style>

      <div style={{ background:"rgba(10,13,22,0.97)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:22, width:"100%", maxWidth:430, maxHeight:"92vh", overflowY:"auto", position:"relative", boxShadow:"0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.04)", animation:"up-in 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
        {/* Top glow */}
        <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.5),transparent)" }} />

        {/* Close */}
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"#475569", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1, transition:"all 0.15s" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.1)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)";}}>×</button>

        {/* Header */}
        <div style={{ padding:"28px 24px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,rgba(251,191,36,0.15),rgba(245,158,11,0.08))", border:"1px solid rgba(251,191,36,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:14, boxShadow:"0 0 20px rgba(251,191,36,0.15)" }}>⚡</div>
          <h2 style={{ fontSize:22, fontWeight:800, fontFamily:"var(--font-display)", color:"#f1f5f9", margin:"0 0 8px", letterSpacing:"-0.02em" }}>Upgrade to Premium</h2>
          {reason ? (
            <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"9px 12px", background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:10, fontSize:13, color:"#fbbf24" }}>
              <span style={{ flexShrink:0 }}>⚠</span>{reason}
            </div>
          ) : (
            <p style={{ fontSize:13.5, color:"#475569", margin:0, lineHeight:1.6 }}>Unlock the full Studiengine experience — no limits.</p>
          )}
        </div>

        {/* Pricing cards */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#334155", marginBottom:12 }}>Choose a plan</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {/* Monthly */}
            <button className="plan-card" onClick={handlePayment} style={{ padding:"16px 12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, cursor:"pointer", textAlign:"center", fontFamily:"var(--font-body)" }}>
              <p style={{ fontSize:11, color:"#475569", margin:"0 0 6px", fontWeight:600 }}>Monthly</p>
              <p style={{ fontSize:26, fontWeight:800, color:"#f1f5f9", margin:"0 0 2px", fontFamily:"var(--font-display)", letterSpacing:"-0.02em" }}>₦200</p>
              <p style={{ fontSize:11, color:"#334155", margin:0 }}>per month</p>
            </button>
            {/* Yearly — highlighted */}
            <button className="plan-card" onClick={handlePayment} style={{ padding:"16px 12px", background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(56,189,248,0.08))", border:"1px solid rgba(99,102,241,0.35)", borderRadius:14, cursor:"pointer", textAlign:"center", fontFamily:"var(--font-body)", position:"relative", overflow:"hidden", boxShadow:"0 0 24px rgba(99,102,241,0.1)" }}>
              <div style={{ position:"absolute", top:8, right:8, fontSize:9, background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"#fff", padding:"2px 7px", borderRadius:99, fontWeight:800, letterSpacing:"0.04em" }}>BEST</div>
              <p style={{ fontSize:11, color:"#818cf8", margin:"0 0 6px", fontWeight:600 }}>Yearly</p>
              <p style={{ fontSize:26, fontWeight:800, color:"#f1f5f9", margin:"0 0 2px", fontFamily:"var(--font-display)", letterSpacing:"-0.02em" }}>₦2,000</p>
              <p style={{ fontSize:11, color:"#34d399", margin:0, fontWeight:600 }}>save ₦400</p>
            </button>
          </div>
        </div>

        {/* Feature comparison */}
        <div style={{ padding:"20px 24px" }}>
          {/* Free */}
          <div style={{ marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.08em" }}>Free Plan</p>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {FREE_FEATURES.map((f,i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ width:14, height:14, borderRadius:4, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:9, color:"#475569" }}>✓</span>
                  <span style={{ fontSize:12.5, color:"#475569" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium */}
          <div style={{ background:"linear-gradient(135deg,rgba(99,102,241,0.07),rgba(56,189,248,0.04))", border:"1px solid rgba(99,102,241,0.18)", borderRadius:14, padding:"14px 16px" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#818cf8", marginBottom:12, textTransform:"uppercase", letterSpacing:"0.08em" }}>⚡ Premium</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {PREMIUM_FEATURES.map((f,i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ width:16, height:16, borderRadius:5, background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:9, color:"#34d399" }}>✓</span>
                  <span style={{ fontSize:12.5, color: f.hot ? "#f1f5f9" : "#94a3b8", fontWeight: f.hot ? 600 : 400, flex:1 }}>{f.text}</span>
                  {f.hot && <span style={{ fontSize:9, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#fca5a5", padding:"1px 6px", borderRadius:99, fontWeight:800, flexShrink:0 }}>HOT</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ padding:"0 24px 26px", display:"flex", flexDirection:"column", gap:8 }}>
          <button className="up-cta" onClick={handlePayment} style={{ width:"100%", padding:"14px 0", background:"linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)", border:"1px solid rgba(129,140,248,0.4)", borderRadius:12, color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"var(--font-body)", letterSpacing:"-0.01em", boxShadow:"0 4px 24px rgba(99,102,241,0.35)", transition:"all 0.2s" }}>
            Get Premium →
          </button>
          <button className="wa-btn" onClick={handlePayment} style={{ width:"100%", padding:"11px 0", borderRadius:11, border:"1px solid rgba(52,211,153,0.25)", background:"rgba(52,211,153,0.06)", color:"#34d399", fontSize:13, fontFamily:"var(--font-body)", cursor:"pointer", fontWeight:600, transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span>💬</span> Chat on WhatsApp to upgrade
          </button>
          <p style={{ textAlign:"center", fontSize:11, color:"#1e293b", marginTop:2 }}>Paystack integration coming soon</p>
        </div>
      </div>
    </div>
  );
}
