"use client";
import { useState, useEffect } from "react";

const STORAGE_INSTALLED   = "studiengine_installed";
const STORAGE_DISMISSED   = "studiengine_install_dismissed_at";
const COOLDOWN_DAYS       = 3;

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}
function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

interface Props { show: boolean; onDismiss: () => void; }

const IOS_STEPS = [
  { icon: "⬆️", text: "Tap the Share button at the bottom of Safari" },
  { icon: "➕", text: 'Scroll and tap "Add to Home Screen"' },
  { icon: "✅", text: 'Tap "Add" — done!' },
];
const CHROME_STEPS = [
  { icon: "⋮", text: "Tap the three-dot menu (top right)" },
  { icon: "📲", text: 'Tap "Add to Home screen" or "Install app"' },
  { icon: "✅", text: "Tap Add — done!" },
];

export default function InstallPrompt({ show, onDismiss }: Props) {
  const [deferred, setDeferred]   = useState<any>(null);
  const [visible, setVisible]     = useState(false);
  const [installing, setInstalling] = useState(false);
  const [ios, setIos]             = useState(false);

  useEffect(() => {
    setIos(isIOS());
    if (localStorage.getItem(STORAGE_INSTALLED) || isStandalone()) {
      localStorage.setItem(STORAGE_INSTALLED, "1"); return;
    }
    const dismissedAt = localStorage.getItem(STORAGE_DISMISSED);
    if (dismissedAt && (Date.now() - +dismissedAt) / 86400000 < COOLDOWN_DAYS) return;

    const handler = (e: Event) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => { localStorage.setItem(STORAGE_INSTALLED,"1"); setVisible(false); });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!show || localStorage.getItem(STORAGE_INSTALLED)) return;
    const dismissedAt = localStorage.getItem(STORAGE_DISMISSED);
    if (dismissedAt && (Date.now() - +dismissedAt) / 86400000 < COOLDOWN_DAYS) return;
    setVisible(true);
  }, [show]);

  function dismiss() {
    localStorage.setItem(STORAGE_DISMISSED, String(Date.now()));
    setVisible(false); onDismiss();
  }

  async function handleInstall() {
    if (!deferred) return;
    setInstalling(true);
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") localStorage.setItem(STORAGE_INSTALLED, "1");
    setDeferred(null); setInstalling(false); setVisible(false);
  }

  if (!visible) return null;

  const steps = ios ? IOS_STEPS : CHROME_STEPS;

  return (
    <>
      <style>{`@keyframes ip-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{
        position:"fixed", bottom:82, left:16, right:16, zIndex:80,
        maxWidth:420, margin:"0 auto",
        animation:"ip-in 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{
          background:"rgba(10,13,22,0.97)",
          backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
          border:"1px solid rgba(255,255,255,0.09)",
          borderRadius:20, overflow:"hidden",
          boxShadow:"0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          {/* Top glow */}
          <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.4),transparent)" }} />

          {/* Header */}
          <div style={{ padding:"14px 16px 12px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📲</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#f1f5f9", margin:"0 0 2px", fontFamily:"var(--font-display)" }}>Install Studiengine</p>
              <p style={{ fontSize:11.5, color:"#475569", margin:0 }}>Study offline · One-tap access · Faster</p>
            </div>
            <button onClick={dismiss} style={{ width:26, height:26, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"#475569", fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.1)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)";}}>×</button>
          </div>

          {/* Body */}
          <div style={{ padding:"14px 16px 16px" }}>
            {/* Native install button (Android/Chrome) */}
            {!ios && deferred ? (
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={handleInstall} disabled={installing} className="btn-primary" style={{ flex:1, padding:"11px 0", borderRadius:10, fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  {installing
                    ? <><span style={{ width:13, height:13, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"auth-spin 0.65s linear infinite", display:"inline-block" }} /> Installing…</>
                    : "📲 Install App"}
                </button>
                <button onClick={dismiss} style={{ padding:"11px 16px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", color:"#475569", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)", transition:"all 0.2s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.06)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.03)";}}>Not now</button>
              </div>
            ) : (
              /* Manual steps (iOS or no deferred prompt) */
              <>
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#334155", letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10 }}>
                    {ios ? "Install on iPhone / iPad" : "Install on Chrome"}
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {steps.map((s,i) => (
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <div style={{ width:24, height:24, borderRadius:7, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{s.icon}</div>
                        <span style={{ fontSize:12.5, color:"#64748b", lineHeight:1.55, paddingTop:3 }}>{s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={dismiss} style={{ width:"100%", padding:"10px 0", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", color:"#475569", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)", transition:"all 0.2s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.06)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.03)";}}>Maybe later</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
