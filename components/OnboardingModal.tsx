"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "studiengine_onboarded_v2";

export default function OnboardingModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(2,8,23,0.9)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="glass animate-in" style={{
        borderRadius: 20, width: "100%",
        maxWidth: 480, maxHeight: "88vh",
        overflowY: "auto", position: "relative",
        display: "flex", flexDirection: "column",
      }}>
        {/* Sticky top bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(8,20,40,0.95)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(56,139,253,0.1)",
          padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderRadius: "20px 20px 0 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#2563eb,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 7, display: "block" }}>
      <defs>
        <linearGradient id="nb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a1628"/>
          <stop offset="100%" stopColor="#0c1a2e"/>
        </linearGradient>
        <linearGradient id="ns" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#22d3ee"/>
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="16" fill="url(#nb)"/>
      <rect x="30" y="12" width="34" height="8" rx="4" fill="#1e3a5f" opacity="0.8"/>
      <rect x="14" y="24" width="50" height="8" rx="4" fill="#1e3a5f" opacity="0.7"/>
      <rect x="14" y="36" width="52" height="8" rx="4" fill="#1e3a5f" opacity="0.6"/>
      <rect x="14" y="48" width="50" height="8" rx="4" fill="#1e3a5f" opacity="0.5"/>
      <rect x="14" y="60" width="34" height="8" rx="4" fill="#1e3a5f" opacity="0.4"/>
      <path d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60"
        fill="none" stroke="url(#ns)" strokeWidth="6.5" strokeLinecap="round"/>
    </svg>

            </div>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-display)" }} className="gradient-text">Studiengine</span>
          </div>
          <button onClick={dismiss} style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)", fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 24px 28px" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: 6 }}>
            Your AI exam prep companion
          </p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.65 }}>
            Built for Nigerian students — JAMB, WAEC, NECO, and university exams. Upload your notes or past questions and let AI do the heavy lifting.
          </p>

          {/* Features grid — 2 cols on wider screens */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 22 }}>
            {[
              { icon: "📝", title: "Notes → CBT", desc: "Paste notes or upload a PDF, get instant CBT practice questions" },
              { icon: "🔍", title: "PQ Analyzer", desc: "Spot repeated topics and patterns across years" },
              { icon: "⚡", title: "PQ → CBT", desc: "Convert past questions into an interactive CBT Practice" },
              { icon: "🧮", title: "Calculator", desc: "Built-in calculator for math and science" },
            ].map(f => (
              <div key={f.title} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "12px 14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12,
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{f.title}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Exam tags */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {["JAMB", "WAEC", "NECO", "University"].map(tag => (
              <span key={tag} style={{ fontSize: 10, color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: "4px 12px", borderRadius: 20 }}>{tag}</span>
            ))}
          </div>

          <button className="btn-primary" onClick={dismiss} style={{ width: "100%", padding: "13px 0", borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
            Get Started →
          </button>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>Free to use • No credit card needed</p>
        </div>
      </div>
    </div>
  );
}
