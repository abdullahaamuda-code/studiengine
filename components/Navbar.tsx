"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";
import UpgradeModal from "./UpgradeModal";

function StudiengineLogo({ size = 28 }: { size?: number }) {
  return (
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
  );
}

export default function Navbar() {
  const { user, isGuest, isPremium, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!user || isGuest;

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(3,8,15,0.88)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(56,139,253,0.1)",
        padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <StudiengineLogo size={30} />
          <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", background: "linear-gradient(135deg,#60a5fa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Studiengine
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isLoggedIn ? (
            <>
              <button onClick={() => setShowAuth(true)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", padding: "7px 10px" }}>
                Sign In
              </button>
              <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13 }}>
                Try Free
              </button>
            </>
          ) : (
            <>
              {!isPremium && (
                <button onClick={() => setShowUpgrade(true)} style={{
                  background: "linear-gradient(135deg,rgba(234,179,8,0.2),rgba(251,191,36,0.1))",
                  border: "1px solid rgba(234,179,8,0.3)", color: "#fbbf24",
                  fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20,
                  cursor: "pointer", fontFamily: "var(--font-body)", letterSpacing: "0.04em",
                }}>⚡ UPGRADE</button>
              )}

              {/* Avatar with optional premium crown */}
              <div ref={menuRef} style={{ position: "relative" }}>
                <button onClick={() => setMenuOpen(m => !m)} style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: isPremium
                    ? "linear-gradient(135deg,#78350f,#b45309)"
                    : "linear-gradient(135deg,#1e3a5f,#0f2040)",
                  border: isPremium ? "2px solid #fbbf24" : "1px solid rgba(59,130,246,0.3)",
                  boxShadow: isPremium ? "0 0 14px rgba(251,191,36,0.5), 0 0 28px rgba(251,191,36,0.2)" : "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: isPremium ? "#fde68a" : "#93c5fd",
                  fontSize: 13, fontWeight: 700, fontFamily: "var(--font-body)",
                  position: "relative", transition: "box-shadow 0.3s",
                }}>
                  {user?.email?.[0]?.toUpperCase() || "G"}
                  {isPremium && (
                    <span style={{
                      position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                      fontSize: 13, filter: "drop-shadow(0 0 6px #fbbf24)",
                      pointerEvents: "none", lineHeight: 1,
                    }}>👑</span>
                  )}
                </button>

                {menuOpen && (
                  <div style={{
                    position: "absolute", right: 0, top: 44, minWidth: 200,
                    background: "rgba(6,15,30,0.97)", backdropFilter: "blur(20px)",
                    border: "1px solid rgba(56,139,253,0.2)", borderRadius: 14,
                    padding: 8, zIndex: 100,
                    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                  }}>
                    {/* User info */}
                    <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 6 }}>
                      {user && <p style={{ fontSize: 12, color: "#60a5fa", margin: "0 0 2px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>}
                      {isGuest && <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Guest session</p>}
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 20, marginTop: 4, display: "inline-block",
                        background: isPremium ? "rgba(251,191,36,0.15)" : "rgba(30,41,59,0.6)",
                        color: isPremium ? "#fbbf24" : "#475569",
                        border: `1px solid ${isPremium ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.06)"}`,
                      }}>
                        {isPremium ? "⚡ Premium" : isGuest ? "👤 Guest" : "Free Plan"}
                      </span>
                    </div>

                    {!isPremium && (
                      <button onClick={() => { setMenuOpen(false); setShowUpgrade(true); }} style={{
                        width: "100%", textAlign: "left", padding: "9px 12px",
                        background: "linear-gradient(135deg,rgba(234,179,8,0.12),rgba(251,191,36,0.06))",
                        border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10,
                        color: "#fbbf24", fontSize: 12, cursor: "pointer",
                        fontFamily: "var(--font-body)", marginBottom: 6, fontWeight: 600,
                      }}>
                        ⚡ Upgrade to Premium
                      </button>
                    )}

                    {isGuest && (
                      <button onClick={() => { setMenuOpen(false); setShowAuth(true); }} style={{
                        width: "100%", textAlign: "left", padding: "9px 12px", background: "none",
                        border: "none", color: "#60a5fa", fontSize: 13, cursor: "pointer",
                        fontFamily: "var(--font-body)", borderRadius: 8, display: "block",
                      }}>
                        Create Account →
                      </button>
                    )}

                    <button onClick={() => { setMenuOpen(false); logout(); }} style={{
                      width: "100%", textAlign: "left", padding: "9px 12px", background: "none",
                      border: "none", color: "#f87171", fontSize: 13, cursor: "pointer",
                      fontFamily: "var(--font-body)", borderRadius: 8, display: "block",
                    }}>
                      {isGuest ? "Exit Guest Mode" : "Sign Out"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}
