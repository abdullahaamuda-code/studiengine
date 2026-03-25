"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";
import UpgradeModal from "./UpgradeModal";
import HistoryModal from "./HistoryModal";

function StudiengineLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: 7, display: "block" }}
    >
      <defs>
        <linearGradient id="nb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a1628" />
          <stop offset="100%" stopColor="#0c1a2e" />
        </linearGradient>
        <linearGradient id="ns" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="16" fill="url(#nb)" />
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
        stroke="url(#ns)"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Navbar({
  defaultAuthMode,
}: {
  defaultAuthMode?: "signin" | "signup";
}) {
  const router = useRouter();
  const { user, isGuest, isPremium, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | undefined>(
    defaultAuthMode
  );
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = !!user || isGuest;

  // Auto-open auth if defaultAuthMode passed and user not logged in
  useEffect(() => {
    if (defaultAuthMode && !isLoggedIn) {
      setAuthMode(defaultAuthMode);
      setShowAuth(true);
    }
  }, [defaultAuthMode, isLoggedIn]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function openAuth(mode: "signin" | "signup") {
    setAuthMode(mode);
    setShowAuth(true);
  }

  async function handleLogout() {
    await logout();
    router.replace("/landing");
  }

  return (
    <>
      <style>{`
        .nav-glow::after {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: -1px;
          height: 2px;
          background: linear-gradient(90deg, rgba(56,139,253,0), rgba(56,139,253,0.7), rgba(8,145,178,0.7), rgba(56,139,253,0));
          box-shadow: 0 0 12px rgba(37,99,235,0.5);
          pointer-events: none;
        }
        .nav-avatar { transition: box-shadow 0.3s, transform 0.2s; }
        .nav-avatar:hover { transform: scale(1.05); }
        .menu-item { transition: background 0.15s; }
        .menu-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      <nav
        className="nav-glow"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(3,8,15,0.9)",
          backdropFilter: "blur(20px)",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          boxShadow: "0 10px 25px rgba(15,23,42,0.6)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <StudiengineLogo size={28} />
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              background: "linear-gradient(135deg,#60a5fa,#22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Studiengine
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isLoggedIn ? (
            <>
              <button
                onClick={() => openAuth("signin")}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#7896b4",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  padding: "6px 14px",
                  borderRadius: 8,
                  transition: "border-color 0.2s",
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth("signup")}
                style={{
                  background: "linear-gradient(135deg,#2563eb,#0891b2)",
                  border: "none",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  padding: "6px 16px",
                  borderRadius: 8,
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              {!isPremium && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  style={{
                    background:
                      "linear-gradient(135deg,rgba(234,179,8,0.15),rgba(251,191,36,0.08))",
                    border: "1px solid rgba(234,179,8,0.25)",
                    color: "#fbbf24",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "5px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.03em",
                    transition: "all 0.2s",
                  }}
                >
                  ⚡ Upgrade
                </button>
              )}

              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  className="nav-avatar"
                  onClick={() => setMenuOpen((m) => !m)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: isPremium
                      ? "linear-gradient(135deg,#78350f,#b45309)"
                      : "linear-gradient(135deg,#1e3a5f,#0f2040)",
                    border: isPremium
                      ? "2px solid #fbbf24"
                      : "1px solid rgba(59,130,246,0.25)",
                    boxShadow: isPremium
                      ? "0 0 14px rgba(251,191,36,0.5)"
                      : "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isPremium ? "#fde68a" : "#93c5fd",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "var(--font-body)",
                    position: "relative",
                  }}
                >
                  {user?.email?.[0]?.toUpperCase() || "G"}
                  {isPremium && (
                    <span
                      style={{
                        position: "absolute",
                        top: -9,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: 12,
                        filter: "drop-shadow(0 0 6px #fbbf24)",
                        pointerEvents: "none",
                        lineHeight: 1,
                      }}
                    >
                      👑
                    </span>
                  )}
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 42,
                      minWidth: 210,
                      background: "rgba(6,12,28,0.98)",
                      backdropFilter: "blur(24px)",
                      border: "1px solid rgba(56,139,253,0.15)",
                      borderRadius: 14,
                      padding: "6px",
                      zIndex: 100,
                      boxShadow: "0 12px 50px rgba(0,0,0,0.6)",
                    }}
                  >
                    {/* User info */}
                    <div
                      style={{
                        padding: "10px 12px 10px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        marginBottom: 4,
                      }}
                    >
                      {user && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#60a5fa",
                            margin: "0 0 4px",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.email}
                        </p>
                      )}
                      {isGuest && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#475569",
                            margin: "0 0 4px",
                          }}
                        >
                          Guest session
                        </p>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 20,
                          display: "inline-block",
                          background: isPremium
                            ? "rgba(251,191,36,0.12)"
                            : "rgba(30,41,59,0.6)",
                          color: isPremium ? "#fbbf24" : "#475569",
                          border: `1px solid ${
                            isPremium
                              ? "rgba(251,191,36,0.25)"
                              : "rgba(255,255,255,0.06)"
                          }`,
                        }}
                      >
                        {isPremium
                          ? "⚡ Premium"
                          : isGuest
                          ? "👤 Guest"
                          : "Free Plan"}
                      </span>
                    </div>

                    {!isPremium && (
                      <button
                        className="menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          setShowUpgrade(true);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "9px 12px",
                          marginBottom: 2,
                          background:
                            "linear-gradient(135deg,rgba(234,179,8,0.1),rgba(251,191,36,0.05))",
                          border: "1px solid rgba(234,179,8,0.15)",
                          borderRadius: 10,
                          color: "#fbbf24",
                          fontSize: 12,
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                        }}
                      >
                        ⚡ Upgrade to Premium
                      </button>
                    )}

                    {isGuest && (
                      <button
                        className="menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          openAuth("signup");
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "9px 12px",
                          background: "none",
                          border: "none",
                          color: "#60a5fa",
                          fontSize: 13,
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          borderRadius: 8,
                          display: "block",
                        }}
                      >
                        Create Account →
                      </button>
                    )}

                    <button
                      className="menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowHistory(true);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 12px",
                        background: "none",
                        border: "none",
                        color: isPremium ? "#93c5fd" : "#475569",
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      📚 CBT History{" "}
                      {!isPremium && (
                        <span style={{ fontSize: 10, color: "#fbbf24" }}>⚡</span>
                      )}
                    </button>

                    <button
                      className="menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 12px",
                        background: "none",
                        border: "none",
                        color: "#f87171",
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        borderRadius: 8,
                      }}
                    >
                      {isGuest ? "Exit Guest Mode" : "Sign Out"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          initialMode={authMode || "signup"}
        />
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </>
  );
}
