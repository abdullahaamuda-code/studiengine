"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

function StudiengineLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 10, display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id="lb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d0f1a" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="ls" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="18" fill="url(#lb)" />
      <rect x="30" y="12" width="34" height="7" rx="3.5" fill="#1e2440" opacity="0.9" />
      <rect x="14" y="23" width="50" height="7" rx="3.5" fill="#1e2440" opacity="0.75" />
      <rect x="14" y="34" width="52" height="7" rx="3.5" fill="#1e2440" opacity="0.6" />
      <rect x="14" y="45" width="50" height="7" rx="3.5" fill="#1e2440" opacity="0.45" />
      <rect x="14" y="56" width="34" height="7" rx="3.5" fill="#1e2440" opacity="0.3" />
      <path d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60" fill="none" stroke="url(#ls)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function FadeIn({ children, delay = 0, className = "", style = {} }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}s, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}s` }}>
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: "✦", label: "Notes → CBT", title: "From Notes to Quiz Instantly", desc: "Paste lecture notes or upload a PDF. Get targeted MCQ questions built from your exact material.", color: "#818cf8", glow: "rgba(129,140,248,0.15)" },
  { icon: "◈", label: "PQ Analyzer", title: "Topic Intelligence", desc: "Upload past questions and unlock which topics appear most — know where to focus before you open a book.", color: "#38bdf8", glow: "rgba(56,189,248,0.15)" },
  { icon: "⚡", label: "PQ → CBT", title: "Interactive Past Questions", desc: "Turn any past question paper into a live CBT session with instant answers and full AI explanations.", color: "#a78bfa", glow: "rgba(167,139,250,0.15)" },
  { icon: "◎", label: "AI Explain", title: "Step-by-Step Breakdown", desc: "Stuck? Ask the AI on any question. Get plain-language explanations that make the concept stick.", color: "#34d399", glow: "rgba(52,211,153,0.15)" },
  { icon: "⊞", label: "Calculator", title: "Built-in Calculator", desc: "For math and science questions — no tab switching, no losing your place.", color: "#fb923c", glow: "rgba(251,146,60,0.15)" },
  { icon: "◉", label: "History", title: "Full Session History", desc: "Premium users revisit every past CBT, scores, and mistakes for complete exam-ready review.", color: "#f472b6", glow: "rgba(244,114,182,0.15)" },
];

const SAMPLE_QS = [
  { q: "Which of the following best describes osmosis?", opts: [{ l: "A", t: "Movement of water through a semi-permeable membrane from low to high solute concentration", correct: true }, { l: "B", t: "Movement of solutes from low to high concentration", correct: false }, { l: "C", t: "Active transport of ions across cell membranes", correct: false }, { l: "D", t: "Diffusion of gases through a permeable membrane", correct: false }], exp: "Osmosis is the passive movement of water molecules through a semi-permeable membrane toward the region of higher solute concentration." },
  { q: "If log₂(x) = 5, what is the value of x?", opts: [{ l: "A", t: "10", correct: false }, { l: "B", t: "25", correct: false }, { l: "C", t: "32", correct: true }, { l: "D", t: "64", correct: false }], exp: "log₂(x) = 5 means 2⁵ = x. Therefore x = 32." },
  { q: "What is the capital of Nigeria?", opts: [{ l: "A", t: "Lagos", correct: false }, { l: "B", t: "Abuja", correct: true }, { l: "C", t: "Kano", correct: false }, { l: "D", t: "Ibadan", correct: false }], exp: "Abuja became Nigeria's capital in 1991, replacing Lagos. It is centrally located and purpose-built as a federal capital." },
];

const EXAMS = ["JAMB", "WAEC", "NECO", "GCE", "POST-UTME", "University", "Lectures"];

const STEPS = [
  { n: "01", title: "Upload your material", desc: "Paste lecture notes, upload a PDF, or drop in past questions. Any format works." },
  { n: "02", title: "AI builds your CBT", desc: "Our AI reads your content and generates real multiple-choice questions with A B C D options and explanations." },
  { n: "03", title: "Practice & understand", desc: "Take the quiz, see your score, review every answer, and ask the AI to explain what you got wrong." },
];

