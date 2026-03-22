"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Stats {
  totalUsers: number;
  guestUsers: number;
  registeredUsers: number;
  premiumUsers: number;
  totalCBTs: number;
  todayCBTs: number;
  totalFeedback: number;
}

export default function StatsTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { "x-admin-uid": user?.uid || "" }
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setStats(data);
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    }
    if (user) load();
  }, [user]);

  if (loading) return <p style={{ color: "#64748b", fontSize: 13 }}>Loading stats...</p>;
  if (error) return <p style={{ color: "#f87171", fontSize: 13 }}>⚠️ {error} — make sure Firebase Admin is configured</p>;
  if (!stats) return null;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, color: "#60a5fa" },
    { label: "Registered", value: stats.registeredUsers, color: "#4ade80" },
    { label: "Guests", value: stats.guestUsers, color: "#94a3b8" },
    { label: "Premium", value: stats.premiumUsers, color: "#fbbf24" },
    { label: "CBTs Today", value: stats.todayCBTs, color: "#22d3ee" },
    { label: "Total CBTs", value: stats.totalCBTs, color: "#a78bfa" },
    { label: "Feedback", value: stats.totalFeedback, color: "#fb923c" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 12, padding: "16px 14px" }}>
            <p style={{ fontSize: 11, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: c.color, margin: 0 }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Conversion</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Guest → Registered</span>
              <span style={{ fontSize: 12, color: "#4ade80" }}>
                {stats.totalUsers > 0 ? Math.round((stats.registeredUsers / stats.totalUsers) * 100) : 0}%
              </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
              <div style={{ height: 4, background: "#4ade80", borderRadius: 2, width: `${stats.totalUsers > 0 ? (stats.registeredUsers / stats.totalUsers) * 100 : 0}%` }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Free → Premium</span>
              <span style={{ fontSize: 12, color: "#fbbf24" }}>
                {stats.registeredUsers > 0 ? Math.round((stats.premiumUsers / stats.registeredUsers) * 100) : 0}%
              </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
              <div style={{ height: 4, background: "#fbbf24", borderRadius: 2, width: `${stats.registeredUsers > 0 ? (stats.premiumUsers / stats.registeredUsers) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
