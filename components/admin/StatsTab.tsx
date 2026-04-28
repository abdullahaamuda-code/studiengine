"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Stats {
  totalUsers: number;
  guestUsers: number;
  registeredUsers: number;
  premiumUsers: number;
  todayCBTs: number;
  totalFeedback: number;
}

export default function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [usageSnap, feedbackSnap] = await Promise.all([
          getDocs(collection(db, "usage")),
          getDocs(collection(db, "feedback")),
        ]);
        const users = usageSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        const totalUsers = users.length;
        const guestUsers = users.filter(u => u.id.startsWith("guest_")).length;
        setStats({
          totalUsers,
          guestUsers,
          registeredUsers: totalUsers - guestUsers,
          premiumUsers: users.filter(u => u.isPremium).length,
          todayCBTs: users.reduce((s, u) => s + (u.quizCount || 0), 0),
          totalFeedback: feedbackSnap.size,
        });
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "32px 0" }}>
      <div style={{ width: 18, height: 18, border: "2px solid rgba(129,140,248,0.15)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#334155", fontSize: 13 }}>Loading analytics…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#f87171", fontSize: 13 }}>
      ⚠️ {error}
    </div>
  );

  if (!stats) return null;

  const regPct  = stats.totalUsers      > 0 ? Math.round((stats.registeredUsers / stats.totalUsers)      * 100) : 0;
  const premPct = stats.registeredUsers > 0 ? Math.round((stats.premiumUsers    / stats.registeredUsers) * 100) : 0;
  const guestPct = stats.totalUsers     > 0 ? Math.round((stats.guestUsers      / stats.totalUsers)      * 100) : 0;

  const CARDS = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      sub: "all time",
      icon: "◉",
      color: "#818cf8",
      glow: "rgba(129,140,248,0.12)",
      border: "rgba(129,140,248,0.2)",
    },
    {
      label: "Registered",
      value: stats.registeredUsers,
      sub: `${regPct}% of total`,
      icon: "✦",
      color: "#34d399",
      glow: "rgba(52,211,153,0.1)",
      border: "rgba(52,211,153,0.18)",
    },
    {
      label: "Guests",
      value: stats.guestUsers,
      sub: `${guestPct}% of total`,
      icon: "◈",
      color: "#94a3b8",
      glow: "rgba(148,163,184,0.07)",
      border: "rgba(148,163,184,0.14)",
    },
    {
      label: "Premium",
      value: stats.premiumUsers,
      sub: `${premPct}% of registered`,
      icon: "⚡",
      color: "#fbbf24",
      glow: "rgba(251,191,36,0.1)",
      border: "rgba(251,191,36,0.2)",
    },
    {
      label: "CBTs Today",
      value: stats.todayCBTs,
      sub: "resets daily",
      icon: "⊞",
      color: "#38bdf8",
      glow: "rgba(56,189,248,0.1)",
      border: "rgba(56,189,248,0.18)",
    },
    {
      label: "Feedback",
      value: stats.totalFeedback,
      sub: "submissions",
      icon: "◎",
      color: "#fb923c",
      glow: "rgba(251,146,60,0.1)",
      border: "rgba(251,146,60,0.18)",
    },
  ];

  const FUNNEL = [
    { label: "Guest → Registered", pct: regPct,  color: "#34d399", track: "rgba(52,211,153,0.08)"  },
    { label: "Free → Premium",     pct: premPct, color: "#fbbf24", track: "rgba(251,191,36,0.08)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes bar-grow   { from { width: 0% } to { width: var(--w); } }
        @keyframes count-in   { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .stat-card {
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 20px 18px;
          transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), border-color 0.2s;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .stat-card:hover {
          transform: translateY(-3px);
        }
        .stat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s;
          background: radial-gradient(circle at 30% 30%, var(--glow) 0%, transparent 70%);
        }
        .stat-card:hover::before { opacity: 1; }

        .stat-value {
          font-size: 36px;
          font-weight: 800;
          font-family: var(--font-display);
          letter-spacing: -0.03em;
          line-height: 1;
          margin: 0 0 4px;
          animation: count-in 0.5s ease both;
        }

        .funnel-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 22px 24px;
        }

        .bar-fill {
          height: 100%;
          border-radius: 99px;
          animation: bar-grow 1.2s cubic-bezier(0.4,0,0.2,1) both;
        }

        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ── Stat cards grid ── */}
      <div
        className="stats-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}
      >
        {CARDS.map((c, i) => (
          <div
            key={c.label}
            className="stat-card"
            style={{
              border: `1px solid ${c.border}`,
              "--glow": c.glow,
              animationDelay: `${i * 0.07}s`,
            } as React.CSSProperties}
          >
            {/* Icon */}
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: c.glow,
              border: `1px solid ${c.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, color: c.color, fontWeight: 700,
              marginBottom: 14,
            }}>
              {c.icon}
            </div>

            {/* Value */}
            <p
              className="stat-value"
              style={{ color: c.color, animationDelay: `${i * 0.07 + 0.1}s` }}
            >
              {c.value}
            </p>

            {/* Label */}
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
              {c.label}
            </p>

            {/* Sub */}
            <p style={{ fontSize: 11, color: "#334155", margin: 0 }}>
              {c.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Conversion funnel ── */}
      <div className="funnel-card">
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1", margin: "0 0 4px" }}>
            Conversion Funnel
          </p>
          <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>How users move through your platform</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {FUNNEL.map(r => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{r.label}</span>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: r.color,
                  fontFamily: "var(--font-display)", letterSpacing: "-0.02em",
                }}>
                  {r.pct}%
                </span>
              </div>
              <div style={{ height: 6, background: r.track, borderRadius: 99, overflow: "hidden" }}>
                <div
                  className="bar-fill"
                  style={{
                    background: `linear-gradient(90deg, ${r.color}99, ${r.color})`,
                    boxShadow: `0 0 10px ${r.color}60`,
                    "--w": `${r.pct}%`,
                    width: `${r.pct}%`,
                  } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mini breakdown */}
        <div style={{
          marginTop: 22,
          paddingTop: 18,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", gap: 0, flexWrap: "wrap",
        }}>
          {[
            { label: "Registered", value: stats.registeredUsers, color: "#34d399" },
            { label: "Guests",     value: stats.guestUsers,      color: "#94a3b8" },
            { label: "Premium",    value: stats.premiumUsers,     color: "#fbbf24" },
            { label: "Free",       value: stats.registeredUsers - stats.premiumUsers, color: "#475569" },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              flex: "1 1 80px",
              textAlign: "center",
              padding: "0 12px",
              borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <p style={{ fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 800, color: s.color, margin: "0 0 2px", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                {s.value}
              </p>
              <p style={{ fontSize: 11, color: "#334155", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
