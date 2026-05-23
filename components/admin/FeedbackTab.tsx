"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc, query, orderBy, limit } from "firebase/firestore";

interface FeedbackItem {
  id: string; rating: number; message: string; userId: string; createdAt: any;
}

export default function FeedbackTab() {
  const [items, setItems]     = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState<"all"|"5"|"4"|"3"|"2"|"1">("all");

  async function load() {
    try {
      const snap = await getDocs(query(collection(db,"feedback"), orderBy("createdAt","desc"), limit(50)));
      setItems(snap.docs.map(d => ({ id:d.id, ...d.data() })) as FeedbackItem[]);
    } catch (e:any) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function del(id: string) {
    await deleteDoc(doc(db,"feedback",id));
    setItems(i => i.filter(x => x.id !== id));
  }

  const filtered = filter === "all" ? items : items.filter(i => i.rating === parseInt(filter));
  const avg = items.length > 0 ? (items.reduce((s,i) => s+i.rating, 0) / items.length).toFixed(1) : "—";
  const dist = [5,4,3,2,1].map(r => ({ r, count: items.filter(i=>i.rating===r).length }));

  return (
    <div>
      <style>{`
        .fb-row { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:13px; padding:14px 16px; transition:border-color 0.15s; }
        .fb-row:hover { border-color:rgba(255,255,255,0.11); }
        .fb-del { font-size:11px; padding:4px 10px; background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.2); border-radius:7px; color:#f87171; cursor:pointer; font-family:inherit; transition:opacity 0.15s; }
        .fb-del:hover { opacity:0.8; }
        .fb-filter { padding:5px 13px; border-radius:99px; border:1px solid; font-size:12px; cursor:pointer; font-family:inherit; transition:all 0.15s; }
      `}</style>

      {error && <div style={{ marginBottom:12, padding:"9px 14px", background:"rgba(36,10,10,0.7)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:9, color:"#fca5a5", fontSize:13 }}>⚠ {error}</div>}

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:20 }}>
        <div style={{ background:"rgba(129,140,248,0.07)", border:"1px solid rgba(129,140,248,0.18)", borderRadius:13, padding:"16px" }}>
          <p style={{ fontSize:11, color:"#6366f1", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 4px" }}>Total</p>
          <p style={{ fontSize:28, fontWeight:800, color:"#818cf8", fontFamily:"var(--font-display)", margin:0 }}>{items.length}</p>
        </div>
        <div style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.18)", borderRadius:13, padding:"16px" }}>
          <p style={{ fontSize:11, color:"#fbbf24", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 4px" }}>Avg Rating</p>
          <p style={{ fontSize:28, fontWeight:800, color:"#fbbf24", fontFamily:"var(--font-display)", margin:0 }}>{avg} ⭐</p>
        </div>

        {/* Rating distribution */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:13, padding:"14px 16px", gridColumn:"span 2" }}>
          <p style={{ fontSize:11, color:"#334155", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 10px" }}>Rating Breakdown</p>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {dist.map(d => (
              <div key={d.r} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:11, color:"#475569", width:14, textAlign:"right", flexShrink:0 }}>{d.r}⭐</span>
                <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.05)", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width: items.length > 0 ? `${(d.count/items.length)*100}%` : "0%", background:"linear-gradient(90deg,#fbbf24,#f59e0b)", borderRadius:99, transition:"width 0.5s ease" }} />
                </div>
                <span style={{ fontSize:11, color:"#334155", width:20, flexShrink:0 }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {(["all","5","4","3","2","1"] as const).map(f => (
          <button key={f} className="fb-filter" onClick={() => setFilter(f)}
            style={{ borderColor:filter===f?"rgba(99,102,241,0.45)":"rgba(255,255,255,0.08)", background:filter===f?"rgba(99,102,241,0.14)":"transparent", color:filter===f?"#a5b4fc":"#475569" }}>
            {f==="all" ? "All" : `${f}⭐`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color:"#475569", fontSize:13 }}>Loading feedback…</p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.length === 0 && <p style={{ color:"#334155", fontSize:13, textAlign:"center", padding:32 }}>No feedback yet</p>}
          {filtered.map(item => {
            const isGuest = item.userId?.startsWith("guest_");
            return (
              <div key={item.id} className="fb-row">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:item.message?10:0 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <span style={{ fontSize:16 }}>{"⭐".repeat(item.rating)}</span>
                      <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:isGuest?"rgba(148,163,184,0.08)":"rgba(99,102,241,0.08)", border:`1px solid ${isGuest?"rgba(148,163,184,0.2)":"rgba(99,102,241,0.2)"}`, color:isGuest?"#94a3b8":"#818cf8", fontWeight:600 }}>
                        {isGuest ? "Guest" : "Registered"}
                      </span>
                      {item.createdAt?.seconds && (
                        <span style={{ fontSize:10, color:"#1e293b" }}>
                          {new Date(item.createdAt.seconds*1000).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"})}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize:10, color:"#334155", margin:0 }}>ID: <span style={{ color:"#6366f1" }}>{item.userId}</span></p>
                  </div>
                  <button className="fb-del" onClick={() => del(item.id)}>Delete</button>
                </div>
                {item.message && (
                  <p style={{ fontSize:13, color:"#94a3b8", margin:0, lineHeight:1.65, padding:"10px 12px", background:"rgba(255,255,255,0.02)", borderRadius:9 }}>
                    "{item.message}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
