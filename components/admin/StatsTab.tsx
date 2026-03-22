"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Stats {
  totalUsers: number; guestUsers: number; registeredUsers: number;
  premiumUsers: number; totalCBTs: number; todayCBTs: number; totalFeedback: number;
}

export default function StatsTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/stats", { headers: { "x-admin-uid": user.uid } })
      .then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); setStats(d); })
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p style={{ color: "#475569", fontSize: 13 }}>Loading analytics...</p>;
  if (error) return <p style={{ color: "#f87171", fontSize: 13 }}>⚠️ {error}</p>;
  if (!stats) return null;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, color: "#60a5fa", icon: "👥" },
    { label: "Registered", value: stats.registeredUsers, color: "#4ade80", icon: "🔐" },
    { label: "Guests", value: stats.guestUsers, color: "#94a3b8", icon: "👤" },
    { label: "Premium", value: stats.premiumUsers, color: "#fbbf24", icon: "⚡" },
    { label: "CBTs Today", value: stats.todayCBTs, color: "#22d3ee", icon: "📝" },
    { label: "Total CBTs", value: stats.totalCBTs, color: "#a78bfa", icon: "🏆" },
    { label: "Feedback", value: stats.totalFeedback, color: "#fb923c", icon: "💬" },
  ];

  const regPct = stats.totalUsers > 0 ? Math.round((stats.registeredUsers / stats.totalUsers) * 100) : 0;
  const premPct = stats.registeredUsers > 0 ? Math.round((stats.premiumUsers / stats.registeredUsers) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 14, padding: "16px 14px" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{c.icon}</div>
            <p style={{ fontSize: 11, color: "#475569", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</p>
            <p style={{ fontSize: 30, fontWeight: 800, color: c.color, margin: 0, lineHeight: 1 }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 14, padding: "18px 20px" }}>
        <p style={{ fontSize: 12, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Conversion Funnel</p>
        {[
          { label: "Guest → Registered", pct: regPct, color: "#4ade80" },
          { label: "Free → Premium", pct: premPct, color: "#fbbf24" },
        ].map(r => (
          <div key={r.label} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{r.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.pct}%</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
              <div style={{ height: 6, background: r.color, borderRadius: 3, width: `${r.pct}%`, transition: "width 1s ease", opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
