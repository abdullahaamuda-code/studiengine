"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

function StudiengineLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 8, display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id="lb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0a1628"/><stop offset="100%" stopColor="#0c1a2e"/></linearGradient>
        <linearGradient id="ls" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#22d3ee"/></linearGradient>
      </defs>
      <rect width="80" height="80" rx="16" fill="url(#lb)"/>
      <rect x="30" y="12" width="34" height="8" rx="4" fill="#1e3a5f" opacity="0.8"/>
      <rect x="14" y="24" width="50" height="8" rx="4" fill="#1e3a5f" opacity="0.7"/>
      <rect x="14" y="36" width="52" height="8" rx="4" fill="#1e3a5f" opacity="0.6"/>
      <rect x="14" y="48" width="50" height="8" rx="4" fill="#1e3a5f" opacity="0.5"/>
      <rect x="14" y="60" width="34" height="8" rx="4" fill="#1e3a5f" opacity="0.4"/>
      <path d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60" fill="none" stroke="url(#ls)" strokeWidth="6.5" strokeLinecap="round"/>
    </svg>
  );
}

function Bubble({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) {
  return (
    <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.15), rgba(8,145,178,0.05))", border: "1px solid rgba(59,130,246,0.1)", animation: `float ${duration}s ease-in-out ${delay}s infinite`, pointerEvents: "none" }} />
  );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: "📝", title: "Notes → CBT", desc: "Paste lecture notes or upload a PDF. Get instant MCQ practice questions from your own material." },
  { icon: "🔍", title: "PQ Analyzer", desc: "Upload past questions. Discover hot topics, repeated patterns, and what's likely to appear." },
  { icon: "⚡", title: "PQ → CBT", desc: "Turn any past question paper into an interactive CBT with answers and full explanations." },
  { icon: "🤖", title: "AI Explanations", desc: "Stuck on a question? Ask the AI — get a step-by-step breakdown in plain language." },
  { icon: "🧮", title: "Calculator", desc: "Built-in calculator for math and science questions. No tab switching." },
  { icon: "📊", title: "Track History", desc: "Premium users see all past CBT sessions, scores, and can review every question again." },
];

const STEPS = [
  { n: "1", title: "Paste or upload", desc: "Your lecture notes, past questions, or any study material" },
  { n: "2", title: "AI generates CBT", desc: "Instant multiple-choice questions with A B C D options" },
  { n: "3", title: "Practice & review", desc: "See your score, review mistakes, understand every answer" },
];

const SAMPLE_QS = [
  {
    q: "Which of the following best describes osmosis?",
    opts: [
      { l: "A", t: "Movement of water through a semi-permeable membrane from low to high solute concentration", correct: true },
      { l: "B", t: "Movement of solutes from low to high concentration", correct: false },
      { l: "C", t: "Active transport of ions across cell membranes", correct: false },
      { l: "D", t: "Diffusion of gases through a permeable membrane", correct: false },
    ],
    exp: "Osmosis is the passive movement of water molecules through a semi-permeable membrane toward the region of higher solute concentration.",
  },
  {
    q: "If log₂(x) = 5, what is the value of x?",
    opts: [
      { l: "A", t: "10", correct: false },
      { l: "B", t: "25", correct: false },
      { l: "C", t: "32", correct: true },
      { l: "D", t: "64", correct: false },
    ],
    exp: "log₂(x) = 5 means 2⁵ = x. Therefore x = 32.",
  },
  {
    q: "What is the capital of Nigeria?",
    opts: [
      { l: "A", t: "Lagos", correct: false },
      { l: "B", t: "Abuja", correct: true },
      { l: "C", t: "Kano", correct: false },
      { l: "D", t: "Ibadan", correct: false },
    ],
    exp: "Abuja became Nigeria's capital in 1991, replacing Lagos. It is centrally located and purpose-built as a federal capital.",
  },
];

