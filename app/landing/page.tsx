"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function StudiengineLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 10, display: "block", flexShrink: 0 }}>
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

const FEATURES = [
  { icon: "📝", title: "Notes → CBT", desc: "Paste lecture notes or upload a PDF. Get instant MCQ practice questions tailored to your content." },
  { icon: "🔍", title: "PQ Analyzer", desc: "Upload past questions and discover hot topics, repeated patterns, and what's likely to appear." },
  { icon: "⚡", title: "PQ → CBT", desc: "Turn any past question paper into an interactive CBT session with answers and full explanations." },
  { icon: "🤖", title: "AI Explanations", desc: "Stuck on a question? Ask the AI to explain step by step, in plain language." },
];

const STEPS = [
  { n: "1", title: "Paste or upload", desc: "Your lecture notes, past questions, or any study material" },
  { n: "2", title: "AI generates CBT", desc: "Instant multiple choice questions with A B C D options" },
  { n: "3", title: "Practice and review", desc: "See your score, review mistakes, improve your weak areas" },
];

const EXAMS = ["JAMB", "WAEC", "NECO", "GCE", "POST-UTME", "University", "Lectures"];

export default function LandingPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = 1240;
    const step = Math.ceil(target / 60);
    const t = setInterval(() => {
      setCount(c => { if (c >= target) { clearInterval(t); return target; } return c + step; });
    }, 20);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#03080f", fontFamily: "var(--font-body)", color: "#e8f0fe", overflowX: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(8,145,178,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid rgba(56,139,253,0.08)", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StudiengineLogo size={32} />
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-display)", background: "linear-gradient(135deg,#60a5fa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Studiengine</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => router.push("/")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>
            <button onClick={() => router.push("/")} style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Start Free →</button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "80px 24px 60px", maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(37,99,235,0.12)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 24, fontSize: 12, color: "#60a5fa" }}>
            🎓 Built for Nigerian students and beyond
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1.15, marginBottom: 20, background: "linear-gradient(135deg,#e8f0fe 0%,#60a5fa 50%,#22d3ee 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Turn your notes and past questions into CBT practice
          </h1>
          <p style={{ fontSize: 16, color: "#7896b4", lineHeight: 1.7, marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>
            Paste your study material and get instant multiple-choice questions with answers and explanations. JAMB · WAEC · University · Lectures.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/")} style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", color: "#fff", padding: "14px 32px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 0 30px rgba(37,99,235,0.35)" }}>
              Start for Free →
            </button>
            <button onClick={() => router.push("/")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", padding: "14px 28px", borderRadius: 12, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
              Try as Guest
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#3d5a78", marginTop: 16 }}>Free forever · No credit card · 2 CBTs/day as guest</p>
          <div style={{ marginTop: 48, padding: "16px 24px", background: "rgba(8,20,40,0.5)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 14, display: "inline-block" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#60a5fa", margin: "0 0 4px", fontFamily: "var(--font-display)" }}>{count.toLocaleString()}+</p>
            <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>students studying smarter</p>
          </div>
        </section>

        {/* Sample question */}
        <section style={{ maxWidth: 480, margin: "0 auto 80px", padding: "0 24px" }}>
          <div style={{ background: "rgba(8,20,40,0.7)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 16, padding: "20px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: "#475569" }}>1 / 10</span>
              <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>⚡ 3 correct</span>
            </div>
            <p style={{ fontSize: 14, color: "#e8f0fe", marginBottom: 16, lineHeight: 1.6 }}>Which of the following best describes osmosis?</p>
            {[
              { l: "A", t: "Movement of water from high to low solute concentration through a semi-permeable membrane", correct: true },
              { l: "B", t: "Movement of solutes from low to high concentration", correct: false },
              { l: "C", t: "Active transport of ions across cell membranes", correct: false },
              { l: "D", t: "Diffusion of gases through a permeable membrane", correct: false },
            ].map((o, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 10, marginBottom: 8, fontSize: 13, border: "1px solid", display: "flex", gap: 10, alignItems: "flex-start", borderColor: o.correct ? "rgba(22,163,74,0.4)" : "rgba(56,139,253,0.1)", background: o.correct ? "rgba(22,163,74,0.08)" : "rgba(255,255,255,0.02)", color: o.correct ? "#4ade80" : "#7896b4" }}>
                <span style={{ width: 20, height: 20, borderRadius: 5, background: o.correct ? "rgba(22,163,74,0.25)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {o.correct ? "✓" : o.l}
                </span>
                {o.t}
              </div>
            ))}
            <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(37,99,235,0.08)", borderRadius: 10, fontSize: 12, color: "#60a5fa" }}>
              <strong>Explanation:</strong> Osmosis is the movement of water molecules through a selectively permeable membrane from lower to higher solute concentration.
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "#334155", marginTop: 10 }}>← This is what every generated question looks like</p>
        </section>

        {/* How it works */}
        <section style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 24px" }}>
          <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 8, color: "#e8f0fe" }}>How it works</h2>
          <p style={{ textAlign: "center", fontSize: 13, color: "#475569", marginBottom: 36 }}>Three steps to smarter studying</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ background: "rgba(8,20,40,0.5)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 16, padding: "24px 20px", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,rgba(37,99,235,0.3),rgba(8,145,178,0.2))", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 18, fontWeight: 800, color: "#60a5fa", fontFamily: "var(--font-display)" }}>
                  {s.n}
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#e8f0fe", marginBottom: 8, fontFamily: "var(--font-display)" }}>{s.title}</p>
                <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 24px" }}>
          <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 8, color: "#e8f0fe" }}>Everything you need to pass</h2>
          <p style={{ textAlign: "center", fontSize: 13, color: "#475569", marginBottom: 36 }}>Built for how Nigerian students actually study</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: "rgba(8,20,40,0.5)", border: "1px solid rgba(56,139,253,0.1)", borderRadius: 16, padding: "20px 18px" }}>
                <span style={{ fontSize: 26, display: "block", marginBottom: 12 }}>{f.icon}</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#e8f0fe", marginBottom: 6, fontFamily: "var(--font-display)" }}>{f.title}</p>
                <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Exam tags */}
        <section style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 80px", padding: "0 24px" }}>
          <p style={{ fontSize: 12, color: "#334155", marginBottom: 14 }}>Works for all Nigerian exams and beyond</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {EXAMS.map(e => (
              <span key={e} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}>{e}</span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: "center", padding: "60px 24px 80px", borderTop: "1px solid rgba(56,139,253,0.08)" }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 12, background: "linear-gradient(135deg,#60a5fa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Ready to study smarter?
          </h2>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 28 }}>Free to start. No credit card. Works on any device.</p>
          <button onClick={() => router.push("/")} style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", color: "#fff", padding: "16px 40px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 0 30px rgba(37,99,235,0.35)" }}>
            Start for Free →
          </button>
        </section>

        <footer style={{ borderTop: "1px solid rgba(56,139,253,0.08)", padding: "20px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#1e293b" }}>© 2025 Studiengine · Built for Nigerian students</p>
        </footer>
      </div>
    </div>
  );
}
