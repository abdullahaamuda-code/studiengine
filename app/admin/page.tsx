"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import StatsTab from "@/components/admin/StatsTab";
import UsersTab from "@/components/admin/UsersTab";
import EmailTab from "@/components/admin/EmailTab";
import FeedbackTab from "@/components/admin/FeedbackTab";
import AIAssistant from "@/components/admin/AIAssistant";
import SessionsTab from "@/components/admin/SessionsTab";

const TABS = [
  { id: "stats",    label: "Analytics",   icon: "◈" },
  { id: "users",    label: "Users",        icon: "◉" },
  { id: "sessions", label: "CBT Logs",     icon: "✦" },
  { id: "email",    label: "Email",        icon: "⊞" },
  { id: "feedback", label: "Feedback",     icon: "◎" },
  { id: "ai",       label: "AI Assistant", icon: "⚡" },
];

function StudiengineLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: 10, display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id="adlb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d0f1a" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="adls" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="18" fill="url(#adlb)" />
      <rect x="30" y="12" width="34" height="7" rx="3.5" fill="#1e2440" opacity="0.9" />
      <rect x="14" y="23" width="50" height="7" rx="3.5" fill="#1e2440" opacity="0.75" />
      <rect x="14" y="34" width="52" height="7" rx="3.5" fill="#1e2440" opacity="0.6" />
      <rect x="14" y="45" width="50" height="7" rx="3.5" fill="#1e2440" opacity="0.45" />
      <rect x="14" y="56" width="34" height="7" rx="3.5" fill="#1e2440" opacity="0.3" />
      <path d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60"
        fill="none" stroke="url(#adls)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("stats");
  const [authed, setAuthed] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/"); return; }
    if (adminUid && user.uid !== adminUid) { router.replace("/"); return; }
    setAuthed(true);
  }, [user, loading, adminUid, router]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading || !authed) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080c14",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 36, height: 36,
          border: "2px solid rgba(129,140,248,0.15)",
          borderTopColor: "#818cf8",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <span style={{ fontSize: 13, color: "#334155", fontFamily: "var(--font-body)" }}>Verifying access…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c14",
      fontFamily: "var(--font-body)",
      color: "#f1f5f9",
      overflowX: "hidden",
    }}>
      <style>{`
        /* ── Keyframes ── */
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes shimmer-x    { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes badge-in     { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:none} }
        @keyframes tab-slide-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar       { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(129,140,248,0.25); border-radius: 99px; }

        /* ── Nav shimmer border ── */
        .nav-scrolled::after {
          content:"";
          position:absolute; left:0; right:0; bottom:-1px; height:1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(56,189,248,0.3), transparent);
        }

        /* ── Tab button ── */
        .admin-tab {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          color: #475569;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          position: relative;
        }
        .admin-tab:hover {
          color: #94a3b8;
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.06);
        }
        .admin-tab.active {
          color: #a5b4fc;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(56,189,248,0.08));
          border-color: rgba(99,102,241,0.3);
          font-weight: 700;
        }
        .admin-tab .tab-icon {
          font-size: 14px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .admin-tab.active .tab-icon { opacity: 1; color: #818cf8; }

        /* ── CTA button ── */
        .btn-cta {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #4338ca 100%);
          border: 1px solid rgba(129,140,248,0.4);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .btn-cta::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.15),transparent);
          opacity:0; transition:opacity 0.2s;
        }
        .btn-cta:hover::before { opacity:1; }
        .btn-cta:hover { transform:translateY(-1px); box-shadow:0 0 0 1px rgba(129,140,248,0.4), 0 6px 24px rgba(99,102,241,0.4); }

        /* ── Ghost button ── */
        .btn-ghost {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          color: #64748b;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover { background:rgba(255,255,255,0.07); border-color:rgba(255,255,255,0.14); color:#94a3b8; }

        /* ── Content panel animation ── */
        .tab-content { animation: tab-slide-in 0.35s cubic-bezier(0.4,0,0.2,1); }

        /* ── Section label ── */
        .section-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: #6366f1; margin-bottom: 6px;
        }

        /* ── Card ── */
        .admin-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          transition: border-color 0.2s;
        }
        .admin-card:hover { border-color: rgba(255,255,255,0.11); }

        /* ── Mobile ── */
        @media (max-width: 680px) {
          .admin-tabs-bar { padding: 0 12px !important; gap: 4px !important; }
          .admin-tab      { padding: 8px 12px !important; font-size: 12px !important; }
          .admin-tab .tab-label { display: none; }
          .admin-tab      { padding: 9px 10px !important; }
          .content-pad    { padding: 16px 12px !important; }
          .header-email   { display: none !important; }
        }
      `}</style>

      {/* ── Fixed background effects ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Radial glow blobs */}
        <div style={{ position:"absolute", top:"-8%", left:"-4%", width:640, height:640, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", bottom:"-4%", right:"-4%", width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 65%)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", top:"50%", left:"40%", width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 65%)", filter:"blur(80px)" }} />
        {/* Grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize:"60px 60px", opacity:0.6 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* ── Navbar ── */}
        <nav
          className={navScrolled ? "nav-scrolled" : ""}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            background: navScrolled ? "rgba(8,12,20,0.92)" : "rgba(8,12,20,0.7)",
            backdropFilter: "blur(24px)",
            borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.03)",
            transition: "all 0.3s ease",
            height: 58,
            display: "flex", alignItems: "center",
          }}
        >
          <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Left: logo + wordmark + admin badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <StudiengineLogo size={28} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 16, fontWeight: 800, fontFamily: "var(--font-display)",
                  letterSpacing: "-0.02em",
                  background: "linear-gradient(135deg,#f1f5f9,#818cf8)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Studiengine</span>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.28)",
                  borderRadius: 99, padding: "2px 10px",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  color: "#818cf8", textTransform: "uppercase",
                  animation: "badge-in 0.5s ease",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 6px rgba(129,140,248,0.9)" }} />
                  Admin
                </div>
              </div>
            </div>

            {/* Right: email + actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="header-email" style={{ fontSize: 11, color: "#334155" }}>{user?.email}</span>
              {!adminUid && (
                <button
                  className="btn-ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.uid || "");
                    alert("UID copied! Add as NEXT_PUBLIC_ADMIN_UID in .env.local");
                  }}
                  style={{ fontSize: 11, padding: "5px 11px", borderRadius: 8,
                    background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}
                >
                  Copy UID
                </button>
              )}
              <button
                className="btn-ghost"
                onClick={() => router.push("/")}
                style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8 }}
              >
                ← App
              </button>
            </div>
          </div>
        </nav>

        {/* ── Tabs bar ── */}
        <div style={{
          position: "sticky", top: 58, zIndex: 90,
          background: "rgba(8,12,20,0.88)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div
            className="admin-tabs-bar"
            style={{
              maxWidth: 1200, margin: "0 auto",
              padding: "0 20px", display: "flex", gap: 4,
              overflowX: "auto", height: 52, alignItems: "center",
            }}
          >
            {TABS.map(t => (
              <button
                key={t.id}
                className={`admin-tab${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Page header ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "32px 20px 0" }}>
          <div style={{ marginBottom: 28 }}>
            <div className="section-label">Admin Dashboard</div>
            <h1 style={{
              fontSize: "clamp(22px, 3.5vw, 32px)",
              fontWeight: 800, fontFamily: "var(--font-display)",
              letterSpacing: "-0.025em", margin: "0 0 6px",
              background: "linear-gradient(135deg, #f1f5f9 0%, #818cf8 50%, #38bdf8 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "shimmer-x 6s linear infinite",
            }}>
              {activeTab.icon} {activeTab.label}
            </h1>
            <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>
              {tab === "stats"    && "Platform analytics and usage overview"}
              {tab === "users"    && "Manage users, premium access and limits"}
              {tab === "sessions" && "View all CBT sessions and quiz logs"}
              {tab === "email"    && "Send emails to your users via Brevo"}
              {tab === "feedback" && "Review user feedback and reports"}
              {tab === "ai"       && "AI-powered admin assistant"}
            </p>
          </div>

          {/* Thin accent line */}
          <div style={{ height: 1, background: "linear-gradient(90deg, rgba(99,102,241,0.4), rgba(56,189,248,0.2), transparent)", marginBottom: 28, borderRadius: 99 }} />
        </div>

        {/* ── Tab content ── */}
        <div className="content-pad" style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 20px 60px", flex: 1 }}>
          <div className="tab-content" key={tab}>
            {tab === "stats"    && <StatsTab />}
            {tab === "users"    && <UsersTab />}
            {tab === "sessions" && <SessionsTab />}
            {tab === "email"    && <EmailTab />}
            {tab === "feedback" && <FeedbackTab />}
            {tab === "ai"       && <AIAssistant />}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.04)",
          padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StudiengineLogo size={18} />
            <span style={{ fontSize: 12, color: "#1e293b", fontWeight: 600, fontFamily: "var(--font-display)" }}>Studiengine</span>
          </div>
          <p style={{ fontSize: 11, color: "#1e293b", margin: 0 }}>Admin · {user?.email}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.7)" }} />
            <span style={{ fontSize: 11, color: "#1e293b" }}>Live</span>
          </div>
        </div>

      </div>
    </div>
  );
}
