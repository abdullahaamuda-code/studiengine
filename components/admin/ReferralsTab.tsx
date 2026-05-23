"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface Referral {
  id: string;
  newUserEmail: string;
  newUserUid: string;
  referrerUid: string;
  referralCode: string;
  verified: boolean;
  active: boolean;
  createdAt: string;
}

interface Ambassador {
  id: string;
  email: string;
  approved: boolean;
  tier: "bronze" | "silver" | "gold";
  verifiedCount: number;
  submittedForReview: boolean;
  lastSubmittedAt?: string;
  joinedAt?: string;
  featuredName?: string;
}

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32", silver: "#94a3b8", gold: "#fbbf24"
};

export default function ReferralsTab() {
  const { user } = useAuth();
  const [referrals, setReferrals]       = useState<Referral[]>([]);
  const [ambassadors, setAmbassadors]   = useState<Ambassador[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [toast, setToast]               = useState("");
  const [view, setView]                 = useState<"referrals" | "ambassadors">("referrals");
  const [newAmbEmail, setNewAmbEmail]   = useState("");
  const [addingAmb, setAddingAmb]       = useState(false);
  const [filter, setFilter]             = useState<"all" | "pending" | "verified">("all");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function load() {
    setLoading(true);
    try {
      const [refSnap, ambSnap] = await Promise.all([
        getDocs(query(collection(db,"referrals"), orderBy("createdAt","desc"), limit(200))),
        getDocs(collection(db,"ambassadors")),
      ]);
      setReferrals(refSnap.docs.map(d => ({ id:d.id, ...d.data() })) as Referral[]);
      setAmbassadors(ambSnap.docs.map(d => ({ id:d.id, ...d.data() })) as Ambassador[]);
    } catch (e:any) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function verifyReferral(ref: Referral) {
    await updateDoc(doc(db,"referrals",ref.id), { verified:true });
    // increment referrer's verifiedCount
    const ambRef = doc(db,"ambassadors",ref.referrerUid);
    const ambSnap = await import("firebase/firestore").then(fb => fb.getDoc(ambRef));
    const cur = ambSnap.exists() ? (ambSnap.data()?.verifiedCount||0) : 0;
    await setDoc(ambRef, { verifiedCount: cur+1 }, { merge:true });
    showToast("Referral verified ✓");
    load();
  }

  async function rejectReferral(id: string) {
    await updateDoc(doc(db,"referrals",id), { verified:false, rejected:true });
    showToast("Referral rejected");
    load();
  }

  async function approveAmbassador(uid: string, email: string) {
    await setDoc(doc(db,"ambassadors",uid), {
      approved:true, email, tier:"bronze",
      verifiedCount:0, joinedAt: new Date().toISOString(),
    }, { merge:true });
    showToast("Ambassador approved ✓");
    load();
  }

  async function updateTier(uid: string, tier: string) {
    await setDoc(doc(db,"ambassadors",uid), { tier }, { merge:true });
    showToast(`Tier updated to ${tier} ✓`);
    load();
  }

  async function clearReviewFlag(uid: string) {
    await setDoc(doc(db,"ambassadors",uid), { submittedForReview:false }, { merge:true });
    showToast("Review flag cleared");
    load();
  }

  async function addAmbassadorByEmail() {
    if (!newAmbEmail.trim()) return;
    setAddingAmb(true);
    try {
      // Find user in usage collection by email
      const usageSnap = await getDocs(collection(db,"usage"));
      const match = usageSnap.docs.find(d => (d.data() as any).email === newAmbEmail.trim());
      if (!match) { showToast("No user found with that email"); setAddingAmb(false); return; }
      await setDoc(doc(db,"ambassadors",match.id), {
        approved:true, email:newAmbEmail.trim(), tier:"bronze",
        verifiedCount:0, joinedAt: new Date().toISOString(),
      }, { merge:true });
      setNewAmbEmail("");
      showToast("Ambassador added ✓");
      load();
    } catch (e:any) { showToast(`Error: ${e.message}`); }
    setAddingAmb(false);
  }

  const filtered = referrals.filter(r =>
    filter==="pending"  ? !r.verified :
    filter==="verified" ? r.verified  : true
  );

  const pendingReviews = ambassadors.filter(a => a.submittedForReview);

  return (
    <div>
      <style>{`
        @keyframes ref-spin { to{transform:rotate(360deg)} }
        .ref-tab { padding:8px 16px; border-radius:8px; border:1px solid; font-size:13px; cursor:pointer; font-family:inherit; transition:all 0.15s; }
        .ref-tab-active { background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(56,189,248,0.1)); border-color:rgba(99,102,241,0.4); color:#a5b4fc; font-weight:700; }
        .ref-tab-inactive { background:transparent; border-color:rgba(255,255,255,0.08); color:#475569; }
        .ref-tab-inactive:hover { background:rgba(255,255,255,0.04); color:#94a3b8; }
        .ref-row { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:13px 15px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; transition:border-color 0.15s; }
        .ref-row:hover { border-color:rgba(255,255,255,0.12); }
        .action-sm { font-size:11px; padding:5px 11px; border-radius:7px; cursor:pointer; font-family:inherit; border:1px solid; transition:opacity 0.15s; white-space:nowrap; }
        .action-sm:hover { opacity:0.8; }
        .r-input { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:9px; color:#f1f5f9; padding:9px 12px; font-size:13px; outline:none; font-family:inherit; transition:border-color 0.2s; }
        .r-input:focus { border-color:rgba(99,102,241,0.5); }
      `}</style>

      {toast && (
        <div style={{ marginBottom:12, padding:"9px 14px", background:"rgba(4,47,29,0.7)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:9, color:"#6ee7b7", fontSize:13 }}>{toast}</div>
      )}
      {error && (
        <div style={{ marginBottom:12, padding:"9px 14px", background:"rgba(36,10,10,0.7)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:9, color:"#fca5a5", fontSize:13 }}>⚠ {error}</div>
      )}

      {/* Pending review alert */}
      {pendingReviews.length > 0 && (
        <div style={{ marginBottom:16, padding:"12px 16px", background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.22)", borderRadius:12, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>⏳</span>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:"#fbbf24", margin:"0 0 2px" }}>{pendingReviews.length} ambassador{pendingReviews.length>1?"s":""} submitted for tier review</p>
            <p style={{ fontSize:12, color:"#92400e", margin:0 }}>Switch to Ambassadors view to process them.</p>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        <button className={`ref-tab ${view==="referrals"?"ref-tab-active":"ref-tab-inactive"}`} onClick={()=>setView("referrals")}>
          Referrals ({referrals.length})
        </button>
        <button className={`ref-tab ${view==="ambassadors"?"ref-tab-active":"ref-tab-inactive"}`} onClick={()=>setView("ambassadors")}>
          Ambassadors ({ambassadors.length})
          {pendingReviews.length > 0 && <span style={{ marginLeft:6, background:"rgba(251,191,36,0.2)", border:"1px solid rgba(251,191,36,0.4)", color:"#fbbf24", fontSize:10, padding:"1px 6px", borderRadius:99, fontWeight:800 }}>{pendingReviews.length}</span>}
        </button>
      </div>

      {loading ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"32px 0" }}>
          <div style={{ width:16, height:16, border:"2px solid rgba(129,140,248,0.15)", borderTopColor:"#818cf8", borderRadius:"50%", animation:"ref-spin 0.8s linear infinite" }} />
          <span style={{ fontSize:13, color:"#334155" }}>Loading…</span>
        </div>
      ) : view === "referrals" ? (
        <>
          {/* Filter */}
          <div style={{ display:"flex", gap:6, marginBottom:14 }}>
            {(["all","pending","verified"] as const).map(f => (
              <button key={f} onClick={()=>setFilter(f)}
                style={{ padding:"5px 13px", borderRadius:7, border:"1px solid", fontSize:12, cursor:"pointer", fontFamily:"inherit", borderColor:filter===f?"rgba(99,102,241,0.45)":"rgba(255,255,255,0.08)", background:filter===f?"rgba(99,102,241,0.14)":"transparent", color:filter===f?"#a5b4fc":"#475569", fontWeight:filter===f?700:400, transition:"all 0.15s" }}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
                {f==="pending" && <span style={{ marginLeft:5, fontSize:10 }}>({referrals.filter(r=>!r.verified).length})</span>}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtered.length === 0 && <p style={{ color:"#334155", fontSize:13, textAlign:"center", padding:32 }}>No referrals found</p>}
            {filtered.map(r => (
              <div key={r.id} className="ref-row">
                <div style={{ flex:1, minWidth:160 }}>
                  <p style={{ fontSize:13, color:"#f1f5f9", margin:"0 0 2px", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.newUserEmail}</p>
                  <p style={{ fontSize:11, color:"#334155", margin:"0 0 1px" }}>Code: <span style={{ color:"#818cf8", fontWeight:700 }}>{r.referralCode}</span></p>
                  <p style={{ fontSize:10, color:"#1e293b", margin:0 }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "—"}</p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                  <span style={{ fontSize:11, padding:"3px 9px", borderRadius:99, fontWeight:700, background:r.verified?"rgba(52,211,153,0.1)":"rgba(251,191,36,0.08)", border:`1px solid ${r.verified?"rgba(52,211,153,0.25)":"rgba(251,191,36,0.2)"}`, color:r.verified?"#34d399":"#fbbf24" }}>
                    {r.verified ? "Verified" : "Pending"}
                  </span>
                  {r.active && <span style={{ fontSize:10, color:"#818cf8" }}>Used app ✓</span>}
                </div>
                {!r.verified && (
                  <div style={{ display:"flex", gap:6 }}>
                    <button className="action-sm" onClick={()=>verifyReferral(r)}
                      style={{ background:"rgba(52,211,153,0.1)", borderColor:"rgba(52,211,153,0.3)", color:"#34d399" }}>
                      Verify ✓
                    </button>
                    <button className="action-sm" onClick={()=>rejectReferral(r.id)}
                      style={{ background:"rgba(239,68,68,0.08)", borderColor:"rgba(239,68,68,0.25)", color:"#f87171" }}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Add ambassador */}
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:13, padding:"16px", marginBottom:16 }}>
            <p style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", margin:"0 0 10px" }}>Add Ambassador by Email</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <input value={newAmbEmail} onChange={e=>setNewAmbEmail(e.target.value)} placeholder="user@email.com" className="r-input" style={{ flex:1, minWidth:200 }} />
              <button onClick={addAmbassadorByEmail} disabled={addingAmb}
                style={{ padding:"9px 18px", background:"linear-gradient(135deg,#6366f1,#4f46e5)", border:"none", borderRadius:9, color:"#fff", fontSize:13, fontWeight:700, cursor:addingAmb?"not-allowed":"pointer", fontFamily:"inherit", opacity:addingAmb?0.6:1 }}>
                {addingAmb ? "Adding…" : "Add Ambassador"}
              </button>
            </div>
          </div>

          {/* Ambassador list */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ambassadors.length===0 && <p style={{ color:"#334155", fontSize:13, textAlign:"center", padding:32 }}>No ambassadors yet</p>}
            {ambassadors.map(a => {
              const tc = TIER_COLORS[a.tier] || "#94a3b8";
              return (
                <div key={a.id} className="ref-row" style={{ borderColor: a.submittedForReview ? "rgba(251,191,36,0.3)" : undefined }}>
                  {a.submittedForReview && (
                    <div style={{ position:"absolute", top:-1, right:12, fontSize:9, background:"rgba(251,191,36,0.2)", border:"1px solid rgba(251,191,36,0.4)", color:"#fbbf24", padding:"2px 8px", borderRadius:"0 0 6px 6px", fontWeight:800 }}>REVIEW PENDING</div>
                  )}
                  <div style={{ flex:1, minWidth:160 }}>
                    <p style={{ fontSize:13, color:"#f1f5f9", margin:"0 0 2px", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.email}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:tc }}>{a.tier.charAt(0).toUpperCase()+a.tier.slice(1)}</span>
                      <span style={{ fontSize:10, color:"#334155" }}>· {a.verifiedCount||0} verified</span>
                    </div>
                  </div>

                  {/* Tier selector */}
                  <select value={a.tier} onChange={e=>updateTier(a.id,e.target.value)}
                    style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:8, color:"#f1f5f9", padding:"6px 10px", fontSize:12, cursor:"pointer", fontFamily:"inherit", outline:"none" }}>
                    <option value="bronze">🥉 Bronze</option>
                    <option value="silver">🥈 Silver</option>
                    <option value="gold">🥇 Gold</option>
                  </select>

                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {a.submittedForReview && (
                      <button className="action-sm" onClick={()=>clearReviewFlag(a.id)}
                        style={{ background:"rgba(56,189,248,0.08)", borderColor:"rgba(56,189,248,0.25)", color:"#38bdf8" }}>
                        Clear Review
                      </button>
                    )}
                    {!a.approved && (
                      <button className="action-sm" onClick={()=>approveAmbassador(a.id,a.email)}
                        style={{ background:"rgba(52,211,153,0.1)", borderColor:"rgba(52,211,153,0.3)", color:"#34d399" }}>
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
