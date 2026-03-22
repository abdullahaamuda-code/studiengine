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

  const gradeColor = (pct: number) => pct >= 80 ? "#4ade80" : pct >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(2,8,23,0.88)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass animate-in" style={{ borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(56,139,253,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", margin: 0 }}>CBT History</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>{isPremium ? `${items.length} sessions` : "Premium feature"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer", padding: 4 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: "auto", padding: "14px 16px", flex: 1 }}>
          {!isPremium ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: "var(--font-display)" }}>History is a Premium feature</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Upgrade to track all your CBT sessions and review past questions.</p>
            </div>
          ) : loading ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>Loading history...</p>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 20px" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📚</p>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>No CBT sessions yet. Complete a CBT to see it here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map(item => (
                <div key={item.id}>
                  <div
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Score ring */}
                    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                      <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                        <circle cx="22" cy="22" r="18" fill="none" stroke={gradeColor(item.pct)} strokeWidth="3.5" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 18}`}
                          strokeDashoffset={`${2 * Math.PI * 18 * (1 - item.pct / 100)}`} />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: gradeColor(item.pct) }}>
                        {item.pct}%
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 3px" }}>
                        {item.score}/{item.total} correct
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                        {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Recent"}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={e => { e.stopPropagation(); if (confirm("Delete this session?")) deleteItem(item.id); }}
                      style={{ fontSize: 10, padding: "3px 8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#f87171", cursor: "pointer" }}>Del</button>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", transition: "transform 0.2s", display: "inline-block", transform: expanded === item.id ? "rotate(180deg)" : "none" }}>▾</span>
                  </div>
                  </div>

                  {/* Expanded review */}
                  {expanded === item.id && item.questions && (
                    <div style={{ background: "rgba(5,12,28,0.6)", border: "1px solid rgba(56,139,253,0.1)", borderRadius: "0 0 12px 12px", padding: "12px 14px", marginTop: -6 }}>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Question Review</p>
                      {item.questions.map((q: any, i: number) => (
                        <div key={i} style={{ padding: "8px 0", borderBottom: i < item.questions!.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <p style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>
                            {i + 1}. <MathText text={q.question} />
                          </p>
                          <p style={{ fontSize: 12, color: "#4ade80", margin: "0 0 2px" }}>
                            ✓ <MathText text={q.options?.find((o: string) => o.charAt(0).toUpperCase() === q.answer?.toUpperCase()) || q.answer} />
                          </p>
                          {q.explanation && (
                            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                              <MathText text={q.explanation} />
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
