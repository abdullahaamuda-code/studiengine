"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import QuizPlayer from "@/components/QuizPlayer";
import { useAuth } from "@/context/AuthContext";

function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9, justifyContent:"center" }}>
      <svg width="30" height="30" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius:9, display:"block", flexShrink:0 }}>
        <defs>
          <linearGradient id="cb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0d0f1a"/><stop offset="100%" stopColor="#111827"/></linearGradient>
          <linearGradient id="cs" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#818cf8"/><stop offset="60%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#38bdf8"/></linearGradient>
          <linearGradient id="cl" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1e2440"/><stop offset="100%" stopColor="#252b50"/></linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#cb)"/>
        <rect x="160" y="96"  width="260" height="52" rx="26" fill="url(#cl)" opacity="0.9"/>
        <rect x="96"  y="166" width="320" height="52" rx="26" fill="url(#cl)" opacity="0.78"/>
        <rect x="96"  y="236" width="330" height="52" rx="26" fill="url(#cl)" opacity="0.62"/>
        <rect x="96"  y="306" width="320" height="52" rx="26" fill="url(#cl)" opacity="0.46"/>
        <rect x="96"  y="376" width="220" height="52" rx="26" fill="url(#cl)" opacity="0.30"/>
        <path d="M330 130 C330 130 330 86 256 86 C182 86 158 130 158 174 C158 218 194 238 256 256 C318 274 354 294 354 338 C354 382 330 426 256 426 C182 426 158 382 158 382"
          fill="none" stroke="url(#cs)" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontSize:17, fontWeight:800, fontFamily:"var(--font-display)", letterSpacing:"-0.02em", background:"linear-gradient(135deg,#f1f5f9,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
        Studiengine
      </span>
    </div>
  );
}

