"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, doc, setDoc, updateDoc,
  deleteDoc, writeBatch, query, limit, Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface UserRow {
  id: string;
  email?: string;
  quizCount: number;
  scanCount: number;
  isPremium: boolean;
  lastReset: string;
  premiumExpiry?: any;
  premiumPlan?: string;
  referralCode?: string;
  referredBy?: string;
  allTimeQuizCount?: number;
}

export default function UsersTab() {
  const { user } = useAuth();
  const [users, setUsers]             = useState<UserRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterPlan, setFilterPlan]   = useState<"all"|"premium"|"free">("all");
  const [error, setError]             = useState("");
  const [toast, setToast]             = useState("");
  const [resettingAll, setResettingAll] = useState(false);
  const [expandBulk, setExpandBulk]   = useState(false);
  const [bulkExpiry, setBulkExpiry]   = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [expiryInputs, setExpiryInputs] = useState<Record<string,string>>({});

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function load() {
    setLoading(true); setError("");
    try {
      const snap = await getDocs(query(collection(db,"usage"), limit(200)));
      const data = snap.docs.map(d => ({ id:d.id, ...d.data() })) as UserRow[];
      setUsers(data);
      const inputs: Record<string,string> = {};
      data.forEach(u => {
        if (u.premiumExpiry?.toDate) {
          inputs[u.id] = (u.premiumExpiry.toDate() as Date).toISOString().slice(0,10);
        }
      });
      setExpiryInputs(inputs);
    } catch (e:any) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function grantPremiumUntil(userId: string) {
    const dateStr = expiryInputs[userId];
    if (!dateStr) { showToast("Pick an expiry date first"); return; }
    const date = new Date(dateStr + "T23:59:59");
    await setDoc(doc(db,"usage",userId), { isPremium:true, premiumExpiry:Timestamp.fromDate(date) }, { merge:true });
    showToast("Premium granted ✓"); load();
  }

  async function togglePremium(userId: string, current: boolean) {
    await setDoc(doc(db,"usage",userId), { isPremium:!current }, { merge:true });
    showToast(current ? "Premium removed" : "Premium granted ✓"); load();
  }

  async function resetLimits(userId: string) {
    const today = new Date().toISOString().split("T")[0];
    await updateDoc(doc(db,"usage",userId), { quizCount:0, scanCount:0, lastReset:today });
    showToast("Limits reset ✓"); load();
  }

  async function deleteUser(userId: string) {
    await deleteDoc(doc(db,"usage",userId));
    showToast("User deleted"); load();
  }

  async function resetAll() {
    if (!confirm("Reset ALL user daily limits?")) return;
    setResettingAll(true);
    const today = new Date().toISOString().split("T")[0];
    const snap  = await getDocs(collection(db,"usage"));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { quizCount:0, scanCount:0, lastReset:today }));
    await batch.commit();
    showToast(`Reset ${snap.size} users ✓`); setResettingAll(false); load();
  }

  async function grantAllPremium() {
    if (!confirm(`Grant Premium to ALL ${users.length} users?`)) return;
    setBulkLoading(true);
    try {
      const snap  = await getDocs(collection(db,"usage"));
      const batch = writeBatch(db);
      const payload: any = { isPremium:true };
      if (bulkExpiry) payload.premiumExpiry = Timestamp.fromDate(new Date(bulkExpiry+"T23:59:59"));
      snap.docs.forEach(d => batch.set(d.ref, payload, { merge:true }));
      await batch.commit();
      showToast(`Premium granted to ${snap.size} users ✓`); load();
    } catch (e:any) { setError(e.message); }
    setBulkLoading(false);
  }

  async function revokeAllPremium() {
    const premCount = users.filter(u=>u.isPremium).length;
    if (!confirm(`Remove Premium from ${premCount} users?`)) return;
    setRevokeLoading(true);
    try {
      const snap  = await getDocs(collection(db,"usage"));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.set(d.ref, { isPremium:false, premiumExpiry:null }, { merge:true }));
      await batch.commit();
      showToast("All Premium removed ✓"); load();
    } catch (e:any) { setError(e.message); }
    setRevokeLoading(false);
  }

  const now          = new Date();
  const premiumCount = users.filter(u=>u.isPremium).length;
  const freeCount    = users.length - premiumCount;

  const filtered = users.filter(u => {
    const matchSearch = u.id.toLowerCase().includes(search.toLowerCase()) ||
      (u.email||"").toLowerCase().includes(search.toLowerCase());
    const matchPlan =
      filterPlan === "all"     ? true :
      filterPlan === "premium" ? u.isPremium :
      !u.isPremium;
    return matchSearch && matchPlan;
  });

  return (
    <div>
      <style>{`
        @keyframes u-spin { to{transform:rotate(360deg)} }
        .u-input { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:10px; color:#f1f5f9; padding:9px 13px; font-size:13px; outline:none; font-family:inherit; transition:border-color 0.2s; }
        .u-input:focus { border-color:rgba(99,102,241,0.5); }
        .u-row { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); border-radius:13px; padding:13px 15px; transition:border-color 0.15s; }
        .u-row:hover { border-color:rgba(255,255,255,0.11); }
        .u-btn { font-size:11px; padding:5px 11px; border-radius:7px; cursor:pointer; font-family:inherit; border:1px solid; transition:opacity 0.15s; white-space:nowrap; }
        .u-btn:hover { opacity:0.8; }
        .filter-pill { padding:6px 14px; border-radius:99px; border:1px solid; font-size:12px; cursor:pointer; font-family:inherit; transition:all 0.15s; }
        .bulk-panel { background:rgba(255,255,255,0.02); border:1px solid rgba(251,191,36,0.18); border-radius:14px; padding:16px; margin-bottom:18px; }
        @media(max-width:640px) {
          .u-row { flex-direction:column !important; align-items:flex-start !important; }
          .u-actions { width:100%; }
          .u-stats { width:100%; }
        }
      `}</style>

      {/* Toast */}
      {toast && <div style={{ marginBottom:12, padding:"9px 14px", background:"rgba(4,47,29,0.7)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:9, color:"#6ee7b7", fontSize:13 }}>{toast}</div>}
      {error && <div style={{ marginBottom:12, padding:"9px 14px", background:"rgba(36,10,10,0.7)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:9, color:"#fca5a5", fontSize:13 }}>⚠ {error}</div>}

      {/* Summary */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {[
          { label:`${users.length} Total`,    bg:"rgba(99,102,241,0.08)",  border:"rgba(99,102,241,0.2)",  color:"#818cf8"  },
          { label:`${premiumCount} Premium`,  bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.2)",  color:"#fbbf24"  },
          { label:`${freeCount} Free`,        bg:"rgba(148,163,184,0.06)", border:"rgba(148,163,184,0.15)", color:"#94a3b8" },
        ].map(s => (
          <div key={s.label} style={{ padding:"5px 14px", background:s.bg, border:`1px solid ${s.border}`, borderRadius:99, fontSize:12, color:s.color, fontWeight:700 }}>{s.label}</div>
        ))}
      </div>

      {/* Bulk panel */}
      <div className="bulk-panel">
        <button onClick={() => setExpandBulk(v=>!v)}
          style={{ background:"none", border:"none", color:"#fbbf24", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", padding:0, display:"flex", alignItems:"center", gap:8, width:"100%" }}>
          <span>⚡</span> Bulk Premium Controls
          <span style={{ marginLeft:"auto", fontSize:11, color:"#475569" }}>{expandBulk?"▲":"▼"}</span>
        </button>

        {expandBulk && (
          <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <div>
                <p style={{ fontSize:11, color:"#475569", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>Expiry date (optional)</p>
                <input type="date" value={bulkExpiry} onChange={e=>setBulkExpiry(e.target.value)} className="u-input" />
              </div>
              <p style={{ fontSize:12, color:"#334155", alignSelf:"flex-end", marginBottom:9 }}>
                {bulkExpiry ? `Expires ${bulkExpiry}` : "No date = permanent"}
              </p>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button onClick={grantAllPremium} disabled={bulkLoading}
                style={{ padding:"10px 18px", borderRadius:10, border:"1px solid rgba(251,191,36,0.3)", background:"rgba(251,191,36,0.1)", color:"#fbbf24", fontSize:13, fontWeight:600, cursor:bulkLoading?"not-allowed":"pointer", fontFamily:"inherit" }}>
                {bulkLoading ? "Granting…" : `⚡ Grant All (${users.length}) Premium`}
              </button>
              <button onClick={revokeAllPremium} disabled={revokeLoading}
                style={{ padding:"10px 18px", borderRadius:10, border:"1px solid rgba(239,68,68,0.25)", background:"rgba(239,68,68,0.08)", color:"#f87171", fontSize:13, fontWeight:600, cursor:revokeLoading?"not-allowed":"pointer", fontFamily:"inherit" }}>
                {revokeLoading ? "Revoking…" : `✕ Remove All Premium (${premiumCount})`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search + filters + reset all */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search email or ID…" className="u-input" style={{ flex:1, minWidth:180 }} />
        <div style={{ display:"flex", gap:6 }}>
          {(["all","premium","free"] as const).map(f => (
            <button key={f} className="filter-pill" onClick={() => setFilterPlan(f)}
              style={{ borderColor:filterPlan===f?"rgba(99,102,241,0.45)":"rgba(255,255,255,0.08)", background:filterPlan===f?"rgba(99,102,241,0.14)":"transparent", color:filterPlan===f?"#a5b4fc":"#475569" }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={resetAll} disabled={resettingAll}
          style={{ padding:"9px 14px", background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:10, color:"#fbbf24", fontSize:12, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
          {resettingAll ? "Resetting…" : "🔄 Reset All Limits"}
        </button>
      </div>

      {/* User list */}
      {loading ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"32px 0" }}>
          <div style={{ width:16, height:16, border:"2px solid rgba(129,140,248,0.15)", borderTopColor:"#818cf8", borderRadius:"50%", animation:"u-spin 0.8s linear infinite" }} />
          <span style={{ fontSize:13, color:"#334155" }}>Loading users…</span>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.length === 0 && <p style={{ color:"#334155", fontSize:13, textAlign:"center", padding:32 }}>No users found</p>}

          {filtered.map(u => {
            const isGuest    = u.id.startsWith("guest_");
            const expDate    = u.premiumExpiry?.toDate ? u.premiumExpiry.toDate() as Date : null;
            const isExpired  = expDate && expDate < now;
            const planLabel  = u.isPremium && expDate
              ? isExpired ? "⚠ Expired" : `⚡ Until ${expDate.toISOString().slice(0,10)}`
              : u.isPremium ? "⚡ Premium" : "Free";
            const planColor  = u.isPremium && !isExpired ? "#fbbf24" : isExpired ? "#f87171" : "#475569";
            const planBg     = u.isPremium && !isExpired ? "rgba(251,191,36,0.08)" : isExpired ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.03)";

            return (
              <div key={u.id} className="u-row" style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", borderColor: u.isPremium && !isExpired ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.07)" }}>

                {/* Info */}
                <div style={{ flex:1, minWidth:180 }}>
                  <p style={{ fontSize:13, color:"#f1f5f9", margin:"0 0 2px", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {u.email || (isGuest ? "Guest" : "No email")}
                  </p>
                  <p style={{ fontSize:10, color:"#334155", margin:"0 0 1px" }}>
                    {isGuest?"👤":"🔐"} <span style={{ color:"#6366f1" }}>{u.id.slice(0,20)}{u.id.length>20?"…":""}</span>
                  </p>
                  {u.referralCode && <p style={{ fontSize:10, color:"#475569", margin:0 }}>Code: <span style={{ color:"#818cf8" }}>{u.referralCode}</span></p>}
                </div>

                {/* Stats */}
                <div className="u-stats" style={{ display:"flex", gap:16 }}>
                  <div style={{ textAlign:"center" }}>
                    <p style={{ fontSize:10, color:"#334155", margin:"0 0 1px" }}>CBTs</p>
                    <p style={{ fontSize:16, fontWeight:700, color:u.quizCount>=3?"#f87171":"#34d399", margin:0, fontFamily:"var(--font-display)" }}>{u.quizCount}</p>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <p style={{ fontSize:10, color:"#334155", margin:"0 0 1px" }}>Scans</p>
                    <p style={{ fontSize:16, fontWeight:700, color:"#94a3b8", margin:0, fontFamily:"var(--font-display)" }}>{u.scanCount}</p>
                  </div>
                  {u.allTimeQuizCount ? (
                    <div style={{ textAlign:"center" }}>
                      <p style={{ fontSize:10, color:"#334155", margin:"0 0 1px" }}>All-time</p>
                      <p style={{ fontSize:16, fontWeight:700, color:"#818cf8", margin:0, fontFamily:"var(--font-display)" }}>{u.allTimeQuizCount}</p>
                    </div>
                  ) : null}
                </div>

                {/* Plan + expiry */}
                <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:150 }}>
                  <span style={{ fontSize:11, padding:"3px 10px", borderRadius:99, background:planBg, border:`1px solid ${planColor}30`, color:planColor, fontWeight:700, width:"fit-content" }}>
                    {planLabel}
                  </span>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <input type="date" value={expiryInputs[u.id]||""} onChange={e=>setExpiryInputs(p=>({...p,[u.id]:e.target.value}))}
                      style={{ fontSize:11, padding:"4px 8px", borderRadius:7, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"#e2e8f0", fontFamily:"inherit", outline:"none" }} />
                    <button className="u-btn" onClick={() => grantPremiumUntil(u.id)}
                      style={{ background:"rgba(99,102,241,0.12)", borderColor:"rgba(99,102,241,0.3)", color:"#a5b4fc" }}>
                      {u.isPremium ? "Update" : "Grant ⚡"}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="u-actions" style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <button className="u-btn" onClick={() => togglePremium(u.id, u.isPremium)}
                    style={{ background:u.isPremium?"rgba(239,68,68,0.08)":"rgba(251,191,36,0.08)", borderColor:u.isPremium?"rgba(239,68,68,0.25)":"rgba(251,191,36,0.25)", color:u.isPremium?"#f87171":"#fbbf24" }}>
                    {u.isPremium ? "Remove ⚡" : "Grant ⚡"}
                  </button>
                  <button className="u-btn" onClick={() => resetLimits(u.id)}
                    style={{ background:"rgba(56,189,248,0.08)", borderColor:"rgba(56,189,248,0.25)", color:"#38bdf8" }}>
                    Reset
                  </button>
                  <button className="u-btn" onClick={() => { if(confirm(`Delete ${u.email||u.id}?`)) deleteUser(u.id); }}
                    style={{ background:"rgba(239,68,68,0.07)", borderColor:"rgba(239,68,68,0.2)", color:"#f87171" }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
