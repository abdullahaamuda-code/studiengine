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
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: size * 0.22, display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="abg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d0f1a" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="astr" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="60%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="aln" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e2440" />
          <stop offset="100%" stopColor="#252b50" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#abg)" />
      <rect
        x="1"
        y="1"
        width="510"
        height="510"
        rx="111"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="2"
      />
      <rect
        x="160"
        y="96"
        width="260"
        height="52"
        rx="26"
        fill="url(#aln)"
        opacity="0.9"
      />
      <rect
        x="96"
        y="166"
        width="320"
        height="52"
        rx="26"
        fill="url(#aln)"
        opacity="0.78"
      />
      <rect
        x="96"
        y="236"
        width="330"
        height="52"
        rx="26"
        fill="url(#aln)"
        opacity="0.62"
      />
      <rect
        x="96"
        y="306"
        width="320"
        height="52"
        rx="26"
        fill="url(#aln)"
        opacity="0.46"
      />
      <rect
        x="96"
        y="376"
        width="220"
        height="52"
        rx="26"
        fill="url(#aln)"
        opacity="0.3"
      />
      <path
        d="M330 130 C330 130 330 86 256 86 C182 86 158 130 158 174 C158 218 194 238 256 256 C318 274 354 294 354 338 C354 382 330 426 256 426 C182 426 158 382 158 382"
        fill="none"
        stroke="url(#astr)"
        strokeWidth="42"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Premium crown pill (text) ── */
function PremiumBadge() {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background:
          "linear-gradient(135deg,rgba(251,191,36,0.15),rgba(245,158,11,0.08))",
        border: "1px solid rgba(251,191,36,0.35)",
        borderRadius: 99,
        padding: "3px 10px 3px 7px",
        boxShadow: "0 0 12px rgba(251,191,36,0.15)",
      }}
    >
      <span style={{ fontSize: 11 }}>👑</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#fbbf24",
          letterSpacing: "0.03em",
        }}
      >
        Premium
      </span>
    </div>
  );
}

/* ── Avatar with responsive crown:
      - mobile: floating crown above head
      - desktop: small corner badge ── */
function Avatar({ letter, isPremium }: { letter: string; isPremium: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: 34,
        height: 34,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: isPremium
            ? "linear-gradient(135deg,#92400e,#b45309)"
            : "linear-gradient(135deg,#1e1b4b,#312e81)",
          border: isPremium
            ? "2px solid rgba(251,191,36,0.7)"
            : "1px solid rgba(99,102,241,0.35)",
          boxShadow: isPremium
            ? "0 0 16px rgba(251,191,36,0.35), inset 0 1px 0 rgba(255,255,255,0.1)"
            : "0 0 10px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isPremium ? "#fde68a" : "#a5b4fc",
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "var(--font-display)",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          userSelect: "none",
          position: "relative",
        }}
      >
        {letter}

        {isPremium && (
          <span
            className="avatar-crown-floating"
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
      </div>

      {isPremium && (
        <span
          className="avatar-crown-corner"
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            fontSize: 13,
            filter: "drop-shadow(0 0 4px rgba(0,0,0,0.6))",
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          👑
        </span>
      )}
    </div>
  );
}

