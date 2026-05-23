"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

interface Stats {
  totalUsers: number;
  guestUsers: number;
  registeredUsers: number;
  premiumUsers: number;
  todayCBTs: number;
  totalCBTs: number;
  totalFeedback: number;
  totalSessions: number;
  avgScore: number;
  sharedCBTOpens: number;
  aiExplainRequests: number;
  premiumCBTs: number;
  freeCBTs: number;
  totalPayments: number;
  totalRevenue: number;
}

const CARD_DEFS = [
  { key:"totalUsers",       label:"Total Users",      sub:"all time",                  icon:"◉", color:"#818cf8", glow:"rgba(129,140,248,0.12)", border:"rgba(129,140,248,0.2)"  },
  { key:"registeredUsers",  label:"Registered",       sub:"signed up",                 icon:"✦", color:"#34d399", glow:"rgba(52,211,153,0.1)",  border:"rgba(52,211,153,0.18)"  },
  { key:"guestUsers",       label:"Guests",           sub:"no account",                icon:"◈", color:"#94a3b8", glow:"rgba(148,163,184,0.07)",border:"rgba(148,163,184,0.14)" },
  { key:"premiumUsers",     label:"Premium",          sub:"active subscribers",        icon:"⚡", color:"#fbbf24", glow:"rgba(251,191,36,0.1)", border:"rgba(251,191,36,0.2)"   },
  { key:"todayCBTs",        label:"CBTs Today",       sub:"resets daily",              icon:"⊞", color:"#38bdf8", glow:"rgba(56,189,248,0.1)", border:"rgba(56,189,248,0.18)"  },
  { key:"totalCBTs",        label:"All-Time CBTs",    sub:"cumulative",                icon:"◎", color:"#a78bfa", glow:"rgba(167,139,250,0.1)",border:"rgba(167,139,250,0.18)" },
  { key:"premiumCBTs",      label:"Premium CBTs",     sub:"by premium users",          icon:"⚡", color:"#fbbf24", glow:"rgba(251,191,36,0.08)",border:"rgba(251,191,36,0.15)"  },
  { key:"aiExplainRequests",label:"AI Explanations",  sub:"explain requests",          icon:"🤖", color:"#818cf8", glow:"rgba(129,140,248,0.1)",border:"rgba(129,140,248,0.18)" },
  { key:"sharedCBTOpens",   label:"Shared CBT Opens", sub:"via share link",            icon:"🔗", color:"#34d399", glow:"rgba(52,211,153,0.08)",border:"rgba(52,211,153,0.15)"  },
  { key:"totalSessions",    label:"CBT Logs",         sub:"guest + free sessions",     icon:"✦", color:"#38bdf8", glow:"rgba(56,189,248,0.08)",border:"rgba(56,189,248,0.15)"  },
  { key:"avgScore",         label:"Avg Score",        sub:"across all sessions",       icon:"◈", color:"#fb923c", glow:"rgba(251,146,60,0.1)", border:"rgba(251,146,60,0.18)"  },
  { key:"totalFeedback",    label:"Feedback",         sub:"submissions",               icon:"◎", color:"#f472b6", glow:"rgba(244,114,182,0.1)",border:"rgba(244,114,182,0.18)" },
];

