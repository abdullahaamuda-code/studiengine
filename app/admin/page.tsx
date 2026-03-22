"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import StatsTab from "@/components/admin/StatsTab";
import UsersTab from "@/components/admin/UsersTab";
import EmailTab from "@/components/admin/EmailTab";
import FeedbackTab from "@/components/admin/FeedbackTab";
import AIAssistant from "@/components/admin/AIAssistant";

const TABS = [
  { id: "stats", label: "📊 Analytics" },
  { id: "users", label: "👥 Users" },
  { id: "email", label: "📧 Email" },
  { id: "feedback", label: "💬 Feedback" },
  { id: "ai", label: "🤖 AI Assistant" },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("stats");
  const [authed, setAuthed] = useState(false);
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/"); return; }
    if (adminUid && user.uid !== adminUid) { router.replace("/"); return; }
    setAuthed(true);
  }, [user, loading, adminUid]);

  if (loading || !authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#03080f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "#60a5fa", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#03080f", fontFamily: "'DM Sans', sans-serif", color: "#e8f0fe" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: "rgba(8,20,40,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(56,139,253,0.15)", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ab" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0a1628"/><stop offset="100%" stopColor="#0c1a2e"/></linearGradient>
                <linearGradient id="as" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#22d3ee"/></linearGradient>
              </defs>
              <rect width="80" height="80" rx="16" fill="url(#ab)"/>
              <rect x="30" y="12" width="34" height="8" rx="4" fill="#1e3a5f" opacity="0.8"/>
              <rect x="14" y="24" width="50" height="8" rx="4" fill="#1e3a5f" opacity="0.7"/>
              <rect x="14" y="36" width="52" height="8" rx="4" fill="#1e3a5f" opacity="0.6"/>
              <rect x="14" y="48" width="50" height="8" rx="4" fill="#1e3a5f" opacity="0.5"/>
              <rect x="14" y="60" width="34" height="8" rx="4" fill="#1e3a5f" opacity="0.4"/>
              <path d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60" fill="none" stroke="url(#as)" strokeWidth="6.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Studiengine Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "#64748b" }}>{user?.email}</span>
          {/* Show UID for first-time setup */}
          {!adminUid && (
            <button onClick={() => { navigator.clipboard.writeText(user?.uid || ""); alert("UID copied! Add as NEXT_PUBLIC_ADMIN_UID in .env.local"); }}
              style={{ fontSize: 11, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>
              Copy UID
            </button>
          )}
          <button onClick={() => router.push("/")} style={{ fontSize: 12, background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", padding: "5px 12px", borderRadius: 6, cursor: "pointer" }}>
            ← App
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "9px 16px", borderRadius: 10, border: "1px solid",
              borderColor: tab === t.id ? "rgba(59,130,246,0.5)" : "rgba(56,139,253,0.15)",
              background: tab === t.id ? "linear-gradient(135deg,rgba(37,99,235,0.3),rgba(8,145,178,0.2))" : "rgba(8,20,40,0.5)",
              color: tab === t.id ? "#93c5fd" : "#64748b",
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "stats" && <StatsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "email" && <EmailTab />}
        {tab === "feedback" && <FeedbackTab />}
        {tab === "ai" && <AIAssistant />}
      </div>
    </div>
  );
}