const EXAMS = ["JAMB", "WAEC", "NECO", "GCE", "POST-UTME", "University", "Lectures"];
const BUBBLES = [
  { x: 5, y: 15, size: 60, delay: 0, duration: 7 },
  { x: 88, y: 10, size: 40, delay: 1, duration: 9 },
  { x: 75, y: 60, size: 80, delay: 2, duration: 11 },
  { x: 10, y: 70, size: 50, delay: 0.5, duration: 8 },
  { x: 50, y: 85, size: 35, delay: 3, duration: 10 },
  { x: 92, y: 40, size: 55, delay: 1.5, duration: 6 },
  { x: 20, y: 45, size: 30, delay: 2.5, duration: 9 },
];

export default function LandingPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [activeQ, setActiveQ] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);

  useEffect(() => {
    const target = 1240;
    const step = Math.ceil(target / 50);
    const t = setInterval(() => { setCount(c => { if (c >= target) { clearInterval(t); return target; } return c + step; }); }, 24);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => { setAnswered(null); setActiveQ(q => (q + 1) % SAMPLE_QS.length); }, 5000);
    return () => clearInterval(t);
  }, []);

  const q = SAMPLE_QS[activeQ];

  return (
    <div style={{ minHeight: "100vh", background: "#03080f", fontFamily: "var(--font-body)", color: "#e8f0fe", overflowX: "hidden" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)scale(1);opacity:0.6} 50%{transform:translateY(-20px)scale(1.05);opacity:1} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(37,99,235,0.3)} 50%{box-shadow:0 0 40px rgba(37,99,235,0.6),0 0 80px rgba(8,145,178,0.2)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .cta-btn { animation: pulse-glow 3s ease-in-out infinite; transition: transform 0.2s; }
        .cta-btn:hover { transform: scale(1.03); }
        .feature-card { transition: transform 0.2s, border-color 0.2s; }
        .feature-card:hover { transform: translateY(-4px); border-color: rgba(59,130,246,0.3) !important; }
        .divider { width:100%; height:1px; background:linear-gradient(90deg,transparent,rgba(59,130,246,0.2),rgba(8,145,178,0.2),transparent); }
        nav { position:relative; }
        nav::after { content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:linear-gradient(90deg,rgba(56,139,253,0),rgba(56,139,253,0.7),rgba(8,145,178,0.7),rgba(56,139,253,0)); box-shadow:0 0 12px rgba(37,99,235,0.6); pointer-events:none; }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {BUBBLES.map((b, i) => <Bubble key={i} {...b} />)}
        <div style={{ position: "absolute", top: "5%", left: "20%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(8,145,178,0.07) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Fixed Navbar */}
<nav
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: "rgba(3,8,15,0.85)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 10px 25px rgba(15,23,42,0.9)",
  }}
>
  <div
    style={{
      maxWidth: 960,
      margin: "0 auto",
      padding: "0 16px",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <StudiengineLogo size={28} />
      <span
        style={{
          fontSize: 16,
          fontWeight: 800,
          fontFamily: "var(--font-display)",
          background: "linear-gradient(135deg,#60a5fa,#22d3ee)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Studiengine
      </span>
    </div>

    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {/* Sign in goes to /app with mode=signin so Navbar/AuthModal open in sign-in mode */}
      <button
        onClick={() => router.push("/app?mode=signin")}
        style={{
          background: "none",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#94a3b8",
          padding: "7px 14px",
          borderRadius: 8,
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Sign In
      </button>

      {/* Start Free defaults to signup */}
      <button
        onClick={() => router.push("/app?mode=signup")}
        className="cta-btn"
        style={{
          background: "linear-gradient(135deg,#2563eb,#0891b2)",
          border: "none",
          color: "#fff",
          padding: "7px 16px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        Start Free →
      </button>
    </div>
  </div>
</nav>


        {/* Hero — split layout */}
        <section style={{ padding: "96px 20px 70px", maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
            {/* Left */}
            <div style={{ flex: "1 1 280px", maxWidth: 520 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(37,99,235,0.12)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20, padding: "4px 14px", marginBottom: 18, fontSize: 11, color: "#60a5fa" }}>
                🎓 Built for Nigerian students and beyond
              </div>
              <h1 style={{ fontSize: "clamp(26px,5vw,44px)", fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1.2, marginBottom: 14, background: "linear-gradient(135deg,#e8f0fe 0%,#60a5fa 50%,#22d3ee 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Turn your notes and past questions into CBT practice
              </h1>
              <p style={{ fontSize: 14, color: "#7896b4", lineHeight: 1.7, marginBottom: 24, maxWidth: 460 }}>
                Paste your study material and get instant multiple-choice questions with answers and explanations — plus trends from your past questions so you know what to focus on.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
<button
  onClick={() => router.push("/")}
  className="cta-btn"
  style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", color: "#fff", padding: "13px 28px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
>
  Start for Free →
</button>

<button
  onClick={() => router.push("/?guest=1")}
  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "13px 24px", borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
>
  Continue as guest
</button>

              </div>
              <p style={{ fontSize: 11, color: "#3d5a78" }}>Free forever · No credit card needed</p>
              <div style={{ marginTop: 28, padding: "12px 20px", background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 14, display: "inline-block" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#60a5fa", margin: "0 0 2px", fontFamily: "var(--font-display)" }}>{count.toLocaleString()}+</p>
                <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>students studying smarter</p>
              </div>
            </div>

            {/* Right — app mock */}
            <div style={{ flex: "1 1 260px", maxWidth: 380 }}>
              <FadeIn>
                <div style={{ background: "rgba(8,20,40,0.8)", borderRadius: 18, border: "1px solid rgba(56,139,253,0.18)", padding: 16, boxShadow: "0 18px 45px rgba(15,23,42,0.8)", backdropFilter: "blur(14px)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Live CBT session</span>
                    <span style={{ fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.12)", borderRadius: 999, padding: "3px 8px" }}>32 / 40 answered</span>
                  </div>
                  <div style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.4),rgba(8,145,178,0.25))", borderRadius: 14, padding: 10, marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: "#cbd5f5", marginBottom: 6 }}>Paste your notes or PQs</p>
                    <div style={{ height: 40, borderRadius: 10, background: "rgba(15,23,42,0.75)", border: "1px dashed rgba(148,163,184,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#64748b" }}>
                      "Cell biology lecture note (3 pages)"
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Question 17 of 40</p>
                    <p style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 6 }}>Which of the following best describes osmosis?</p>
                    {["A","B","C","D"].map((l, i) => (
                      <div key={i} style={{ padding: "7px 9px", borderRadius: 10, marginBottom: 5, border: "1px solid rgba(51,65,85,0.9)", background: i === 2 ? "rgba(22,163,74,0.15)" : "rgba(15,23,42,0.85)", fontSize: 11, color: i === 2 ? "#bbf7d0" : "rgba(148,163,184,0.9)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 18, height: 18, borderRadius: 999, border: i === 2 ? "none" : "1px solid rgba(148,163,184,0.5)", background: i === 2 ? "rgba(22,163,74,0.7)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: i === 2 ? "#022c22" : "#64748b" }}>
                          {i === 2 ? "✓" : l}
                        </span>
                        Option {l} — answer from your material
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "8px 9px", borderRadius: 10, background: "rgba(37,99,235,0.14)", border: "1px solid rgba(59,130,246,0.3)", fontSize: 10, color: "#bfdbfe" }}>
                    AI explains why the correct option is right — so you understand, not just memorise.
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* Interactive sample */}
        <section style={{ maxWidth: 520, margin: "0 auto", padding: "48px 20px 64px" }}>
          <FadeIn>
            <p style={{ textAlign: "center", fontSize: 11, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Try it — click an option</p>
            <div style={{ background: "rgba(8,20,40,0.7)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 16, padding: "20px 18px", backdropFilter: "blur(12px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {SAMPLE_QS.map((_, i) => (
                    <div key={i} onClick={() => { setActiveQ(i); setAnswered(null); }} style={{ width: i === activeQ ? 20 : 6, height: 6, borderRadius: 3, background: i === activeQ ? "#60a5fa" : "rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.3s" }} />
                  ))}
                </div>
                <span style={{ fontSize: 10, color: "#334155" }}>Auto-advances every 5s</span>
              </div>
              <p style={{ fontSize: 14, color: "#e8f0fe", marginBottom: 14, lineHeight: 1.6, minHeight: 48 }}>{q.q}</p>
              {q.opts.map((o, i) => (
                <div key={i} onClick={() => setAnswered(i)} style={{ padding: "9px 12px", borderRadius: 10, marginBottom: 7, fontSize: 12, border: "1px solid", display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer", transition: "all 0.2s",
                  borderColor: answered === null ? "rgba(56,139,253,0.12)" : o.correct ? "rgba(22,163,74,0.5)" : answered === i ? "rgba(239,68,68,0.4)" : "rgba(56,139,253,0.08)",
                  background: answered === null ? "rgba(255,255,255,0.02)" : o.correct ? "rgba(22,163,74,0.1)" : answered === i ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.01)",
                  color: answered === null ? "#7896b4" : o.correct ? "#4ade80" : answered === i ? "#f87171" : "#475569",
                }}>
                  <span style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, background: answered !== null && o.correct ? "rgba(22,163,74,0.3)" : answered === i && !o.correct ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", color: answered !== null && o.correct ? "#4ade80" : answered === i ? "#f87171" : "#475569" }}>
                    {answered !== null && o.correct ? "✓" : answered === i && !o.correct ? "✗" : o.l}
                  </span>
                  {o.t}
                </div>
              ))}
              {answered !== null && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 10, fontSize: 12, color: "#60a5fa", animation: "fadeIn 0.3s ease" }}>
                  <strong>Explanation: </strong>{q.exp}
                </div>
              )}
            </div>
          </FadeIn>
        </section>

        <div className="divider" />

        {/* How it works */}
        <section style={{ maxWidth: 860, margin: "0 auto", padding: "64px 20px" }}>
          <FadeIn>
            <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 6, color: "#e8f0fe" }}>How it works</h2>
            <p style={{ textAlign: "center", fontSize: 13, color: "#475569", marginBottom: 40 }}>Three steps to smarter studying</p>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{ background: "rgba(8,20,40,0.5)", border: "1px solid rgba(56,139,253,0.1)", borderRadius: 16, padding: "24px 20px", textAlign: "center" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,rgba(37,99,235,0.25),rgba(8,145,178,0.15))", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 17, fontWeight: 800, color: "#60a5fa", fontFamily: "var(--font-display)" }}>
                    {s.n}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#e8f0fe", marginBottom: 6, fontFamily: "var(--font-display)" }}>{s.title}</p>
                  <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <div className="divider" />

        {/* Features */}
        <section style={{ maxWidth: 860, margin: "0 auto", padding: "64px 20px" }}>
          <FadeIn>
            <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 6, color: "#e8f0fe" }}>Everything you need to pass</h2>
            <p style={{ textAlign: "center", fontSize: 13, color: "#475569", marginBottom: 40 }}>Built for how Nigerian students actually study</p>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="feature-card" style={{ background: "rgba(8,20,40,0.5)", border: "1px solid rgba(56,139,253,0.1)", borderRadius: 16, padding: "20px 18px" }}>
                  <span style={{ fontSize: 24, display: "block", marginBottom: 12 }}>{f.icon}</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#e8f0fe", marginBottom: 6, fontFamily: "var(--font-display)" }}>{f.title}</p>
                  <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <div className="divider" />

        {/* Exams */}
        <section style={{ textAlign: "center", maxWidth: 600, margin: "0 auto", padding: "56px 20px" }}>
          <FadeIn>
            <p style={{ fontSize: 12, color: "#334155", marginBottom: 14 }}>Works for all Nigerian exams and beyond</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {EXAMS.map(e => <span key={e} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#475569" }}>{e}</span>)}
            </div>
          </FadeIn>
        </section>

        <div className="divider" />

        {/* Final CTA */}
        <section style={{ textAlign: "center", padding: "64px 20px 80px" }}>
          <FadeIn>
            <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 10, background: "linear-gradient(135deg,#60a5fa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ready to study smarter?</h2>
            <p style={{ fontSize: 13, color: "#475569", marginBottom: 28 }}>Free to start. No credit card. Works on any device.</p>
<button
  onClick={() => router.push("/?mode=signup")}
  className="cta-btn"
  style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", color: "#fff", padding: "14px 36px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
>
  Start for Free →
</button>

          </FadeIn>
        </section>

        <footer style={{ borderTop: "1px solid rgba(56,139,253,0.06)", padding: "18px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#1e293b" }}>© 2025 Studiengine · Built for Nigerian students</p>
        </footer>
      </div>
    </div>
  );
}