export default function StatsTab() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [usageSnap, feedbackSnap, sessionsSnap, eventsSnap] = await Promise.all([
          getDocs(collection(db, "usage")),
          getDocs(collection(db, "feedback")),
          getDocs(query(collection(db, "cbtSessions"), limit(500))),
          getDocs(collection(db, "events")).catch(() => null),
        ]);

        const users = usageSnap.docs.map(d => ({ id:d.id, ...d.data() })) as any[];
        const totalUsers      = users.length;
        const guestUsers      = users.filter(u => u.id.startsWith("guest_")).length;
        const registeredUsers = totalUsers - guestUsers;
        const premiumUsers    = users.filter(u => u.isPremium).length;
        const todayCBTs       = users.reduce((s,u) => s + (u.quizCount||0), 0);
        const totalCBTs       = users.reduce((s,u) => s + (u.allTimeQuizCount||u.quizCount||0), 0);
        const premiumCBTs     = users.filter(u=>u.isPremium).reduce((s,u)=>s+(u.allTimeQuizCount||0),0);
        const freeCBTs        = totalCBTs - premiumCBTs;
        const totalPayments   = users.filter(u=>u.lastPaymentAmt).length;
        const totalRevenue    = users.reduce((s,u)=>s+(u.lastPaymentAmt||0),0) / 100; // kobo → naira

        // Sessions avg score
        const sessionDocs = sessionsSnap.docs.map(d=>d.data() as any);
        const totalSessions = sessionDocs.length;
        const avgScore = totalSessions > 0
          ? Math.round(sessionDocs.reduce((s,d)=>s+(d.pct||0),0) / totalSessions)
          : 0;

        // Events (AI explain, shared opens)
        let aiExplainRequests = 0;
        let sharedCBTOpens    = 0;
        if (eventsSnap) {
          eventsSnap.docs.forEach(d => {
            const ev = d.data() as any;
            if (ev.type === "ai_explain")  aiExplainRequests++;
            if (ev.type === "shared_open") sharedCBTOpens++;
          });
        }

        setStats({ totalUsers, guestUsers, registeredUsers, premiumUsers, todayCBTs, totalCBTs, totalFeedback:feedbackSnap.size, totalSessions, avgScore, sharedCBTOpens, aiExplainRequests, premiumCBTs, freeCBTs, totalPayments, totalRevenue });
      } catch (e:any) { setError(e.message); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"32px 0" }}>
      <div style={{ width:18, height:18, border:"2px solid rgba(129,140,248,0.15)", borderTopColor:"#818cf8", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color:"#334155", fontSize:13 }}>Loading analytics…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error) return <div style={{ padding:"12px 16px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, color:"#f87171", fontSize:13 }}>⚠️ {error}</div>;
  if (!stats) return null;

  const regPct   = stats.totalUsers      > 0 ? Math.round((stats.registeredUsers/stats.totalUsers)*100)      : 0;
  const premPct  = stats.registeredUsers > 0 ? Math.round((stats.premiumUsers/stats.registeredUsers)*100)    : 0;
  const guestPct = stats.totalUsers      > 0 ? Math.round((stats.guestUsers/stats.totalUsers)*100)           : 0;

  function fmt(key: string, val: number) {
    if (key === "avgScore")    return `${val}%`;
    if (key === "totalRevenue") return `₦${val.toLocaleString()}`;
    return val.toLocaleString();
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <style>{`
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes bar-grow { from{width:0} }
        @keyframes cnt-in   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .st-card { background:rgba(255,255,255,0.03); border-radius:15px; padding:18px 16px; transition:transform 0.2s,border-color 0.2s; cursor:default; position:relative; overflow:hidden; }
        .st-card:hover { transform:translateY(-3px); }
        .st-card::before { content:''; position:absolute; inset:0; opacity:0; transition:opacity 0.3s; background:radial-gradient(circle at 30% 30%, var(--glow) 0%, transparent 70%); }
        .st-card:hover::before { opacity:1; }
        .st-val { font-size:32px; font-weight:800; font-family:var(--font-display); letter-spacing:-0.03em; line-height:1; margin:0 0 4px; animation:cnt-in 0.5s ease both; }
        .funnel-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:15px; padding:22px; }
        .bar-fill { height:100%; border-radius:99px; animation:bar-grow 1.2s cubic-bezier(0.4,0,0.2,1) both; }
        @media(max-width:640px) { .st-grid { grid-template-columns:repeat(2,1fr) !important; } }
      `}</style>

      {/* Revenue highlight */}
      {stats.totalRevenue > 0 && (
        <div style={{ background:"linear-gradient(135deg,rgba(251,191,36,0.08),rgba(245,158,11,0.04))", border:"1px solid rgba(251,191,36,0.2)", borderRadius:15, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:"#fbbf24", letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 4px" }}>Total Revenue</p>
            <p style={{ fontSize:32, fontWeight:800, color:"#fbbf24", fontFamily:"var(--font-display)", margin:0, letterSpacing:"-0.03em" }}>₦{stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div style={{ display:"flex", gap:20 }}>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:20, fontWeight:800, color:"#f1f5f9", fontFamily:"var(--font-display)", margin:"0 0 2px" }}>{stats.totalPayments}</p>
              <p style={{ fontSize:11, color:"#334155", margin:0 }}>Payments</p>
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:20, fontWeight:800, color:"#f1f5f9", fontFamily:"var(--font-display)", margin:"0 0 2px" }}>{stats.premiumUsers}</p>
              <p style={{ fontSize:11, color:"#334155", margin:0 }}>Active Premium</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="st-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {CARD_DEFS.map((c,i) => {
          const val = (stats as any)[c.key] as number;
          return (
            <div
              key={c.key}
              className="st-card"
              style={{ border:`1px solid ${c.border}`, ["--glow" as any]: c.glow, animationDelay:`${i*0.06}s` } as React.CSSProperties}
            >
              <div style={{ width:32, height:32, borderRadius:9, background:c.glow, border:`1px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:c.color, fontWeight:700, marginBottom:12 }}>{c.icon}</div>
              <p className="st-val" style={{ color:c.color, animationDelay:`${i*0.06+0.1}s` }}>{fmt(c.key, val)}</p>
              <p style={{ fontSize:12, fontWeight:600, color:"#94a3b8", margin:"0 0 1px" }}>{c.label}</p>
              <p style={{ fontSize:11, color:"#334155", margin:0 }}>{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Conversion funnel */}
      <div className="funnel-card">
        <p style={{ fontSize:11, fontWeight:700, color:"#6366f1", letterSpacing:"0.12em", textTransform:"uppercase", margin:"0 0 4px" }}>Conversion Funnel</p>
        <p style={{ fontSize:13, color:"#334155", margin:"0 0 20px" }}>How users move through the platform</p>
        {[
          { label:"Guest → Registered",  pct:regPct,  color:"#34d399", track:"rgba(52,211,153,0.08)"  },
          { label:"Free → Premium",      pct:premPct, color:"#fbbf24", track:"rgba(251,191,36,0.08)"  },
          { label:"Total Guest share",   pct:guestPct,color:"#94a3b8", track:"rgba(148,163,184,0.08)" },
        ].map(r => (
          <div key={r.label} style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
              <span style={{ fontSize:13, color:"#94a3b8", fontWeight:500 }}>{r.label}</span>
              <span style={{ fontSize:13, fontWeight:800, color:r.color, fontFamily:"var(--font-display)" }}>{r.pct}%</span>
            </div>
            <div style={{ height:6, background:r.track, borderRadius:99, overflow:"hidden" }}>
              <div className="bar-fill" style={{ background:`linear-gradient(90deg,${r.color}99,${r.color})`, boxShadow:`0 0 10px ${r.color}60`, width:`${r.pct}%` } as React.CSSProperties} />
            </div>
          </div>
        ))}

        {/* Mini breakdown */}
        <div style={{ marginTop:20, paddingTop:18, borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", flexWrap:"wrap", gap:0 }}>
          {[
            { label:"Registered", value:stats.registeredUsers, color:"#34d399" },
            { label:"Guests",     value:stats.guestUsers,      color:"#94a3b8" },
            { label:"Premium",    value:stats.premiumUsers,     color:"#fbbf24" },
            { label:"Free",       value:stats.registeredUsers-stats.premiumUsers, color:"#475569" },
          ].map((s,i,arr) => (
            <div key={s.label} style={{ flex:"1 1 70px", textAlign:"center", padding:"0 10px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <p style={{ fontSize:"clamp(16px,2.5vw,22px)", fontWeight:800, color:s.color, margin:"0 0 2px", fontFamily:"var(--font-display)", letterSpacing:"-0.02em" }}>{s.value}</p>
              <p style={{ fontSize:11, color:"#334155", margin:0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI + engagement stats */}
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:15, padding:"20px 22px" }}>
        <p style={{ fontSize:11, fontWeight:700, color:"#6366f1", letterSpacing:"0.12em", textTransform:"uppercase", margin:"0 0 4px" }}>Engagement Metrics</p>
        <p style={{ fontSize:13, color:"#334155", margin:"0 0 18px" }}>Feature usage breakdown</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
          {[
            { label:"Premium CBTs",      value:stats.premiumCBTs,       color:"#fbbf24", note:"by premium users" },
            { label:"Free CBTs",         value:stats.freeCBTs,          color:"#94a3b8", note:"by free/guest"    },
            { label:"AI Explanations",   value:stats.aiExplainRequests, color:"#818cf8", note:"explain requests" },
            { label:"Shared CBT Opens",  value:stats.sharedCBTOpens,    color:"#34d399", note:"link opens"       },
            { label:"Avg Session Score", value:stats.avgScore,          color:"#fb923c", note:"% correct"        },
          ].map(m => (
            <div key={m.label} style={{ padding:"12px 14px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:11 }}>
              <p style={{ fontSize:22, fontWeight:800, color:m.color, fontFamily:"var(--font-display)", margin:"0 0 3px", letterSpacing:"-0.02em" }}>
                {m.label==="Avg Session Score" ? `${m.value}%` : m.value.toLocaleString()}
              </p>
              <p style={{ fontSize:12, fontWeight:600, color:"#94a3b8", margin:"0 0 1px" }}>{m.label}</p>
              <p style={{ fontSize:11, color:"#334155", margin:0 }}>{m.note}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop:14, padding:"10px 14px", background:"rgba(99,102,241,0.05)", border:"1px solid rgba(99,102,241,0.12)", borderRadius:10, fontSize:12, color:"#475569", lineHeight:1.6 }}>
          💡 <strong style={{ color:"#a5b4fc" }}>Note:</strong> AI Explanations and Shared CBT Opens are tracked via the <code style={{ color:"#818cf8" }}>events</code> Firestore collection. Make sure you're logging these events from the relevant components.
        </div>
      </div>
    </div>
  );
}
