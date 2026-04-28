"use client";
import { useEffect } from "react";

const STORAGE_KEY = "studiengine_onboarded_v2";

const FEATURES = [
  { icon: "✦", color: "#818cf8", title: "Notes → CBT",   desc: "Paste notes or upload a PDF — get instant practice questions from your exact material." },
  { icon: "◈", color: "#38bdf8", title: "PQ Analyzer",   desc: "Spot hot topics, repeated patterns, and what's likely to appear on your next exam." },
  { icon: "⚡", color: "#a78bfa", title: "PQ → CBT",     desc: "Turn any past question paper into a full interactive CBT session with AI explanations." },
  { icon: "⊞", color: "#34d399", title: "Calculator",    desc: "Built-in calculator for math and science — no tab switching during a session." },
];

const EXAMS = ["JAMB", "WAEC", "NECO", "GCE", "POST-UTME", "University"];

function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
      <svg width="28" height="28" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius:9, display:"block", flexShrink:0 }}>
        <defs>
          <linearGradient id="ob2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d0f1a"/><stop offset="100%" stopColor="#111827"/>
          </linearGradient>
          <linearGradient id="os2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8"/><stop offset="100%" stopColor="#38bdf8"/>
          </linearGradient>
        </defs>
        <rect width="80" height="80" rx="18" fill="url(#ob2)"/>
        <rect x="30" y="12" width="34" height="7" rx="3.5" fill="#1e2440" opacity="0.9"/>
        <rect x="14" y="23" width="50" height="7" rx="3.5" fill="#1e2440" opacity="0.75"/>
        <rect x="14" y="34" width="52" height="7" rx="3.5" fill="#1e2440" opacity="0.6"/>
        <rect x="14" y="45" width="50" height="7" rx="3.5" fill="#1e2440" opacity="0.45"/>
        <rect x="14" y="56" width="34" height="7" rx="3.5" fill="#1e2440" opacity="0.3"/>
        <path d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60" fill="none" stroke="url(#os2)" strokeWidth="6" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize:17, fontWeight:800, fontFamily:"var(--font-display)", letterSpacing:"-0.02em", background:"linear-gradient(135deg,#f1f5f9,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
        Studiengine
      </span>
    </div>
  );
}

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  // When we ever open this modal, if the user was never onboarded, mark as onboarded
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, "1");
      }
    }
  }, [open]);

  function dismiss() {
    // make sure it's persisted
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    onClose();
  }

  if (!open) return null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(4,6,12,0.88)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <style>{`@keyframes ob-in{from{opacity:0;transform:scale(0.96) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

      <div style={{ background:"rgba(10,13,22,0.97)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:22, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", position:"relative", display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)", animation:"ob-in 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
        {/* Top glow */}
        <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.45),transparent)" }} />

        {/* Sticky header */}
        <div style={{ position:"sticky", top:0, zIndex:10, background:"rgba(10,13,22,0.97)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderRadius:"22px 22px 0 0" }}>
          <Logo />
          <button
            onClick={dismiss}
            style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"#475569", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.1)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)";}}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:"24px 22px 28px" }}>
          {/* Hero text */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:99, padding:"4px 12px 4px 8px", marginBottom:14, fontSize:11.5, color:"#a5b4fc" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#818cf8", boxShadow:"0 0 6px rgba(129,140,248,0.8)", display:"inline-block" }} />
              Built for African students
            </div>
            <h2 style={{ fontSize:22, fontWeight:800, fontFamily:"var(--font-display)", color:"#f1f5f9", margin:"0 0 8px", letterSpacing:"-0.02em", lineHeight:1.25 }}>
              Your AI exam prep<br />companion
            </h2>
            <p style={{ fontSize:13.5, color:"#475569", margin:0, lineHeight:1.7 }}>
              Upload your notes or past questions — AI turns them into real CBT practice, topic analytics, and step-by-step explanations.
            </p>
          </div>

          {/* Feature grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:8, marginBottom:22 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ display:"flex", gap:11, alignItems:"flex-start", padding:"13px 14px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:13, transition:"border-color 0.2s" }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`${f.color}18`, border:`1px solid ${f.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:f.color, flexShrink:0, fontWeight:700 }}>{f.icon}</div>
                <div>
                  <p style={{ fontSize:12.5, fontWeight:700, color:"#f1f5f9", margin:"0 0 3px", fontFamily:"var(--font-display)" }}>{f.title}</p>
                  <p style={{ fontSize:11.5, color:"#475569", margin:0, lineHeight:1.55 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Exam tags */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:22 }}>
            {EXAMS.map(e => (
              <span key={e} style={{ fontSize:11, color:"#334155", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", padding:"3px 12px", borderRadius:99 }}>{e}</span>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)", marginBottom:20 }} />

          {/* CTA */}
          <button onClick={dismiss} className="btn-primary" style={{ width:"100%", padding:"14px 0", borderRadius:12, fontSize:15, fontWeight:800, letterSpacing:"-0.01em" }}>
            Get Started →
          </button>
          <p style={{ fontSize:11.5, color:"#1e293b", marginTop:10, textAlign:"center" }}>Free to use · No credit card needed</p>
        </div>
      </div>
    </div>
  );
}
