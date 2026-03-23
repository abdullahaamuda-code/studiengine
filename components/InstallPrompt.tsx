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
  return (window.matchMedia("(display-mode: standalone)").matches) || (window.navigator as any).standalone === true;
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

    // Check if already installed
    if (localStorage.getItem(STORAGE_INSTALLED)) return;
    if (isInStandaloneMode()) { localStorage.setItem(STORAGE_INSTALLED, "1"); return; }

    // Check dismiss cooldown
    const dismissedAt = localStorage.getItem(STORAGE_DISMISSED_AT);
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_COOLDOWN_DAYS) return;
    }

    // Listen for Chrome install prompt
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
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
      if (outcome === "accepted") localStorage.setItem(STORAGE_INSTALLED, "1");
      setDeferredPrompt(null);
      setInstalling(false);
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 80,
      maxWidth: 420, margin: "0 auto",
    }}>
      <div className="glass animate-in" style={{ borderRadius: 18, padding: "18px 18px 16px", border: "1px solid rgba(59,130,246,0.3)", boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(37,99,235,0.15)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 16px rgba(37,99,235,0.4)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>Install Studiengine</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Study faster — quick access, works like a native app</p>
          </div>
          <button onClick={handleDismiss} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18, padding: 4, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>

        {ios ? (
          // iOS instructions
          <div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>To install on iPhone/iPad:</p>
              {[
                { icon: "⬆️", text: 'Tap the Share button at the bottom of Safari' },
                { icon: "➕", text: 'Scroll down and tap "Add to Home Screen"' },
                { icon: "✅", text: 'Tap "Add" — done!' },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "4px 0" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{step.icon}</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{step.text}</span>
                </div>
              ))}
            </div>
            <button onClick={handleDismiss} className="btn-ghost" style={{ width: "100%", padding: "10px 0", borderRadius: 10, fontSize: 13 }}>
              Maybe later
            </button>
          </div>
        ) : deferredPrompt ? (
          // Chrome/Android — native install
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={handleInstall} disabled={installing} style={{ flex: 1, padding: "11px 0", borderRadius: 10, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {installing ? <><div className="spinner" /> Installing...</> : "📲 Install App"}
            </button>
            <button onClick={handleDismiss} className="btn-ghost" style={{ padding: "11px 16px", borderRadius: 10, fontSize: 13 }}>
              Cancel
            </button>
          </div>
        ) : (
          // Browser didn't fire beforeinstallprompt — manual instructions
          <div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>To install on Chrome:</p>
              {[
                { icon: "⋮", text: "Tap the three dots menu (top right)" },
                { icon: "📲", text: 'Tap "Add to Home screen" or "Install app"' },
                { icon: "✅", text: "Tap Add — done!" },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "4px 0" }}>
                  <span style={{ fontSize: 14, flexShrink: 0, fontWeight: 700, color: "#60a5fa" }}>{step.icon}</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{step.text}</span>
                </div>
              ))}
            </div>
            <button onClick={handleDismiss} className="btn-ghost" style={{ width: "100%", padding: "10px 0", borderRadius: 10, fontSize: 13 }}>
              Maybe later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
