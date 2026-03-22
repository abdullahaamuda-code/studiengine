"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "./Toast";

export default function FeedbackButton() {
  const { userId } = useAuth();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (rating === 0) { show("Pick a star rating first", "error"); return; }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        rating, message: message.trim(), userId: userId || "anonymous",
        createdAt: serverTimestamp(),
      });
      show("Thanks for the feedback! 🙏", "success");
      setOpen(false);
      setRating(0);
      setMessage("");
    } catch (e: any) {
      show("Failed to submit. Try again.", "error");
    }
    setSubmitting(false);
  }

  return (
    <>
      {/* Floating button — bottom left so it doesn't clash with calculator */}
      <button onClick={() => setOpen(true)} style={{
        position: "fixed", bottom: 24, left: 16, zIndex: 55,
        width: 44, height: 44, borderRadius: "50%",
        background: "rgba(8,20,40,0.9)", border: "1px solid rgba(56,139,253,0.25)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", transition: "all 0.2s",
      }} title="Send feedback">
        💬
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(2,8,23,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="glass animate-in" style={{ borderRadius: 18, padding: "24px 20px", width: "100%", maxWidth: 360, position: "relative" }}>
            <button onClick={() => setOpen(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>×</button>

            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: 4 }}>Share your feedback</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Help us improve Studiengine for Nigerian students</p>

            {/* Stars */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 18 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer", filter: s <= (hoverRating || rating) ? "none" : "grayscale(1) opacity(0.3)", transition: "filter 0.15s" }}>
                  ⭐
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p style={{ fontSize: 12, color: "#60a5fa", textAlign: "center", marginBottom: 14 }}>
                {["","Needs a lot of work","Could be better","It's decent","Really good!","Absolutely love it! 🔥"][rating]}
              </p>
            )}

            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Any suggestions or issues? (optional)"
              rows={3}
              className="input-glass"
              style={{ width: "100%", borderRadius: 10, padding: "10px 12px", fontSize: 13, lineHeight: 1.5, marginBottom: 14, boxSizing: "border-box" }} />

            <button onClick={submit} disabled={submitting || rating === 0} className="btn-primary"
              style={{ width: "100%", padding: "12px 0", borderRadius: 10, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {submitting ? <><div className="spinner" /> Submitting...</> : "Submit Feedback →"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
