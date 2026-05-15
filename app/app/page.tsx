"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Calculator from "@/components/Calculator";
import InstallPrompt from "@/components/InstallPrompt";
import FeedbackButton from "@/components/FeedbackButton";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const NotesTab      = dynamic(() => import("@/components/NotesTab"),      { ssr: false });
const PQAnalyzerTab = dynamic(() => import("@/components/PQAnalyzerTab"), { ssr: false });
const PQQuizTab     = dynamic(() => import("@/components/PQQuizTab"),     { ssr: false });

/* ─────────────────────────────────────────────
   TAB DEFINITIONS
───────────────────────────────────────────── */
const TABS = [
  {
    id: "notes",
    label: "Notes → CBT",
    shortLabel: "Notes",
    desc: "Turn your lecture notes or handouts into targeted CBT practice questions instantly.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    id: "analyzer",
    label: "PQ Analyzer",
    shortLabel: "Analyzer",
    desc: "Upload past questions — discover hot topics, repeated patterns, and what to focus on.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: "pqquiz",
    label: "PQ → CBT",
    shortLabel: "PQ Quiz",
    desc: "Convert any past question paper into a live interactive CBT with AI explanations.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
];

/* ─────────────────────────────────────────────
   EXAM TAGS
───────────────────────────────────────────── */
const EXAM_TAGS = ["JAMB", "WAEC", "NECO", "GCE", "POST-UTME", "University"];

/* ─────────────────────────────────────────────
   INNER COMPONENT
───────────────────────────────────────────── */
function HomeInner() {
  const [tab, setTab] = useState("notes");
  const [showCalc, setShowCalc] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  const { user, isGuest, loading, continueAsGuest } = useAuth();
  const searchParams = useSearchParams();
  const { theme, toggle } = useTheme();
  const isLoggedIn = !!user || isGuest;

  /* handle query params from landing — runs once on mount, then clears the URL
     so a refresh doesn't re-trigger the modal */
  useEffect(() => {
    if (loading) return;

    const mode = searchParams.get("mode");
    const guest = searchParams.get("guest");

    if (guest === "1" && !user && !isGuest) {
      continueAsGuest();
    }
    // Clear params from URL so refresh doesn't re-open anything
    if (mode || guest) {
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]); // only run once when auth finishes loading

  /* service worker */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <style>{`
        @keyframes tab-slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes content-in   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes calc-in      { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }

        .tab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 10px 6px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          font-family: var(--font-body);
          position: relative;
          overflow: hidden;
        }
        .tab-btn:hover:not(.tab-btn-active) {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.06);
        }
        .tab-btn-active {
          background: linear-gradient(135deg,rgba(99,102,241,0.2),rgba(56,189,248,0.1)) !important;
          border-color: rgba(99,102,241,0.4) !important;
          box-shadow: 0 0 20px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.07);
        }

        .calc-fab {
          position: fixed;
          bottom: 24px;
          right: 16px;
          z-index: 55;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1px solid rgba(99,102,241,0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 4px 24px rgba(0,0,0,0.5);
        }
        .calc-fab:hover { transform: scale(1.08); }

        .theme-toggle {
          position: fixed;
          top: 64px;
          right: 14px;
          z-index: 40;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-glass);
          cursor: pointer;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
          transition: all 0.2s;
        }
        .theme-toggle:hover { border-color: var(--border-glass-bright); background: var(--bg-card-hover); }

        .sign-in-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          background: rgba(99,102,241,0.06);
          border: 1px solid rgba(99,102,241,0.18);
          border-radius: 14px;
          margin-bottom: 18px;
          animation: content-in 0.4s ease;
        }

        .content-panel {
          border-radius: 20px;
          padding: 24px 20px;
          animation: content-in 0.35s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }
        .content-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 1px;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);
        }

        .empty-state {
          text-align: center;
          padding: 52px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .exam-tag {
          font-size: 10px;
          color: var(--text-muted);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 3px 10px;
          border-radius: 99px;
          transition: all 0.2s;
          cursor: default;
        }
        .exam-tag:hover {
          background: rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.2);
          color: var(--text-accent);
        }

        /* Responsive */
        @media (max-width: 480px) {
          .content-panel { padding: 18px 14px; }
          .tab-btn { padding: 9px 4px; }
        }
      `}</style>

      {/* ── Ambient background ── */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Theme toggle ── */}
      <button
        className="theme-toggle"
        onClick={toggle}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* ── Main content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 580,
          margin: "0 auto",
          padding: "24px 16px 80px",
        }}
      >
        {/* ── Exam tags row ── */}
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 22,
            animation: "content-in 0.4s ease",
          }}
        >
          {EXAM_TAGS.map(tag => (
            <span key={tag} className="exam-tag">
              {tag}
            </span>
          ))}
        </div>

        {/* ── Sign-in banner (logged out only) ── */}
        {!isLoggedIn && !loading && (
          <div className="sign-in-banner">
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: "0 0 2px",
                }}
              >
                Sign in to get started
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Free account · No credit card needed
              </p>
            </div>
            {/* Commented out button since you removed AuthModal; you can remove this div entirely if you prefer */}
            <button
              onClick={() => {}}
              className="btn-primary"
              style={{
                padding: "8px 18px",
                borderRadius: 9,
                fontSize: 13,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Get Started →
            </button>
          </div>
        )}

        {/* ── Tab switcher ── */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 5,
            background: "rgba(255,255,255,0.025)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            marginBottom: 16,
            animation: "content-in 0.45s ease",
          }}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-btn${tab === t.id ? " tab-btn-active" : ""}`}
            >
              <span
                style={{
                  color: tab === t.id ? "#818cf8" : "var(--text-muted)",
                  display: "flex",
                  transition: "color 0.2s",
                }}
              >
                {t.icon}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: tab === t.id ? 700 : 500,
                  color: tab === t.id ? "#c7d2fe" : "var(--text-muted)",
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s",
                }}
              >
                {t.shortLabel}
              </span>
            </button>
          ))}
        </div>

        {/* ── Tab description ── */}
        <p
          style={{
            fontSize: 12.5,
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: 18,
            lineHeight: 1.6,
            padding: "0 8px",
            animation: "tab-slide-in 0.3s ease",
            minHeight: 20,
          }}
        >
          {activeTab.desc}
        </p>

        {/* ── Main panel ── */}
        <div className="glass content-panel">
          {isLoggedIn ? (
            <div key={tab} style={{ animation: "tab-slide-in 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
              {tab === "notes"    && <NotesTab onCBTComplete={() => setShowInstall(true)} />}
              {tab === "analyzer" && <PQAnalyzerTab />}
              {tab === "pqquiz"   && <PQQuizTab onCBTComplete={() => setShowInstall(true)} />}
            </div>
          ) : (
            <div className="empty-state">
              {/* Icon */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  marginBottom: 18,
                }}
              >
                🎓
              </div>

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: "0 0 8px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.01em",
                }}
              >
                Ready to ace your exams?
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--text-muted)",
                  margin: "0 0 24px",
                  lineHeight: 1.65,
                  maxWidth: 320,
                }}
              >
                Create a free account or continue as a guest to start generating CBT practice questions from your own material.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  width: "100%",
                  maxWidth: 280,
                }}
              >
                <button
                  onClick={() => {}}
                  className="btn-primary"
                  style={{
                    padding: "13px 0",
                    borderRadius: 11,
                    fontSize: 14,
                    width: "100%",
                  }}
                >
                  Get Started — It's Free
                </button>
                <button
                  onClick={() => { if (continueAsGuest) continueAsGuest(); }}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 11,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                  }}
                >
                  Continue as Guest
                </button>
              </div>

              {/* Features mini-list */}
              <div
                style={{
                  marginTop: 28,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  width: "100%",
                  maxWidth: 300,
                }}
              >
                {[
                  { icon: "✦", text: "Notes → instant CBT questions" },
                  { icon: "◈", text: "PQ topic analytics & patterns" },
                  { icon: "⚡", text: "AI explanations for every answer" },
                ].map(f => (
                  <div
                    key={f.text}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 9,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#818cf8",
                        flexShrink: 0,
                      }}
                    >
                      {f.icon}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                      }}
                    >
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <p
          style={{
            textAlign: "center",
            marginTop: 28,
            fontSize: 11,
            color: "var(--text-muted)",
            opacity: 0.5,
          }}
        >
          © 2026 Studiengine · Built for African students 🇳🇬
        </p>
      </div>

      {/* ── Floating calculator FAB ── */}
      {isLoggedIn && (
        <button
          onClick={() => setShowCalc(c => !c)}
          className="calc-fab"
          style={{
            background: showCalc
              ? "linear-gradient(135deg,#6366f1,#4f46e5)"
              : "rgba(10,13,22,0.92)",
            boxShadow: showCalc
              ? "0 4px 24px rgba(99,102,241,0.45)"
              : "0 4px 24px rgba(0,0,0,0.5)",
          }}
          title="Calculator"
        >
          🧮
        </button>
      )}

      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}

      {/* ── Install prompt only ── */}
      <InstallPrompt show={showInstall} onDismiss={() => setShowInstall(false)} />
      {isLoggedIn && <FeedbackButton />}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