const STATS = [
  { value: "90+", label: "Students studying smarter" },
  { value: "30+", label: "Questions per session" },
  { value: "7.5s", label: "Average generation time" },
  { value: "100%", label: "From your own material" },
];

export default function LandingPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [activeQ, setActiveQ] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const target = 1240;
    const step = Math.ceil(target / 60);
    const t = setInterval(() => { setCount(c => { if (c >= target) { clearInterval(t); return target; } return c + step; }); }, 20);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => { setAnswered(null); setActiveQ(q => (q + 1) % SAMPLE_QS.length); }, 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const q = SAMPLE_QS[activeQ];

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", fontFamily: "var(--font-body)", color: "#f1f5f9", overflowX: "hidden" }}>
      <style>{`
        @keyframes float-slow { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-18px) scale(1.04);} }
        @keyframes float-med  { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-12px) rotate(2deg);} }
        @keyframes spin-slow  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(99,102,241,0.5)} 100%{box-shadow:0 0 0 14px rgba(99,102,241,0)} }
        @keyframes shimmer-x  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes line-grow  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes badge-in   { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
        @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0} }

        .hero-title-shimmer {
          background: linear-gradient(135deg, #f1f5f9 0%, #818cf8 30%, #38bdf8 60%, #f1f5f9 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-x 6s linear infinite;
        }

        .btn-cta {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #4338ca 100%);
          border: 1px solid rgba(129,140,248,0.4);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .btn-cta::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.18),transparent); opacity:0; transition:opacity 0.2s; }
        .btn-cta:hover::before { opacity:1; }
        .btn-cta:hover { transform:translateY(-2px); box-shadow:0 0 0 1px rgba(129,140,248,0.5), 0 8px 30px rgba(99,102,241,0.45); }
        .btn-cta:active { transform:translateY(0) scale(0.99); }

        .btn-ghost-hero {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost-hero:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); color:#e2e8f0; }

        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 28px 24px;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .feature-card::before { content:''; position:absolute; inset:0; opacity:0; transition:opacity 0.3s; }
        .feature-card:hover { transform:translateY(-4px); border-color:rgba(255,255,255,0.14); }

        .step-num {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: rgba(129,140,248,0.5);
          margin-bottom: 10px;
        }

        .option-btn {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #94a3b8;
          font-size: 12.5px;
          line-height: 1.5;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-family: inherit;
          margin-bottom: 6px;
        }
        .option-btn:hover { background:rgba(99,102,241,0.08); border-color:rgba(99,102,241,0.25); color:#e2e8f0; }
        .option-correct { background:rgba(4,47,29,0.6) !important; border-color:rgba(52,211,153,0.5) !important; color:#6ee7b7 !important; }
        .option-wrong   { background:rgba(36,10,10,0.6) !important; border-color:rgba(248,113,113,0.5) !important; color:#fca5a5 !important; }

        .exam-pill {
          font-size: 11.5px;
          padding: 5px 14px;
          border-radius: 99px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #64748b;
          transition: all 0.2s;
          cursor: default;
        }
        .exam-pill:hover { background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); color:#a5b4fc; }

        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 22px 20px;
          text-align: center;
          transition: all 0.25s;
        }
        .stat-card:hover { background:rgba(99,102,241,0.06); border-color:rgba(99,102,241,0.2); }

        .nav-border::after {
          content:"";
          position:absolute;
          left:0; right:0; bottom:-1px;
          height:1px;
          background:linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(56,189,248,0.3), transparent);
        }

        .section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 12px;
        }

        .divider-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin: 0;
        }

        .hero-mock {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          backdrop-filter: blur(24px);
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
        }

        .mock-header {
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .glow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 6px rgba(52,211,153,0.8);
          animation: blink 2s ease-in-out infinite;
        }

        @media (max-width: 640px) {
          .hero-grid { flex-direction: column !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ── Background ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-5%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "45%", left: "35%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 65%)", filter: "blur(80px)" }} />
        {/* Grid pattern */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.5 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Navbar ── */}
     <nav className="nav-border" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: navScrolled ? "rgba(8,12,20,0.92)" : "transparent", backdropFilter: navScrolled ? "blur(24px)" : "none", borderBottom: "1px solid rgba(255,255,255,0.06)", transition: "all 0.3s ease" }}>
  <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <StudiengineLogo size={30} />
      <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", background: "linear-gradient(135deg,#f1f5f9,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Studiengine</span>
    </div>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={() => router.push("/app?mode=signin")} className="btn-ghost-hero" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13 }}>Sign In</button>
      <button onClick={() => router.push("/app?mode=signup")} className="btn-cta" style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13 }}>Get Started →</button>
    </div>
  </div>
</nav>

        {/* ── Hero ── */}
        <section style={{ paddingTop: 130, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, maxWidth: 1100, margin: "0 auto" }}>
          {/* Badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28, animation: "badge-in 0.6s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 99, padding: "5px 16px 5px 10px", fontSize: 12, color: "#a5b4fc" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 8px rgba(129,140,248,0.8)", display: "inline-block" }} />
              Built for African students · JAMB, WAEC & beyond
            </div>
          </div>

          {/* Headline */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1.1, letterSpacing: "-0.03em", margin: 0 }} className="hero-title-shimmer">
              Your notes.<br />Your past questions.<br />Real CBT practice.
            </h1>
          </div>

          <p style={{ textAlign: "center", fontSize: "clamp(14px, 2vw, 17px)", color: "#64748b", lineHeight: 1.75, maxWidth: 520, margin: "0 auto 36px" }}>
            Upload your study material and get instant multiple-choice questions with explanations. Plus topic analytics so you know exactly where to focus.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <button onClick={() => router.push("/app?mode=signup")} className="btn-cta" style={{ padding: "14px 32px", borderRadius: 12, fontSize: 15, letterSpacing: "-0.01em" }}>Start for Free →</button>
            <button onClick={() => router.push("/?guest=1")} className="btn-ghost-hero" style={{ padding: "14px 26px", borderRadius: 12, fontSize: 14 }}>Try as guest</button>
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: "#334155" }}>Free forever · No credit card · Works on any device</p>

          {/* Stats row */}
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px 0", justifyContent: "center", marginTop: 52, maxWidth: 600, margin: "52px auto 0" }}>
  {STATS.map((s, i) => (
    <div key={i} style={{ textAlign: "center", borderRight: (i === 0 || i === 2) ? "1px solid rgba(255,255,255,0.07)" : "none", paddingRight: (i === 0 || i === 2) ? "20px" : "0", paddingLeft: (i === 1 || i === 3) ? "20px" : "0" }}>
      <p style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, fontFamily: "var(--font-display)", color: "#f1f5f9", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
        {s.value}
      </p>
      <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>{s.label}</p>
    </div>
  ))}
</div>
        </section>

        {/* ── Hero Mock + Interactive Demo ── */}
        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 100px" }}>
          <div className="hero-grid" style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>

            {/* App Mock */}
            <FadeIn delay={0.1} style={{ flex: "1 1 320px", minWidth: 280 }}>
              <div className="hero-mock">
                <div className="mock-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                    </div>
                    <span style={{ fontSize: 11, color: "#475569" }}>studiengine.com.ng</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="glow-dot" />
                    <span style={{ fontSize: 11, color: "#34d399" }}>Live session</span>
                  </div>
                </div>
                <div style={{ padding: 18 }}>
                  {/* Upload zone */}
                  <div style={{ border: "1px dashed rgba(99,102,241,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, background: "rgba(99,102,241,0.04)" }}>
                    <p style={{ fontSize: 10, color: "#6366f1", marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Material uploaded</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📄</div>
                      <div>
                        <p style={{ fontSize: 11, color: "#e2e8f0", margin: 0, fontWeight: 500 }}>Cell Biology Lecture Note</p>
                        <p style={{ fontSize: 10, color: "#475569", margin: 0 }}>3 pages · 30 questions generated</p>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: "#64748b" }}>Progress</span>
                      <span style={{ fontSize: 10, color: "#818cf8", fontWeight: 600 }}>22 / 30</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                      <div style={{ height: "100%", width: "80%", borderRadius: 99, background: "linear-gradient(90deg,#6366f1,#38bdf8)", boxShadow: "0 0 8px rgba(99,102,241,0.5)" }} />
                    </div>
                  </div>
                  {/* Question */}
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 11, color: "#475569", marginBottom: 6, fontWeight: 500 }}>Q17 of 30</p>
                    <p style={{ fontSize: 12.5, color: "#e2e8f0", marginBottom: 10, lineHeight: 1.55 }}>Which of the following best describes osmosis?</p>
                    {[
                      { l: "A", t: "Movement of water through a semi-permeable membrane", correct: true },
                      { l: "B", t: "Movement of solutes from low to high concentration", correct: false },
                      { l: "C", t: "Active transport of ions across membranes", correct: false },
                      { l: "D", t: "Diffusion of gases through a permeable layer", correct: false },
                    ].map((o, i) => (
                      <div key={i} style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 5, border: "1px solid", fontSize: 11, display: "flex", alignItems: "center", gap: 8, borderColor: o.correct ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.06)", background: o.correct ? "rgba(4,47,29,0.55)" : "rgba(255,255,255,0.02)", color: o.correct ? "#6ee7b7" : "#475569" }}>
                        <span style={{ width: 16, height: 16, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, background: o.correct ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.05)", color: o.correct ? "#6ee7b7" : "#334155", flexShrink: 0 }}>{o.correct ? "✓" : o.l}</span>
                        {o.t}
                      </div>
                    ))}
                  </div>
                  {/* Explanation */}
                  <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", fontSize: 11, color: "#a5b4fc", lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 700 }}>AI: </span>Osmosis is passive movement of water toward higher solute concentration through a semi-permeable membrane.
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Interactive Demo */}
            <FadeIn delay={0.2} style={{ flex: "1 1 300px", minWidth: 280 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "20px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: "#475569", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>Try it — click an option</p>
                  <div style={{ display: "flex", gap: 5 }}>
                    {SAMPLE_QS.map((_, i) => (
                      <div key={i} onClick={() => { setActiveQ(i); setAnswered(null); }} style={{ width: i === activeQ ? 18 : 5, height: 5, borderRadius: 99, background: i === activeQ ? "#6366f1" : "rgba(255,255,255,0.12)", cursor: "pointer", transition: "all 0.3s" }} />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#e2e8f0", marginBottom: 14, lineHeight: 1.65, minHeight: 52, fontWeight: 500 }}>{q.q}</p>
                {q.opts.map((o, i) => {
                  const isAnswered = answered !== null;
                  const isThis = answered === i;
                  const cls = isAnswered ? (o.correct ? "option-correct" : isThis ? "option-wrong" : "") : "";
                  return (
                    <button key={i} onClick={() => setAnswered(i)} className={`option-btn ${cls}`} disabled={isAnswered}>
                      <span style={{ width: 19, height: 19, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, background: isAnswered && o.correct ? "rgba(52,211,153,0.25)" : isThis && !o.correct ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)", color: isAnswered && o.correct ? "#6ee7b7" : isThis ? "#fca5a5" : "#475569" }}>
                        {isAnswered && o.correct ? "✓" : isThis && !o.correct ? "✗" : o.l}
                      </span>
                      {o.t}
                    </button>
                  );
                })}
                {answered !== null && (
                  <div style={{ marginTop: 10, padding: "11px 13px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, fontSize: 12, color: "#a5b4fc", lineHeight: 1.65, animation: "fadeIn 0.3s ease" }}>
                    <span style={{ fontWeight: 700, color: "#818cf8" }}>Explanation: </span>{q.exp}
                  </div>
                )}
                <p style={{ fontSize: 11, color: "#1e293b", textAlign: "right", marginTop: 12, margin: "12px 0 0" }}>Auto-advances · {SAMPLE_QS.length} sample questions</p>
              </div>
            </FadeIn>
          </div>
        </section>

        <div className="divider-line" />

        {/* ── How it works ── */}
        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "90px 24px" }}>
          <FadeIn>
            <div className="section-label" style={{ textAlign: "center" }}>How it works</div>
            <h2 style={{ textAlign: "center", fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.025em", margin: "0 0 60px", color: "#f1f5f9" }}>
              Three steps to smarter studying
            </h2>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 3, position: "relative" }}>
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <div style={{ padding: "32px 28px", borderRadius: 0, borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none", position: "relative" }}>
                  <div className="step-num">{s.n}</div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 16, color: "#818cf8" }}>
                    {["↑", "✦", "◉"][i]}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px", fontFamily: "var(--font-display)" }}>{s.title}</h3>
                  <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                  {i < STEPS.length - 1 && (
                    <div style={{ position: "absolute", top: "50%", right: -20, transform: "translateY(-50%)", fontSize: 18, color: "rgba(99,102,241,0.3)", pointerEvents: "none", display: "none" }}>→</div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <div className="divider-line" />

        {/* ── Features bento grid ── */}
        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "90px 24px" }}>
          <FadeIn>
            <div className="section-label" style={{ textAlign: "center" }}>Features</div>
            <h2 style={{ textAlign: "center", fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.025em", margin: "0 0 14px", color: "#f1f5f9" }}>
              Everything you need to pass
            </h2>
            <p style={{ textAlign: "center", fontSize: 14, color: "#475569", marginBottom: 48 }}>Built for how African students actually study</p>
          </FadeIn>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div className="feature-card" style={{ "--glow": f.glow } as React.CSSProperties}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${f.glow}`, border: `1px solid ${f.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: f.color, fontWeight: 700 }}>{f.icon}</div>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: f.color, opacity: 0.7 }}>{f.label}</span>
                  </div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px", fontFamily: "var(--font-display)" }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <div className="divider-line" />

        {/* ── Exams ── */}
        <section style={{ textAlign: "center", padding: "70px 24px" }}>
          <FadeIn>
            <div className="section-label">Compatible with</div>
            <p style={{ fontSize: 14, color: "#334155", marginBottom: 20 }}>Works for all Nigerian exams and university lectures</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", maxWidth: 500, margin: "0 auto" }}>
              {EXAMS.map(e => <span key={e} className="exam-pill">{e}</span>)}
            </div>
          </FadeIn>
        </section>

        <div className="divider-line" />

        {/* ── Final CTA ── */}
        <section style={{ textAlign: "center", padding: "90px 24px 100px" }}>
          <FadeIn>
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 22 }}>🎓</div>
              <h2 style={{ fontSize: "clamp(26px,5vw,44px)", fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.025em", margin: "0 0 14px" }} className="hero-title-shimmer">
                Ready to study smarter?
              </h2>
              <p style={{ fontSize: 15, color: "#475569", marginBottom: 32, lineHeight: 1.7 }}>
                Free to start. No credit card. Join 90+ students already using Studiengine.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => router.push("/app?mode=signup")} className="btn-cta" style={{ padding: "15px 36px", borderRadius: 12, fontSize: 15, letterSpacing: "-0.01em" }}>Create Free Account →</button>
                <button onClick={() => router.push("/?guest=1")} className="btn-ghost-hero" style={{ padding: "15px 26px", borderRadius: 12, fontSize: 14 }}>Try as guest</button>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1100, margin: "0 auto", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StudiengineLogo size={22} />
            <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 600, fontFamily: "var(--font-display)" }}>Studiengine</span>
          </div>
          <p style={{ fontSize: 12, color: "#1e293b", margin: 0 }}>© 2026 Studiengine · Built for African students 🇳🇬</p>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <span key={l} style={{ fontSize: 12, color: "#1e293b", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")} onMouseLeave={e => (e.currentTarget.style.color = "#1e293b")}>{l}</span>
            ))}
          </div>
        </footer>

      </div>
    </div>
  );
}