export default function SharedCBTPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { continueAsGuest } = useAuth();

  const [questions, setQuestions] = useState<any[] | null>(null);
  const [meta, setMeta]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [started, setStarted]     = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "sharedQuizzes", id as string)).then(snap => {
      if (!snap.exists()) { setError("This CBT link is invalid or has expired."); setLoading(false); return; }
      const data = snap.data();
      setQuestions(data.questions);
      setMeta({ subject: data.subject, count: data.questions?.length });
      setLoading(false);
    }).catch(() => { setError("Could not load CBT. Please try again."); setLoading(false); });
  }, [id]);

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
        <div style={{ width:22, height:22, border:"2.5px solid rgba(255,255,255,0.08)", borderTopColor:"#818cf8", borderRadius:"50%", animation:"sp 0.7s linear infinite" }} />
        <p style={{ fontSize:13, color:"#334155", fontFamily:"var(--font-body)" }}>Loading CBT…</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"var(--font-body)", gap:14 }}>
      <div style={{ width:56, height:56, borderRadius:16, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>😕</div>
      <p style={{ fontSize:17, color:"#f1f5f9", fontFamily:"var(--font-display)", fontWeight:800, margin:0 }}>CBT not found</p>
      <p style={{ fontSize:13, color:"#475569", margin:0 }}>{error}</p>
      <button onClick={() => router.push("/landing")}
        style={{ background:"linear-gradient(135deg,#6366f1,#4f46e5)", border:"1px solid rgba(129,140,248,0.4)", color:"#fff", padding:"12px 24px", borderRadius:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)", boxShadow:"0 4px 20px rgba(99,102,241,0.35)" }}>
        Try Studiengine →
      </button>
    </div>
  );

  /* ── Active quiz ── */
  if (started && questions) return (
    <div style={{ minHeight:"100vh", background:"#080c14", fontFamily:"var(--font-body)" }}>
      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"-10%", left:"-5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 65%)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", bottom:"-5%", right:"-5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 65%)", filter:"blur(80px)" }} />
      </div>

      <div style={{ position:"relative", zIndex:1, maxWidth:580, margin:"0 auto", padding:"20px 16px 60px" }}>
        {/* Mini nav */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, padding:"0 4px" }}>
          <Logo />
          <button onClick={() => router.push("/app")}
            style={{ fontSize:12, color:"#334155", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-body)", transition:"color 0.15s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#818cf8";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#334155";}}>
            Create your own →
          </button>
        </div>

        {/* Quiz card */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"22px 18px", backdropFilter:"blur(20px)" }}>
          <QuizPlayer
            questions={questions}
            onReset={() => router.push("/landing")}
            notice={meta?.subject ? `Subject: ${meta.subject}` : undefined}
          />
        </div>

        <p style={{ textAlign:"center", marginTop:16, fontSize:11.5, color:"#1e293b" }}>
          Powered by Studiengine ·{" "}
          <button onClick={() => router.push("/app")}
            style={{ background:"none", border:"none", color:"#6366f1", fontSize:11.5, cursor:"pointer", fontFamily:"var(--font-body)", textDecoration:"underline" }}>
            Create your own CBT free
          </button>
        </p>
      </div>
    </div>
  );

  /* ── Landing / preview ── */
  return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"var(--font-body)" }}>
      <style>{`
        @keyframes sp { to{transform:rotate(360deg)} }
        @keyframes cb-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .start-btn { transition:all 0.2s; }
        .start-btn:hover { box-shadow:0 8px 28px rgba(99,102,241,0.45) !important; transform:translateY(-1px); }
        .ghost-btn:hover { background:rgba(255,255,255,0.07) !important; }
      `}</style>

      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-10%", left:"-5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,102,241,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.025) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      <div style={{ maxWidth:400, width:"100%", position:"relative", zIndex:1, animation:"cb-in 0.4s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ marginBottom:28 }}><Logo /></div>

        <div style={{ background:"rgba(10,13,22,0.97)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:22, padding:"30px 26px", textAlign:"center", boxShadow:"0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)", position:"relative", overflow:"hidden" }}>
          {/* Top glow */}
          <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.5),transparent)" }} />

          {/* Icon */}
          <div style={{ width:54, height:54, borderRadius:16, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.22)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", fontSize:26 }}>📋</div>

          <h1 style={{ fontSize:21, fontWeight:800, fontFamily:"var(--font-display)", color:"#f1f5f9", margin:"0 0 6px", letterSpacing:"-0.02em" }}>
            {meta?.subject ? `${meta.subject} CBT` : "Shared CBT"}
          </h1>
          <p style={{ fontSize:13, color:"#475569", margin:"0 0 6px" }}>
            {meta?.count} question{meta?.count !== 1 ? "s" : ""} · Shared via Studiengine
          </p>

          {/* Stats row */}
          <div style={{ display:"flex", justifyContent:"center", gap:20, margin:"16px 0 24px", padding:"12px 0", borderTop:"1px solid rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:20, fontWeight:800, color:"#818cf8", fontFamily:"var(--font-display)", margin:"0 0 2px" }}>{meta?.count}</p>
              <p style={{ fontSize:11, color:"#334155", margin:0 }}>Questions</p>
            </div>
            <div style={{ width:1, background:"rgba(255,255,255,0.06)" }} />
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:20, fontWeight:800, color:"#34d399", fontFamily:"var(--font-display)", margin:"0 0 2px" }}>Free</p>
              <p style={{ fontSize:11, color:"#334155", margin:0 }}>No sign-in needed</p>
            </div>
            <div style={{ width:1, background:"rgba(255,255,255,0.06)" }} />
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:20, fontWeight:800, color:"#fbbf24", fontFamily:"var(--font-display)", margin:"0 0 2px" }}>AI</p>
              <p style={{ fontSize:11, color:"#334155", margin:0 }}>Explanations</p>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            <button className="start-btn" onClick={() => { continueAsGuest(); setStarted(true); }}
              style={{ width:"100%", padding:"14px 0", background:"linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)", border:"1px solid rgba(129,140,248,0.4)", borderRadius:12, color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"var(--font-body)", boxShadow:"0 4px 20px rgba(99,102,241,0.35)", letterSpacing:"-0.01em" }}>
              Start CBT →
            </button>
            <button className="ghost-btn" onClick={() => router.push("/auth?mode=signin")}
              style={{ width:"100%", padding:"12px 0", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, color:"#64748b", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)", transition:"all 0.2s" }}>
              Sign in to save your score
            </button>
          </div>

          <p style={{ fontSize:11.5, color:"#1e293b", marginTop:20, lineHeight:1.6 }}>
            Want to create your own CBT from your notes?{" "}
            <button onClick={() => router.push("/landing")}
              style={{ background:"none", border:"none", color:"#818cf8", fontSize:11.5, cursor:"pointer", fontFamily:"var(--font-body)", textDecoration:"underline" }}>
              Try Studiengine free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
