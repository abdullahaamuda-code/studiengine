"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import Calculator from "@/components/Calculator";
import OnboardingModal from "@/components/OnboardingModal";
import FeedbackModal from "@/components/FeedbackModal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const NotesTab = dynamic(() => import("@/components/NotesTab"), { ssr: false });
const PQAnalyzerTab = dynamic(() => import("@/components/PQAnalyzerTab"), { ssr: false });
const PQQuizTab = dynamic(() => import("@/components/PQQuizTab"), { ssr: false });

const TABS = [
  { id: "notes", shortLabel: "Notes",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    desc: "Turn lecture notes into MCQs" },
  { id: "analyzer", shortLabel: "Analyzer",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    desc: "Spot patterns in past questions" },
  { id: "pqquiz", shortLabel: "PQ Quiz",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    desc: "Convert past questions to interactive quiz" },
];

export default function Home() {
  const [tab, setTab] = useState("notes");
  const [showAuth, setShowAuth] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { user, isGuest, loading } = useAuth();
  const { theme, toggle } = useTheme();

  const isLoggedIn = !!user || isGuest;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `linear-gradient(rgba(56,139,253,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,139,253,0.03) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      <Navbar />

      {/* Theme toggle */}
      <button onClick={toggle} style={{
        position: "fixed", top: 64, right: 16, zIndex: 40,
        width: 34, height: 34, borderRadius: 10,
        background: "var(--bg-card)", backdropFilter: "blur(10px)",
        border: "1px solid var(--border-glass)", cursor: "pointer",
        fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}>
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div style={{ position: "relative", zIndex: 2, maxWidth: 560, margin: "0 auto", padding: "28px 16px 40px" }}>
        <div className="animate-in" style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {["JAMB", "WAEC", "NECO", "University"].map(tag => (
              <span key={tag} style={{ fontSize: 10, color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: 20 }}>{tag}</span>
            ))}
          </div>
        </div>

        {!isLoggedIn && !loading && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Sign in to start using Studiengine</p>
            <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}>Get Started</button>
          </div>
        )}

        <div className="animate-in glass-static" style={{ borderRadius: 14, padding: 5, marginBottom: 20, display: "flex", gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={tab === t.id ? "tab-active" : ""}
              style={{ flex: 1, padding: "10px 4px", borderRadius: 10, border: "1px solid transparent", background: "transparent", cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ color: tab === t.id ? "#60a5fa" : "var(--text-muted)", display: "flex" }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? "#93c5fd" : "var(--text-muted)", whiteSpace: "nowrap" }}>{t.shortLabel}</span>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginBottom: 20 }}>
          {TABS.find(t => t.id === tab)?.desc}
        </p>

        <div className="glass" style={{ borderRadius: 18, padding: "22px 18px" }}>
          {isLoggedIn ? (
            <>
              {tab === "notes" && <NotesTab />}
              {tab === "analyzer" && <PQAnalyzerTab />}
              {tab === "pqquiz" && <PQQuizTab />}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🎓</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: "var(--font-display)" }}>Ready to ace your exams?</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Sign in or continue as guest to get started.</p>
              <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ padding: "13px 28px", borderRadius: 12, fontSize: 14 }}>Get Started — It's Free</button>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 28, fontSize: 11, color: "var(--text-muted)" }}>
          © 2026 Studiengine. All rights reserved.
        </p>
      </div>

      {/* Floating calculator — bottom right */}
      {isLoggedIn && (
        <button onClick={() => setShowCalc(c => !c)} style={{
          position: "fixed", bottom: 24, right: 16, zIndex: 55,
          width: 48, height: 48, borderRadius: "50%",
          background: showCalc ? "linear-gradient(135deg,#2563eb,#0891b2)" : "rgba(8,20,40,0.9)",
          border: "1px solid rgba(59,130,246,0.3)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)", fontSize: 18, transition: "all 0.2s",
        }}>🧮</button>
      )}

      {/* Floating feedback — bottom left */}
      <button onClick={() => setShowFeedback(true)} style={{
        position: "fixed", bottom: 24, left: 16, zIndex: 55,
        width: 48, height: 48, borderRadius: "50%",
        background: "rgba(8,20,40,0.9)",
        border: "1px solid rgba(56,139,253,0.2)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)", fontSize: 18, transition: "all 0.2s",
      }} title="Send feedback">💬</button>

      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <OnboardingModal />
    </div>
  );
}