/* ── Menu item ── */
function MenuItem({
  onClick,
  icon,
  label,
  color = "#cbd5e1",
  danger = false,
  badge,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  color?: string;
  danger?: boolean;
  badge?: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "9px 12px",
        background: hov
          ? danger
            ? "rgba(239,68,68,0.06)"
            : "rgba(255,255,255,0.04)"
          : "transparent",
        border: "none",
        borderRadius: 9,
        color: danger ? "#f87171" : color,
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        display: "flex",
        alignItems: "center",
        gap: 9,
        transition: "background 0.15s",
      }}
    >
      <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge}
    </button>
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
  const [authMode, setAuthMode] = useState<"signin" | "signup">(
    defaultAuthMode || "signup"
  );
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = !!user || isGuest;

  /* auto-open auth */
  useEffect(() => {
    if (!isLoggedIn && defaultAuthMode) {
      setAuthMode(defaultAuthMode);
      setShowAuth(true);
    }
  }, [defaultAuthMode, isLoggedIn]);

  /* close menu on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* close menu on Escape */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  function openAuth(mode: "signin" | "signup") {
    setAuthMode(mode);
    setShowAuth(true);
  }

  async function handleLogout() {
    await logout();
    router.replace("/landing");
  }

  const avatarLetter = user?.email?.[0]?.toUpperCase() || "G";

  return (
    <>
      <style>{`
        @keyframes menu-in { from{opacity:0;transform:translateY(-6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .nav-avatar-wrap:hover > div { transform: scale(1.06); }
        .upgrade-pill:hover { box-shadow: 0 0 20px rgba(251,191,36,0.3) !important; }
      `}</style>

      {/* ══════════════ NAV BAR ══════════════ */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(8,12,20,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Bottom glow accent */}
        <div
          style={{
            position: "absolute",
            left: "15%",
            right: "15%",
            bottom: 0,
            height: 1,
            background:
              "linear-gradient(90deg,transparent,rgba(129,140,248,0.35),rgba(56,189,248,0.25),transparent)",
            pointerEvents: "none",
          }}
        />

        {/* ── Logo ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <StudiengineLogo size={27} />
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg,#f1f5f9,#818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Studiengine
          </span>
        </div>

        {/* ── Right side ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* ── LOGGED OUT ── */}
          {!isLoggedIn && (
            <>
              <button
                onClick={() => router.push("/auth?mode=signin")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  padding: "6px 14px",
                  borderRadius: 8,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.16)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#94a3b8";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#64748b";
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/auth?mode=signup")}
                style={{
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  border: "1px solid rgba(129,140,248,0.4)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  padding: "6px 16px",
                  borderRadius: 8,
                  boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 4px 20px rgba(99,102,241,0.5)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 2px 12px rgba(99,102,241,0.3)";
                }}
              >
                Sign Up
              </button>
            </>
          )}

          {/* ── LOGGED IN ── */}
          {isLoggedIn && (
            <>
              {/* Upgrade pill — only for non-premium */}
              {!isPremium && (
                <button
                  className="upgrade-pill"
                  onClick={() => setShowUpgrade(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background:
                      "linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.06))",
                    border: "1px solid rgba(251,191,36,0.28)",
                    color: "#fbbf24",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "5px 12px",
                    borderRadius: 99,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.02em",
                    transition: "all 0.2s",
                    boxShadow: "0 0 12px rgba(251,191,36,0.1)",
                  }}
                >
                  <span style={{ fontSize: 12 }}>⚡</span> Upgrade
                </button>
              )}

              {/* Premium badge — visible on desktop */}
              {isPremium && (
                <div className="hide-mobile">
                  <PremiumBadge />
                </div>
              )}

              {/* Avatar + dropdown */}
              <div
                ref={menuRef}
                style={{ position: "relative" }}
                className="nav-avatar-wrap"
              >
                <div onClick={() => setMenuOpen(m => !m)}>
                  <Avatar letter={avatarLetter} isPremium={isPremium} />
                </div>

                {/* ── Dropdown menu ── */}
                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 44,
                      minWidth: 220,
                      background: "rgba(10,13,22,0.98)",
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: 16,
                      padding: "6px",
                      zIndex: 100,
                      boxShadow:
                        "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset",
                      animation:
                        "menu-in 0.2s cubic-bezier(0.4,0,0.2,1) forwards",
                    }}
                  >
                    {/* Top glow */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "20%",
                        right: "20%",
                        height: 1,
                        background:
                          "linear-gradient(90deg,transparent,rgba(129,140,248,0.3),transparent)",
                      }}
                    />

                    {/* ── User info header ── */}
                    <div
                      style={{
                        padding: "10px 12px 12px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <Avatar letter={avatarLetter} isPremium={isPremium} />
                        <div style={{ overflow: "hidden" }}>
                          {user && (
                            <p
                              style={{
                                fontSize: 12,
                                color: "#a5b4fc",
                                margin: "0 0 2px",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 150,
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
                                margin: "0 0 2px",
                              }}
                            >
                              Guest session
                            </p>
                          )}
                          {/* Plan badge */}
                          {isPremium ? (
                            <PremiumBadge />
                          ) : (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "rgba(255,255,255,0.04)",
                                border:
                                  "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 99,
                                padding: "2px 8px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "#475569",
                                }}
                              >
                                {isGuest ? "👤 Guest" : "Free Plan"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── Menu actions ── */}
                    {!isPremium && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setShowUpgrade(true);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          marginBottom: 4,
                          background:
                            "linear-gradient(135deg,rgba(251,191,36,0.1),rgba(245,158,11,0.05))",
                          border:
                            "1px solid rgba(251,191,36,0.2)",
                          borderRadius: 10,
                          color: "#fbbf24",
                          fontSize: 13,
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            "linear-gradient(135deg,rgba(251,191,36,0.16),rgba(245,158,11,0.09))";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            "linear-gradient(135deg,rgba(251,191,36,0.1),rgba(245,158,11,0.05))";
                        }}
                      >
                        <span>⚡</span> Upgrade to Premium
                      </button>
                    )}

                    {isGuest && (
                      <MenuItem
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/auth?mode=signup");
                        }}
                        icon="✦"
                        label="Create Account"
                        color="#818cf8"
                      />
                    )}

                    <MenuItem
                      onClick={() => {
                        setMenuOpen(false);
                        setShowHistory(true);
                      }}
                      icon="📚"
                      label="CBT History"
                      color={isPremium ? "#cbd5e1" : "#475569"}
                      badge={
                        !isPremium ? (
                          <span
                            style={{
                              fontSize: 10,
                              background:
                                "rgba(251,191,36,0.12)",
                              border:
                                "1px solid rgba(251,191,36,0.25)",
                              color: "#fbbf24",
                              borderRadius: 99,
                              padding: "1px 6px",
                            }}
                          >
                            PRO
                          </span>
                        ) : undefined
                      }
                    />

                    <div
                      style={{
                        height: 1,
                        background: "rgba(255,255,255,0.05)",
                        margin: "4px 0",
                      }}
                    />

                    <MenuItem
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      icon={isGuest ? "⬡" : "→"}
                      label={isGuest ? "Exit Guest Mode" : "Sign Out"}
                      danger
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* ── Modals ── */}
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        initialMode={authMode}
      />
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </>
  );
}
