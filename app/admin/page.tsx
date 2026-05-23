"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import StatsTab    from "@/components/admin/StatsTab";
import UsersTab    from "@/components/admin/UsersTab";
import EmailTab    from "@/components/admin/EmailTab";
import FeedbackTab from "@/components/admin/FeedbackTab";
import AIAssistant from "@/components/admin/AIAssistant";
import SessionsTab from "@/components/admin/SessionsTab";
import ReferralsTab from "@/components/admin/ReferralsTab";

const TABS = [
  { id:"stats",     label:"Analytics",    icon:"◈", desc:"Platform metrics and usage overview"          },
  { id:"users",     label:"Users",         icon:"◉", desc:"Manage users, premium access and limits"      },
  { id:"sessions",  label:"CBT Logs",      icon:"✦", desc:"All CBT sessions and quiz logs"               },
  { id:"referrals", label:"Referrals",     icon:"⊟", desc:"Ambassador referrals and approval queue"      },
  { id:"email",     label:"Email",         icon:"⊞", desc:"Send broadcast emails via Brevo"              },
  { id:"feedback",  label:"Feedback",      icon:"◎", desc:"User feedback and ratings"                    },
  { id:"ai",        label:"AI Assistant",  icon:"⚡", desc:"AI-powered admin assistant"                  },
];

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius:size*0.2, display:"block", flexShrink:0 }}>
      <defs>
        <linearGradient id="adlb2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0d0f1a"/><stop offset="100%" stopColor="#111827"/></linearGradient>
        <linearGradient id="adls2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#818cf8"/><stop offset="60%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#38bdf8"/></linearGradient>
        <linearGradient id="adll2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1e2440"/><stop offset="100%" stopColor="#252b50"/></linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#adlb2)"/>
      <rect x="160" y="96"  width="260" height="52" rx="26" fill="url(#adll2)" opacity="0.9"/>
      <rect x="96"  y="166" width="320" height="52" rx="26" fill="url(#adll2)" opacity="0.78"/>
      <rect x="96"  y="236" width="330" height="52" rx="26" fill="url(#adll2)" opacity="0.62"/>
      <rect x="96"  y="306" width="320" height="52" rx="26" fill="url(#adll2)" opacity="0.46"/>
      <rect x="96"  y="376" width="220" height="52" rx="26" fill="url(#adll2)" opacity="0.30"/>
      <path d="M330 130 C330 130 330 86 256 86 C182 86 158 130 158 174 C158 218 194 238 256 256 C318 274 354 294 354 338 C354 382 330 426 256 426 C182 426 158 382 158 382"
        fill="none" stroke="url(#adls2)" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab]       = useState("stats");
  const [authed, setAuthed] = useState(false);
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;

  useEffect(() => {
    if (loading) return;
    if (!user)                                    { router.replace("/"); return; }
    if (adminUid && user.uid !== adminUid)        { router.replace("/"); return; }
    setAuthed(true);
  }, [user, loading, adminUid, router]);

  if (loading || !authed) return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
      <div style={{ width:32, height:32, border:"2px solid rgba(129,140,248,0.15)", borderTopColor:"#818cf8", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ fontSize:13, color:"#334155", fontFamily:"var(--font-body)" }}>Verifying access…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div style={{ minHeight:"100vh", background:"#080c14", fontFamily:"var(--font-body)", color:"#f1f5f9", overflowX:"hidden" }}>
      <style>{`
        @keyframes spin         { to{transform:rotate(360deg)} }
        @keyframes shimmer-x    { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes badge-in     { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
        @keyframes tab-in       { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }

        ::-webkit-scrollbar       { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(129,140,248,0.25); border-radius:99px; }

        .admin-tab {
          display:flex; align-items:center; gap:6px;
          padding:8px 14px; border-radius:9px;
          border:1px solid transparent; background:transparent;
          color:#475569; font-size:13px; font-weight:500;
          cursor:pointer; white-space:nowrap; font-family:inherit;
          transition:all 0.18s cubic-bezier(0.4,0,0.2,1);
        }
        .admin-tab:hover { color:#94a3b8; background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.06); }
        .admin-tab.active { color:#a5b4fc; background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(56,189,248,0.08)); border-color:rgba(99,102,241,0.3); font-weight:700; }
        .admin-tab .t-icon { font-size:13px; opacity:0.65; transition:opacity 0.18s; }
        .admin-tab.active .t-icon { opacity:1; color:#818cf8; }

        .tab-content { animation:tab-in 0.3s cubic-bezier(0.4,0,0.2,1); }

        .admin-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; transition:border-color 0.2s; }
        .admin-card:hover { border-color:rgba(255,255,255,0.11); }

        @media(max-width:700px) {
          .admin-tabs-wrap { padding:0 10px !important; gap:3px !important; }
          .admin-tab { padding:8px 10px !important; font-size:12px !important; }
          .admin-tab .t-label { display:none; }
          .content-area { padding:16px 12px 60px !important; }
          .hdr-email { display:none !important; }
          .page-hdr   { padding:24px 12px 0 !important; }
        }
      `}</style>

      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"-8%", left:"-4%", width:640, height:640, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 65%)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", bottom:"-4%", right:"-4%", width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 65%)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      <div style={{ position:"relative", zIndex:1, minHeight:"100vh", display:"flex", flexDirection:"column" }}>

        {/* ── Navbar ── */}
        <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(8,12,20,0.92)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,0.06)", height:58, display:"flex", alignItems:"center" }}>
          {/* Bottom glow line */}
          <div style={{ position:"absolute", left:"10%", right:"10%", bottom:0, height:1, background:"linear-gradient(90deg,transparent,rgba(99,102,241,0.4),rgba(56,189,248,0.25),transparent)" }} />

          <div style={{ maxWidth:1200, width:"100%", margin:"0 auto", padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Logo size={26} />
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:15, fontWeight:800, fontFamily:"var(--font-display)", letterSpacing:"-0.02em", background:"linear-gradient(135deg,#f1f5f9,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  Studiengine
                </span>
                <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:99, padding:"2px 9px", fontSize:10, fontWeight:700, color:"#818cf8", textTransform:"uppercase", letterSpacing:"0.08em", animation:"badge-in 0.5s ease" }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:"#818cf8", boxShadow:"0 0 6px rgba(129,140,248,0.9)" }} />
                  Admin
                </div>
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span className="hdr-email" style={{ fontSize:11, color:"#334155" }}>{user?.email}</span>
              {!adminUid && (
                <button onClick={() => { navigator.clipboard.writeText(user?.uid||""); alert("UID copied! Add as NEXT_PUBLIC_ADMIN_UID"); }}
                  style={{ fontSize:11, padding:"5px 11px", borderRadius:8, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", color:"#fbbf24", cursor:"pointer", fontFamily:"inherit" }}>
                  Copy UID
                </button>
              )}
              <button onClick={() => router.push("/")}
                style={{ fontSize:12, padding:"6px 14px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"#64748b", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#94a3b8";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#64748b";}}>
                ← App
              </button>
            </div>
          </div>
        </nav>

        {/* ── Tabs bar ── */}
        <div style={{ position:"sticky", top:58, zIndex:90, background:"rgba(8,12,20,0.88)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div className="admin-tabs-wrap" style={{ maxWidth:1200, margin:"0 auto", padding:"0 20px", display:"flex", gap:3, overflowX:"auto", height:50, alignItems:"center" }}>
            {TABS.map(t => (
              <button key={t.id} className={`admin-tab${tab===t.id?" active":""}`} onClick={() => setTab(t.id)}>
                <span className="t-icon">{t.icon}</span>
                <span className="t-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Page header ── */}
        <div className="page-hdr" style={{ maxWidth:1200, margin:"0 auto", width:"100%", padding:"28px 20px 0" }}>
          <div style={{ marginBottom:22 }}>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"#6366f1", marginBottom:4 }}>Admin Dashboard</p>
            <h1 style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:800, fontFamily:"var(--font-display)", letterSpacing:"-0.025em", margin:"0 0 4px", background:"linear-gradient(135deg,#f1f5f9 0%,#818cf8 50%,#38bdf8 100%)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimmer-x 6s linear infinite" }}>
              {activeTab.icon} {activeTab.label}
            </h1>
            <p style={{ fontSize:13, color:"#334155", margin:0 }}>{activeTab.desc}</p>
          </div>
          <div style={{ height:1, background:"linear-gradient(90deg,rgba(99,102,241,0.4),rgba(56,189,248,0.2),transparent)", marginBottom:24, borderRadius:99 }} />
        </div>

        {/* ── Content ── */}
        <div className="content-area" style={{ maxWidth:1200, margin:"0 auto", width:"100%", padding:"0 20px 60px", flex:1 }}>
          <div className="tab-content" key={tab}>
            {tab==="stats"     && <StatsTab />}
            {tab==="users"     && <UsersTab />}
            {tab==="sessions"  && <SessionsTab />}
            {tab==="referrals" && <ReferralsTab />}
            {tab==="email"     && <EmailTab />}
            {tab==="feedback"  && <FeedbackTab />}
            {tab==="ai"        && <AIAssistant />}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.04)", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:1200, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Logo size={18} />
            <span style={{ fontSize:12, color:"#1e293b", fontWeight:600, fontFamily:"var(--font-display)" }}>Studiengine</span>
          </div>
          <p style={{ fontSize:11, color:"#1e293b", margin:0 }}>Admin · {user?.email}</p>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 6px rgba(52,211,153,0.7)" }} />
            <span style={{ fontSize:11, color:"#1e293b" }}>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
