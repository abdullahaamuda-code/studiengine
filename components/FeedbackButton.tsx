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

  const ratingLabels = ["", "Needs work", "Could be better", "It's decent", "Really good!", "Love it! 🔥"];

  return (
    <>
      <style>{`
        @keyframes feedback-in {
          from { opacity:0; transform:scale(0.96) translateY(12px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 0 rgba(129,140,248,0.4); }
          50% { box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(129,140,248,0.6); }
        }
        
        .feedback-btn {
          position: fixed;
          bottom: 24px;
          left: 16px;
          z-index: 55;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(10,13,22,0.95);
          border: 1px solid rgba(129,140,248,0.25);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        .feedback-btn:hover {
          transform: translateY(-2px) scale(1.05);
          border-color: rgba(129,140,248,0.4);
          box-shadow: 0 12px 32px rgba(0,0,0,0.6), 0 0 20px rgba(129,140,248,0.3);
        }
        .feedback-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .star-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 32px;
          padding: 4px;
          transition: all 0.2s;
          position: relative;
        }
        .star-btn:hover {
          transform: scale(1.15) rotate(8deg);
        }
        .star-btn:active {
          transform: scale(1.05);
        }
        .star-inactive {
          filter: grayscale(1) opacity(0.25);
        }

        @media (max-width: 640px) {
          .feedback-btn {
            width: 44px;
            height: 44px;
            bottom: 20px;
            left: 12px;
          }
        }
      `}</style>

      {/* Floating button */}
      <button onClick={() => setOpen(true)} className="feedback-btn" title="Send feedback" aria-label="Send feedback">
        💬
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(4,6,12,0.88)",
            backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{
            background: "rgba(10,13,22,0.97)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 22,
            width: "100%", maxWidth: 420,
            maxHeight: "88vh",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 60px rgba(99,102,241,0.05)",
            animation: "feedback-in 0.25s cubic-bezier(0.4,0,0.2,1)",
            position: "relative",
          }}>
            {/* Top shimmer line */}
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
              background: "linear-gradient(90deg,transparent,rgba(129,140,248,0.45),transparent)",
            }} />

            {/* ── Header ── */}
            <div style={{
              padding: "22px 22px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "rgba(129,140,248,0.1)",
                    border: "1px solid rgba(129,140,248,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: "#818cf8",
                  }}>💬</div>
                  <h2 style={{
                    fontSize: 17, fontWeight: 800,
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.02em", margin: 0,
                    color: "#f1f5f9",
                  }}>Share Feedback</h2>
                </div>
                <p style={{ fontSize: 11, color: "#334155", margin: 0, paddingLeft: 38 }}>
                  Help us improve Studiengine
                </p>
              </div>

              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#475569", fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#475569"; }}
              >×</button>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "24px 22px 22px", flex: 1, overflowY: "auto" }}>
              
              {/* Stars */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "20px 16px",
                marginBottom: 16,
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: "0 0 14px", textAlign: "center", letterSpacing: "0.02em" }}>
                  How would you rate Studiengine?
                </p>
                <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: rating > 0 ? 12 : 0 }}>
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      className={`star-btn ${s > (hoverRating || rating) ? 'star-inactive' : ''}`}
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${s} star${s > 1 ? 's' : ''}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <div style={{
                    textAlign: "center",
                    padding: "8px 12px",
                    background: "rgba(129,140,248,0.1)",
                    border: "1px solid rgba(129,140,248,0.2)",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#a5b4fc",
                  }}>
                    {ratingLabels[rating]}
                  </div>
                )}
              </div>

              {/* Message textarea */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8, letterSpacing: "0.02em" }}>
                  Tell us more (optional)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Any suggestions, issues, or features you'd like to see?"
                  rows={4}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#f1f5f9",
                    fontFamily: "inherit",
                    resize: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(129,140,248,0.3)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Submit button */}
              <button
                onClick={submit}
                disabled={submitting || rating === 0}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  borderRadius: 12,
                  border: "none",
                  background: rating === 0 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#6366f1,#818cf8)",
                  color: rating === 0 ? "#475569" : "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  cursor: rating === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s",
                  boxShadow: rating === 0 ? "none" : "0 4px 16px rgba(99,102,241,0.3)",
                  opacity: submitting ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (rating > 0 && !submitting) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {submitting ? (
                  <>
                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    Submitting...
                  </>
                ) : (
                  <>Submit Feedback →</>
                )}
              </button>
            </div>

            {/* ── Footer hint ── */}
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              padding: "10px 18px",
              flexShrink: 0,
            }}>
              <p style={{ fontSize: 10, color: "#1e293b", margin: 0, textAlign: "center" }}>
                Your feedback helps us build better tools for students 🇳🇬
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
