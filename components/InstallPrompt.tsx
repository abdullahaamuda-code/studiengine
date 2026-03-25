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
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: 8, display: "block" }}
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
        <rect
          x="30"
          y="12"
          width="34"
          height="8"
          rx="4"
          fill="#1e3a5f"
          opacity="0.8"
        />
        <rect
          x="14"
          y="24"
          width="50"
          height="8"
          rx="4"
          fill="#1e3a5f"
          opacity="0.7"
        />
        <rect
          x="14"
          y="36"
          width="52"
          height="8"
          rx="4"
          fill="#1e3a5f"
          opacity="0.6"
        />
        <rect
          x="14"
          y="48"
          width="50"
          height="8"
          rx="4"
          fill="#1e3a5f"
          opacity="0.5"
        />
        <rect
          x="14"
          y="60"
          width="34"
          height="8"
          rx="4"
          fill="#1e3a5f"
          opacity="0.4"
        />
        <path
          d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60"
          fill="none"
          stroke="url(#ams)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          background: "linear-gradient(135deg,#60a5fa,#22d3ee)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
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
      const daysSince =
        (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
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
        const daysSince =
          (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
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

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: 16,
        right: 16,
        zIndex: 80,
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <div
        className="glass animate-in"
        style={{
          borderRadius: 18,
          padding: "14px 14px 12px",
          border: "1px solid var(--border-glass)",
          background:
            "radial-gradient(circle at 0 0, rgba(37,99,235,0.25), transparent 60%) rgba(15,23,42,0.92)",
          boxShadow:
            "0 18px 45px rgba(15,23,42,0.9), 0 0 40px rgba(37,99,235,0.18)",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                padding: 6,
                borderRadius: 999,
                background:
                  "linear-gradient(135deg,rgba(37,99,235,0.18),rgba(8,145,178,0.08))",
                border: "1px solid rgba(56,139,253,0.35)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <StudiengineLogo />
              <span
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  whiteSpace: "nowrap",
                }}
              >
                Install the app for 1‑tap access
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Close"
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.3)",
              background: "rgba(15,23,42,0.9)",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            ×
          </button>
        </div>

        {ios ? (
          <div>
            <div
              style={{
                background: "rgba(15,23,42,0.9)",
                borderRadius: 14,
                padding: "12px 14px",
                marginBottom: 10,
                border: "1px solid rgba(148,163,184,0.25)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  margin: "0 0 8px",
                  fontWeight: 600,
                }}
              >
                To install on iPhone/iPad:
              </p>
              {[
                {
                  icon: "⬆️",
                  text: "Tap the Share button at the bottom of Safari",
                },
                {
                  icon: "➕",
                  text: 'Scroll down and tap "Add to Home Screen"',
                },
                { icon: "✅", text: 'Tap "Add" — done!' },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    padding: "3px 0",
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{step.icon}</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleDismiss}
              className="btn-ghost"
              style={{
                width: "100%",
                padding: "9px 0",
                borderRadius: 10,
                fontSize: 13,
              }}
            >
              Maybe later
            </button>
          </div>
        ) : deferredPrompt ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-primary"
              onClick={handleInstall}
              disabled={installing}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {installing ? (
                <>
                  <div className="spinner" /> Installing...
                </>
              ) : (
                "📲 Install Studiengine"
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="btn-ghost"
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                fontSize: 13,
              }}
            >
              Not now
            </button>
          </div>
        ) : (
          <div>
            <div
              style={{
                background: "rgba(15,23,42,0.9)",
                borderRadius: 14,
                padding: "12px 14px",
                marginBottom: 10,
                border: "1px solid rgba(148,163,184,0.25)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  margin: "0 0 8px",
                  fontWeight: 600,
                }}
              >
                To install on Chrome:
              </p>
              {[
                {
                  icon: "⋮",
                  text: "Tap the three dots menu (top right)",
                },
                {
                  icon: "📲",
                  text: 'Tap "Add to Home screen" or "Install app"',
                },
                { icon: "✅", text: "Tap Add — done!" },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    padding: "3px 0",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      flexShrink: 0,
                      fontWeight: 700,
                      color: "#60a5fa",
                    }}
                  >
                    {step.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleDismiss}
              className="btn-ghost"
              style={{
                width: "100%",
                padding: "9px 0",
                borderRadius: 10,
                fontSize: 13,
              }}
            >
              Maybe later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
