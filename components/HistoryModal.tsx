"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, orderBy, query, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import MathText from "./MathText";

interface HistoryItem {
  id: string;
  score: number;
  total: number;
  pct: number;
  createdAt: any;
  questions?: any[];
}

interface Props { onClose: () => void; }

export default function HistoryModal({ onClose }: Props) {
  const { userId, isPremium } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !isPremium) { setLoading(false); return; }
    getDocs(query(collection(db, "users", userId, "history"), orderBy("createdAt", "desc"), limit(20)))
      .then(snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })) as HistoryItem[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, isPremium]);

  async function deleteItem(id: string) {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "history", id));
      setItems(i => i.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
  }

  const gradeColor = (pct: number) =>
    pct >= 80 ? "#4ade80" : pct >= 60 ? "#fbbf24" : "#f87171";

  const gradeGlow = (pct: number) =>
    pct >= 80 ? "rgba(74,222,128,0.15)" : pct >= 60 ? "rgba(251,191,36,0.15)" : "rgba(248,113,113,0.15)";

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(4,6,12,0.88)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <style>{`
        @keyframes hist-in {
          from { opacity:0; transform:scale(0.96) translateY(12px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .hist-row {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s;
        }
        .hist-row:hover {
          border-color: rgba(129,140,248,0.25);
          transform: translateY(-1px);
        }
        .del-btn {
          font-size: 10px; padding: 4px 10px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 7px; color: #f87171;
          cursor: pointer; font-family: inherit;
          transition: background 0.15s;
        }
        .del-btn:hover { background: rgba(239,68,68,0.15); }

        .hist-scroll::-webkit-scrollbar       { width: 3px; }
        .hist-scroll::-webkit-scrollbar-track { background: transparent; }
        .hist-scroll::-webkit-scrollbar-thumb { background: rgba(129,140,248,0.2); border-radius: 99px; }
      `}</style>

      <div style={{
        background: "rgba(10,13,22,0.97)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 22,
        width: "100%", maxWidth: 520,
        maxHeight: "88vh",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 60px rgba(99,102,241,0.05)",
        animation: "hist-in 0.25s cubic-bezier(0.4,0,0.2,1)",
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
              }}>◉</div>
              <h2 style={{
                fontSize: 17, fontWeight: 800,
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em", margin: 0,
                color: "#f1f5f9",
              }}>CBT History</h2>
            </div>
            <p style={{ fontSize: 11, color: "#334155", margin: 0, paddingLeft: 38 }}>
              {isPremium
                ? items.length > 0 ? `${items.length} sessions · last 20` : "No sessions yet"
                : "Premium feature"}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#475569", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
          >×</button>
        </div>

        {/* ── Body ── */}
        <div className="hist-scroll" style={{ overflowY: "auto", padding: "16px 18px 22px", flex: 1 }}>

          {/* Not premium */}
          {!isPremium && (
            <div style={{ textAlign: "center", padding: "44px 20px" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, margin: "0 auto 18px",
                background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>🔒</div>
              <p style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-display)", color: "#f1f5f9", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
                History is a Premium feature
              </p>
              <p style={{ fontSize: 13, color: "#475569", margin: "0 0 22px", lineHeight: 1.65 }}>
                Upgrade to track all your CBT sessions and review past questions.
              </p>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 10,
                background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(56,189,248,0.1))",
                border: "1px solid rgba(99,102,241,0.3)",
                fontSize: 13, fontWeight: 700, color: "#a5b4fc",
              }}>⚡ Upgrade to Premium</div>
            </div>
          )}

          {/* Loading */}
          {isPremium && loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "40px 0", justifyContent: "center" }}>
              <div style={{ width: 16, height: 16, border: "2px solid rgba(129,140,248,0.15)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 13, color: "#334155" }}>Loading history…</span>
            </div>
          )}

          {/* Empty */}
          {isPremium && !loading && items.length === 0 && (
            <div style={{ textAlign: "center", padding: "44px 20px" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, margin: "0 auto 18px",
                background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>📚</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px", fontFamily: "var(--font-display)" }}>
                No sessions yet
              </p>
              <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                Complete a CBT to see it here.
              </p>
            </div>
          )}

          {/* Session list */}
          {isPremium && !loading && items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map(item => (
                <div key={item.id}>
                  {/* Row */}
                  <div
                    className="hist-row"
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}
                  >
                    {/* Score ring */}
                    <div style={{ position: "relative", width: 46, height: 46, flexShrink: 0 }}>
                      <svg width="46" height="46" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="23" cy="23" r="19" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                        <circle cx="23" cy="23" r="19" fill="none"
                          stroke={gradeColor(item.pct)} strokeWidth="3.5" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 19}`}
                          strokeDashoffset={`${2 * Math.PI * 19 * (1 - item.pct / 100)}`}
                          style={{ filter: `drop-shadow(0 0 4px ${gradeColor(item.pct)}88)` }}
                        />
                      </svg>
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800, color: gradeColor(item.pct),
                        fontFamily: "var(--font-display)",
                      }}>
                        {item.pct}%
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: "0 0 3px", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
                        {item.score}/{item.total} correct
                      </p>
                      <p style={{ fontSize: 11, color: "#334155", margin: 0 }}>
                        {item.createdAt?.seconds
                          ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                          : "Recent"}
                      </p>
                    </div>

                    {/* Score badge */}
                    <div style={{
                      padding: "3px 10px", borderRadius: 20,
                      background: gradeGlow(item.pct),
                      border: `1px solid ${gradeColor(item.pct)}30`,
                      fontSize: 11, fontWeight: 700,
                      color: gradeColor(item.pct),
                      flexShrink: 0,
                    }}>
                      {item.pct >= 80 ? "Excellent" : item.pct >= 60 ? "Good" : "Retry"}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <button
                        className="del-btn"
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm("Delete this session?")) deleteItem(item.id);
                        }}
                      >Del</button>
                      <span style={{
                        fontSize: 11, color: "#334155",
                        display: "inline-block",
                        transform: expanded === item.id ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}>▾</span>
                    </div>
                  </div>

                  {/* Expanded review */}
                  {expanded === item.id && item.questions && (
                    <div style={{
                      background: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderTop: "none",
                      borderRadius: "0 0 14px 14px",
                      padding: "14px 16px",
                      marginTop: -2,
                    }}>
                      <p style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                        textTransform: "uppercase", color: "#6366f1",
                        margin: "0 0 12px",
                      }}>Question Review</p>

                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {item.questions.map((q: any, i: number) => (
                          <div key={i} style={{
                            padding: "10px 0",
                            borderBottom: i < item.questions!.length - 1
                              ? "1px solid rgba(255,255,255,0.04)" : "none",
                          }}>
                            <p style={{ fontSize: 13, color: "#e2e8f0", margin: "0 0 5px", lineHeight: 1.55 }}>
                              <span style={{ color: "#475569", marginRight: 4 }}>{i + 1}.</span>
                              <MathText text={q.question} />
                            </p>
                            <p style={{ fontSize: 12, color: "#4ade80", margin: "0 0 3px", display: "flex", alignItems: "center", gap: 5 }}>
                              <span style={{ width: 14, height: 14, borderRadius: 4, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, flexShrink: 0 }}>✓</span>
                              <MathText text={q.options?.find((o: string) => o.charAt(0).toUpperCase() === q.answer?.toUpperCase()) || q.answer} />
                            </p>
                            {q.explanation && (
                              <p style={{ fontSize: 11.5, color: "#475569", margin: 0, lineHeight: 1.6, paddingLeft: 19 }}>
                                <MathText text={q.explanation} />
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {isPremium && items.length > 0 && (
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            padding: "12px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: "#1e293b" }}>Last 20 sessions shown</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 5px rgba(52,211,153,0.6)" }} />
              <span style={{ fontSize: 11, color: "#1e293b" }}>Premium</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
