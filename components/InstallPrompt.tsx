"use client";
import { useState, useEffect } from "react";

const STORAGE_INSTALLED = "studiengine_installed";
const STORAGE_DISMISSED_AT = "studiengine_install_dismissed_at";
const DISMISS_COOLDOWN_DAYS = 3;

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function StudiengineLogo() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: 6, display: "block" }}
      >
        <defs>
          <linearGradient id="amb" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a1628" />
            <stop offset="100%" stopColor="#0c1a2e" />
          </linearGradient>
          <linearGradient id="ams" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect width="80" height="80" rx="16" fill="url(#amb)" />
        <rect x="30" y="12" width="34" height="8" rx="4" fill="#1e3a5f" opacity="0.8" />
        <rect x="14" y="24" width="50" height="8" rx="4" fill="#1e3a5f" opacity="0.7" />
        <rect x="14" y="36" width="52" height="8" rx="4" fill="#1e3a5f" opacity="0.6" />
        <rect x="14" y="48" width="50" height="8" rx="4" fill="#1e3a5f" opacity="0.5" />
        <rect x="14" y="60" width="34" height="8" rx="4" fill="#1e3a5f" opacity="0.4" />
        <path
          d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60"
          fill="none"
          stroke="url(#ams)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
      </svg>
      <span style={{
        fontSize: 13,
        fontWeight: 800,
        fontFamily: "var(--font-display)",
        background: "linear-gradient(135deg,#60a5fa,#22d3ee)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-0.01em",
      }}>
        Studiengine
      </span>
    </div>
  );
}

interface Props {
  show: boolean;
  onDismiss: () => void;
}

export default function InstallPrompt({ show, onDismiss }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIOS());

    if (localStorage.getItem(STORAGE_INSTALLED)) return;
    if (isInStandaloneMode()) {
      localStorage.setItem(STORAGE_INSTALLED, "1");
      return;
    }

    const dismissedAt = localStorage.getItem(STORAGE_DISMISSED_AT);
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_COOLDOWN_DAYS) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      localStorage.setItem(STORAGE_INSTALLED, "1");
      setVisible(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (show && !localStorage.getItem(STORAGE_INSTALLED)) {
      const dismissedAt = localStorage.getItem(STORAGE_DISMISSED_AT);
      if (dismissedAt) {
        const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < DISMISS_COOLDOWN_DAYS) return;
      }
      setVisible(true);
    }
  }, [show]);

  function handleDismiss() {
    localStorage.setItem(STORAGE_DISMISSED_AT, String(Date.now()));
    setVisible(false);
    onDismiss();
  }

  async function handleInstall() {
    if (deferredPrompt) {
      setInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(STORAGE_INSTALLED, "1");
      }
      setDeferredPrompt(null);
      setInstalling(false);
      setVisible(false);
    }
  }

  if (!visible) return null;

  const iosSteps = [
    { icon: "⬆️", text: "Tap the Share button at the bottom of Safari" },
    { icon: "➕", text: 'Scroll and tap "Add to Home Screen"' },
    { icon: "✅", text: 'Tap "Add" — done!' },
  ];

  const androidSteps = [
    { icon: "⋮", text: "Tap the three dots menu (top right)" },
    { icon: "📲", text: 'Tap "Add to Home screen" or "Install app"' },
    { icon: "✅", text: "Tap Add — done!" },
  ];

  return (
    <>
      <style>{`
        @keyframes install-in {
          from { opacity:0; transform:translateY(16px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .install-step {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 8px 0;
          transition: all 0.2s;
        }
        .install-step:hover {
          transform: translateX(2px);
        }

        @media (max-width: 640px) {
          .install-container {
            bottom: 16px !important;
            left: 12px !important;
            right: 12px !important;
          }
        }
      `}</style>

      <div
        className="install-container"
        style={{
          position: "fixed",
          bottom: 80,
          left: 16,
          right: 16,
          zIndex: 80,
          maxWidth: 440,
          margin: "0 auto",
          animation: "install-in 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{
          background: "rgba(10,13,22,0.97)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 20,
          padding: "16px 16px 14px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 40px rgba(99,102,241,0.08)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Top shimmer line */}
          <div style={{
            position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
            background: "linear-gradient(90deg,transparent,rgba(129,140,248,0.45),transparent)",
          }} />

          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}>
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 12,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}>
              <StudiengineLogo />
              <span style={{
                fontSize: 11.5,
                color: "#94a3b8",
                fontWeight: 600,
                flex: 1,
                lineHeight: 1.4,
              }}>
                Install for 1‑tap access
              </span>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Close"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.05)",
                color: "#475569",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#475569"; }}
            >×</button>
          </div>

          {/* Instructions or Install button */}
          {ios ? (
            <div>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                borderRadius: 14,
                padding: "14px 14px 10px",
                marginBottom: 10,
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <p style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#a5b4fc",
                  margin: "0 0 10px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}>
                  Install on iPhone/iPad
                </p>
                {iosSteps.map((step, i) => (
                  <div key={i} className="install-step">
                    <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.5 }}>{step.icon}</span>
                    <span style={{
                      fontSize: 12.5,
                      color: "#cbd5e1",
                      lineHeight: 1.5,
                    }}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleDismiss}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#94a3b8",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              >
                Maybe later
              </button>
            </div>
          ) : deferredPrompt ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleInstall}
                disabled={installing}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg,#6366f1,#818cf8)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  cursor: installing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                  opacity: installing ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!installing) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {installing ? (
                  <>
                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    Installing...
                  </>
                ) : (
                  "📲 Install Studiengine"
                )}
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#94a3b8",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              >
                Not now
              </button>
            </div>
          ) : (
            <div>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                borderRadius: 14,
                padding: "14px 14px 10px",
                marginBottom: 10,
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <p style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#a5b4fc",
                  margin: "0 0 10px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}>
                  Install on Chrome
                </p>
                {androidSteps.map((step, i) => (
                  <div key={i} className="install-step">
                    <span style={{
                      fontSize: 14,
                      flexShrink: 0,
                      fontWeight: 700,
                      color: "#60a5fa",
                      lineHeight: 1.5,
                    }}>{step.icon}</span>
                    <span style={{
                      fontSize: 12.5,
                      color: "#cbd5e1",
                      lineHeight: 1.5,
                    }}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleDismiss}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#94a3b8",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              >
                Maybe later
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
