"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, limit, deleteDoc, doc } from "firebase/firestore";
import MathText from "@/components/MathText";

interface Session {
  id: string; userId: string; userEmail?: string | null;
  subject?: string | null; score: number; total: number; pct: number;
  createdAt?: any; questions?: any[];
}

function gradeColor(pct: number) { return pct >= 80 ? "#34d399" : pct >= 60 ? "#fbbf24" : "#f87171"; }

export default function SessionsTab() {
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [selected, setSelected]   = useState<Session | null>(null);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<"all"|"guest"|"registered">("all");

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db,"cbtSessions"), orderBy("createdAt","desc"), limit(100)));
        setSessions(snap.docs.map(d => ({ id:d.id, ...d.data() })) as Session[]);
      } catch (e:any) { setError(e.message); }
      setLoading(false);
    }
    load();
  }, []);

  async function del(id: string) {
    if (!confirm("Delete this session?")) return;
    await deleteDoc(doc(db,"cbtSessions",id));
    setSessions(s => s.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const filtered = sessions.filter(s => {
    const matchSearch = s.userId.toLowerCase().includes(search.toLowerCase()) ||
      (s.userEmail||"").toLowerCase().includes(search.toLowerCase()) ||
      (s.subject||"").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "guest"      ? s.userId.startsWith("guest_") :
      filter === "registered" ? !s.userId.startsWith("guest_") : true;
    return matchSearch && matchFilter;
  });

  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((s,d)=>s+d.pct,0)/sessions.length) : 0;
  const guestCount = sessions.filter(s=>s.userId.startsWith("guest_")).length;

  return (
    <div>
      <style>{`
        @keyframes ss-spin { to{transform:rotate(360deg)} }
        @keyframes ss-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ss-input { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:10px; color:#f1f5f9; padding:9px 13px; font-size:13px; outline:none; font-family:inherit; transition:border-color 0.2s; }
        .ss-input:focus { border-color:rgba(99,102,241,0.5); }
        .ss-row { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:12px 15px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; transition:border-color 0.15s; cursor:pointer; }
        .ss-row:hover { border-color:rgba(255,255,255,0.12); }
        .ss-btn { font-size:11px; padding:5px 11px; border-radius:7px; cursor:pointer; font-family:inherit; border:1px solid; transition:opacity 0.15s; white-space:nowrap; }
        .ss-btn:hover { opacity:0.8; }
        .filter-pill { padding:5px 13px; border-radius:99px; border:1px solid; font-size:12px; cursor:pointer; font-family:inherit; transition:all 0.15s; }

        /* Modal */
        .ss-modal-bg { position:fixed; inset:0; background:rgba(4,6,12,0.85); backdrop-filter:blur(12px); display:flex; align-items:center; justify-content:center; z-index:200; padding:16px; }
        .ss-modal { background:rgba(10,13,22,0.98); border:1px solid rgba(255,255,255,0.09); border-radius:20px; width:100%; max-width:680px; max-height:85vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 32px 80px rgba(0,0,0,0.7); animation:ss-in 0.25s cubic-bezier(0.4,0,0.2,1); }
        .ss-modal-body { overflow-y:auto; padding:16px; flex:1; }
        .ss-modal-body::-webkit-scrollbar { width:3px; }
        .ss-modal-body::-webkit-scrollbar-thumb { background:rgba(129,140,248,0.2); border-radius:99px; }
        .opt-correct-sm { background:rgba(4,47,29,0.5); border-color:rgba(52,211,153,0.35); color:#6ee7b7; }
        .opt-default-sm { background:rgba(255,255,255,0.02); border-color:rgba(255,255,255,0.06); color:#475569; }
      `}</style>

      {error && <div style={{ marginBottom:12, padding:"9px 14px", background:"rgba(36,10,10,0.7)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:9, color:"#fca5a5", fontSize:13 }}>⚠ {error}</div>}

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10, marginBottom:20 }}>
        {[
          { label:"Total Sessions", value:sessions.length, color:"#818cf8" },
          { label:"Avg Score",      value:`${avgScore}%`,  color:"#fbbf24" },
          { label:"Guest Sessions", value:guestCount,      color:"#94a3b8" },
          { label:"Registered",     value:sessions.length-guestCount, color:"#34d399" },
        ].map(c => (
          <div key={c.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:13, padding:"14px 16px" }}>
            <p style={{ fontSize:11, color:"#334155", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", margin:"0 0 4px" }}>{c.label}</p>
            <p style={{ fontSize:24, fontWeight:800, color:c.color, fontFamily:"var(--font-display)", margin:0, letterSpacing:"-0.02em" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search email, ID, subject…" className="ss-input" style={{ flex:1, minWidth:180 }} />
        <div style={{ display:"flex", gap:6 }}>
          {(["all","guest","registered"] as const).map(f => (
            <button key={f} className="filter-pill" onClick={()=>setFilter(f)}
              style={{ borderColor:filter===f?"rgba(99,102,241,0.45)":"rgba(255,255,255,0.08)", background:filter===f?"rgba(99,102,241,0.14)":"transparent", color:filter===f?"#a5b4fc":"#475569" }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"32px 0" }}>
          <div style={{ width:16, height:16, border:"2px solid rgba(129,140,248,0.15)", borderTopColor:"#818cf8", borderRadius:"50%", animation:"ss-spin 0.8s linear infinite" }} />
          <span style={{ fontSize:13, color:"#334155" }}>Loading sessions…</span>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.length === 0 && <p style={{ color:"#334155", fontSize:13, textAlign:"center", padding:32 }}>No sessions found</p>}
          {filtered.map(s => {
            const isGuest = s.userId.startsWith("guest_");
            const gc = gradeColor(s.pct);
            return (
              <div key={s.id} className="ss-row" onClick={() => setSelected(s)}>
                {/* Score ring */}
                <div style={{ position:"relative", width:42, height:42, flexShrink:0 }}>
                  <svg width="42" height="42" style={{ transform:"rotate(-90deg)" }}>
                    <circle cx="21" cy="21" r="17" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                    <circle cx="21" cy="21" r="17" fill="none" stroke={gc} strokeWidth="3.5" strokeLinecap="round"
                      strokeDasharray={`${2*Math.PI*17}`}
                      strokeDashoffset={`${2*Math.PI*17*(1-s.pct/100)}`}
                      style={{ filter:`drop-shadow(0 0 3px ${gc}88)` }} />
                  </svg>
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:gc, fontFamily:"var(--font-display)" }}>
                    {s.pct}%
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:140 }}>
                  <p style={{ fontSize:13, color:"#f1f5f9", margin:"0 0 2px", fontWeight:600 }}>
                    {s.score}/{s.total} correct
                    {s.subject && <span style={{ fontSize:11, color:"#818cf8", marginLeft:8, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", padding:"1px 7px", borderRadius:99 }}>{s.subject}</span>}
                  </p>
                  <p style={{ fontSize:11, color:"#334155", margin:"0 0 1px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {s.userEmail || (isGuest ? "Guest" : s.userId.slice(0,16)+"…")}
                  </p>
                  <p style={{ fontSize:10, color:"#1e293b", margin:0 }}>
                    {s.createdAt?.toDate?.()?.toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) || "—"}
                  </p>
                </div>

                {/* Type badge */}
                <span style={{ fontSize:11, padding:"3px 9px", borderRadius:99, background:isGuest?"rgba(148,163,184,0.07)":"rgba(99,102,241,0.08)", border:`1px solid ${isGuest?"rgba(148,163,184,0.18)":"rgba(99,102,241,0.2)"}`, color:isGuest?"#94a3b8":"#818cf8", fontWeight:600, flexShrink:0 }}>
                  {isGuest ? "Guest" : "Registered"}
                </span>

                {/* Actions */}
                <div style={{ display:"flex", gap:6 }} onClick={e=>e.stopPropagation()}>
                  <button className="ss-btn" onClick={() => setSelected(s)}
                    style={{ background:"rgba(99,102,241,0.1)", borderColor:"rgba(99,102,241,0.25)", color:"#818cf8" }}>
                    View
                  </button>
                  <button className="ss-btn" onClick={() => del(s.id)}
                    style={{ background:"rgba(239,68,68,0.07)", borderColor:"rgba(239,68,68,0.2)", color:"#f87171" }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Session detail modal ── */}
      {selected && (
        <div className="ss-modal-bg" onClick={() => setSelected(null)}>
          <div className="ss-modal" onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", margin:"0 0 2px" }}>
                  {selected.score}/{selected.total} correct · {selected.pct}%
                  {selected.subject && <span style={{ fontSize:11, color:"#818cf8", marginLeft:8 }}>{selected.subject}</span>}
                </p>
                <p style={{ fontSize:11, color:"#334155", margin:0 }}>
                  {selected.userEmail || selected.userId}
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"#475569", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
            </div>

            {/* Questions */}
            <div className="ss-modal-body">
              {(!selected.questions || selected.questions.length === 0) ? (
                <p style={{ color:"#334155", fontSize:13, padding:"20px 0", textAlign:"center" }}>No questions stored for this session.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {selected.questions.map((q:any, i:number) => (
                    <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px" }}>
                      <p style={{ fontSize:13, color:"#e2e8f0", margin:"0 0 10px", lineHeight:1.6, fontWeight:500 }}>
                        <span style={{ color:"#334155", marginRight:6 }}>{i+1}.</span>
                        <MathText text={q.question} />
                      </p>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, marginBottom:8 }}>
                        {q.options?.map((opt:string, idx:number) => {
                          const hasLabel = /^[ABCD]\.\s/i.test(opt);
                          const letter   = hasLabel ? opt.charAt(0).toUpperCase() : ["A","B","C","D"][idx]||"?";
                          const content  = hasLabel ? opt.slice(3).trim() : opt;
                          const isCorrect = letter === q.answer?.toUpperCase();
                          return (
                            <div key={idx} style={{ display:"flex", gap:6, alignItems:"flex-start", padding:"6px 8px", borderRadius:8, border:"1px solid" }} className={isCorrect?"opt-correct-sm":"opt-default-sm"}>
                              <span style={{ fontSize:10, fontWeight:800, flexShrink:0, marginTop:1 }}>{letter}.</span>
                              <span style={{ fontSize:11, lineHeight:1.5, flex:1 }}><MathText text={content} /></span>
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <p style={{ fontSize:11.5, color:"#475569", margin:0, lineHeight:1.6, padding:"8px 10px", background:"rgba(99,102,241,0.05)", border:"1px solid rgba(99,102,241,0.12)", borderRadius:8 }}>
                          <span style={{ color:"#818cf8", fontWeight:700 }}>Explanation: </span>
                          <MathText text={q.explanation} />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
