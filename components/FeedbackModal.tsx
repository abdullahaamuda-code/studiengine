"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "./Toast";

interface Props { onClose: () => void; }

export default function FeedbackModal({ onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { userId, user, isGuest } = useAuth();
  const { show } = useToast();

  async function submit() {
    if (!rating) { show("Pick a rating first", "error"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "feedback"), {
        rating,
        message: message.trim(),
        userId: userId || "anonymous",
        email: user?.email || (isGuest ? "guest" : "anonymous"),
        createdAt: serverTimestamp(),
      });
      show("Thanks for the feedback! 🙏", "success");
      onClose();
    } catch (e) {
      show("Failed to send. Try again.", "error");
    }
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(2,8,23,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass animate-in" style={{ borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

        <h2 style={{ fontSize: 17, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4, color: "var(--text-primary)" }}>Share your feedback</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Help us make Studiengine better for Nigerian students.</p>

        {/* Stars */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "center" }}>
          {[1,2,3,4,5].map(s => (
            <button key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              style={{
                fontSize: 32, background: "none", border: "none", cursor: "pointer",
                opacity: (hovered || rating) >= s ? 1 : 0.3,
                transform: (hovered || rating) >= s ? "scale(1.15)" : "scale(1)",
                transition: "all 0.15s",
              }}>
              ⭐
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 16, marginTop: -12 }}>
            {rating === 1 ? "Very poor" : rating === 2 ? "Poor" : rating === 3 ? "Okay" : rating === 4 ? "Good" : "Excellent!"}
          </p>
        )}

        <textarea
          className="input-glass"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Any thoughts? What can we improve? (optional)"
          rows={3}
          style={{ width: "100%", borderRadius: 10, padding: "10px 12px", fontSize: 13, lineHeight: 1.5, resize: "none", marginBottom: 14 }}
        />

        <button className="btn-primary" onClick={submit} disabled={loading || !rating}
          style={{ width: "100%", padding: "12px 0", borderRadius: 12, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {loading ? <><div className="spinner" /> Sending...</> : "Send Feedback"}
        </button>
      </div>
    </div>
  );
}
