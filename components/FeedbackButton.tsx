"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "./Toast";

const LABELS = ["", "Needs work", "Could be better", "It's decent", "Really good!", "Love it! 🔥"];

export default function FeedbackButton() {
  const { userId } = useAuth();
  const { show } = useToast();
  const [open, setOpen]           = useState(false);
  const [rating, setRating]       = useState(0);
  const [hoverRating, setHover]   = useState(0);
  const [message, setMessage]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (rating === 0) { show("Pick a star rating first", "error"); return; }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        rating, message: message.trim(),
        userId: userId || "anonymous",
        createdAt: serverTimestamp(),
      });
      show("Thanks for the feedback! 🙏", "success");
      setOpen(false); setRating(0); setMessage("");
    } catch { show("Failed to submit. Try again.", "error"); }
    setSubmitting(false);
  }

  const active = hoverRating || rating;

  return (
    <>
      <style>{`
        @keyframes fb-in { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .fb-fab { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .fb-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(0,0,0,0.55) !important; }
        .star-btn { background:none; border:none; cursor:pointer; padding:2px; transition: transform 0.12s; line-height:1; }
        .star-btn:hover { transform: scale(1.15); }
        .fb-submit:hover:not(:disabled) { box-shadow: 0 6px 28px rgba(99,102,241,0.5) !important; }
      `}</style>

      {/* FAB — bottom left */}
      <button className="fb-fab" onClick={() => setOpen(true)} title="Send feedback" style={{
        position:"fixed", bottom:24, left:16, zIndex:55,
        width:48, height:48, borderRadius:"50%",
        background:"rgba(10,13,22,0.92)",
        border:"1px solid rgba(255,255,255,0.1)",
        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:20, boxShadow:"0 4px 20px rgba(0,0,0,0.45)",
      }}>💬</button>

      {/* Modal */}
      {open && (
        <div style={{ position:"fixed", inset:0, zIndex:150, background:"rgba(4,6,12,0.85)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>

          <div style={{ background:"rgba(10,13,22,0.97)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:22, padding:"28px 24px", width:"100%", maxWidth:370, position:"relative", boxShadow:"0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)", animation:"fb-in 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
            {/* Top glow */}
            <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.4),transparent)" }} />

            {/* Close */}
            <button onClick={() => setOpen(false)} style={{ position:"absolute", top:14, right:14, width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"#475569", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.1)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)";}}>×</button>

            {/* Header */}
            <div style={{ marginBottom:22 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:14 }}>💬</div>
              <h3 style={{ fontSize:18, fontWeight:800, fontFamily:"var(--font-display)", color:"#f1f5f9", margin:"0 0 5px", letterSpacing:"-0.02em" }}>Share your feedback</h3>
              <p style={{ fontSize:13, color:"#475569", margin:0 }}>Help us improve Studiengine for African students</p>
            </div>

            {/* Stars */}
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#334155", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>How would you rate us?</p>
              <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} className="star-btn"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    style={{ fontSize:32, filter: s <= active ? "none" : "grayscale(1) opacity(0.25)", transition:"filter 0.15s, transform 0.12s" }}>
                    ⭐
                  </button>
                ))}
              </div>
              {active > 0 && (
                <p style={{ fontSize:12.5, color:"#818cf8", textAlign:"center", marginTop:8, fontWeight:600, minHeight:18 }}>
                  {LABELS[active]}
                </p>
              )}
            </div>

            {/* Divider */}
            <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)", marginBottom:14 }} />

            {/* Textarea */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Any suggestions or issues? (optional)"
              rows={3}
              className="input-glass"
              style={{ width:"100%", borderRadius:10, padding:"11px 13px", fontSize:13, lineHeight:1.55, marginBottom:14, boxSizing:"border-box", resize:"vertical" }}
            />

            {/* Submit */}
            <button className="fb-submit" onClick={submit} disabled={submitting || rating === 0} className="btn-primary" style={{ width:"100%", padding:"13px 0", borderRadius:11, fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 20px rgba(99,102,241,0.3)", transition:"all 0.2s", opacity: rating === 0 ? 0.4 : 1 }}>
              {submitting ? <><span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"auth-spin 0.65s linear infinite", display:"inline-block" }} /> Submitting…</> : "Submit Feedback →"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
