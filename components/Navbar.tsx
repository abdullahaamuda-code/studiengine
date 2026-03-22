"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";
import UpgradeModal from "./UpgradeModal";

export default function Navbar() {
  const { user, isGuest, isPremium, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoggedIn = !!user || isGuest;

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(3,8,15,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(56,139,253,0.1)",
        padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<img src="/studiengine-logo.svg" width="28" height="28" style={{ borderRadius: 7 }} />
          <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }} className="gradient-text">Studiengine</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isLoggedIn ? (
            <>
              <button onClick={() => setShowAuth(true)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", padding: "7px 10px" }}>Sign In</button>
              <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13 }}>Try Free</button>
            </>
          ) : (
            <>
              {!isPremium && (
                <button onClick={() => setShowUpgrade(true)} style={{ background: "linear-gradient(135deg,rgba(234,179,8,0.2),rgba(251,191,36,0.1))", border: "1px solid rgba(234,179,8,0.3)", color: "#fbbf24", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontFamily: "var(--font-body)", letterSpacing: "0.04em" }}>⚡ UPGRADE</button>
              )}
              {isPremium && <span style={{ fontSize: 11, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", padding: "4px 10px", borderRadius: 20 }}>Premium</span>}
              <div style={{ position: "relative" }}>
                <button onClick={() => setMenuOpen(m => !m)} style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a5f,#0f2040)", border: "1px solid rgba(59,130,246,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#93c5fd", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-body)" }}>
                  {user?.email?.[0]?.toUpperCase() || "G"}
                </button>
                {menuOpen && (
                  <div style={{ position: "absolute", right: 0, top: 40, minWidth: 160, background: "rgba(8,20,40,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(56,139,253,0.2)", borderRadius: 12, padding: 6, zIndex: 100 }}>
                    {user && <p style={{ fontSize: 11, color: "var(--text-muted)", padding: "6px 10px", margin: 0 }}>{user.email}</p>}
                    {isGuest && <p style={{ fontSize: 11, color: "var(--text-muted)", padding: "6px 10px", margin: 0 }}>Guest session</p>}
                    {isGuest && <button onClick={() => { setMenuOpen(false); setShowAuth(true); }} style={{ width: "100%", textAlign: "left", padding: "8px 10px", background: "none", border: "none", color: "#60a5fa", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", borderRadius: 8 }}>Create Account</button>}
                    <button onClick={() => { setMenuOpen(false); logout(); }} style={{ width: "100%", textAlign: "left", padding: "8px 10px", background: "none", border: "none", color: "#f87171", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", borderRadius: 8 }}>
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
