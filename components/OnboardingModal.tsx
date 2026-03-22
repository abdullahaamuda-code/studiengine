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
            <img src="/studiengine-logo.svg" width="36" height="36" style={{ borderRadius: 10 }} />
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
              { icon: "📝", title: "Notes → Quiz", desc: "Paste notes or upload a PDF, get instant MCQs" },
              { icon: "🔍", title: "PQ Analyzer", desc: "Spot repeated topics and patterns across years" },
              { icon: "⚡", title: "PQ → Quiz", desc: "Convert past questions into an interactive quiz" },
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
