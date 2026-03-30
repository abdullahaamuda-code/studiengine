"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  deleteDoc,
  doc,
} from "firebase/firestore";
import MathText from "@/components/MathText";

interface SessionQuestion {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  year?: string;
  subject?: string | null;
}

interface Session {
  id: string;
  userId: string;
  userEmail?: string | null;
  subject?: string | null;
  score: number;
  total: number;
  pct: number;
  createdAt?: any;
  questions?: SessionQuestion[];
}

export default function SessionsTab() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Session | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "cbtSessions"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const snap = await getDocs(q);
        const data: Session[] = [];
        snap.forEach(s => {
          const d = s.data() as any;
          data.push({
            id: s.id,
            userId: d.userId,
            userEmail: d.userEmail || null,
            subject: d.subject || null,
            score: d.score,
            total: d.total,
            pct: d.pct,
            createdAt: d.createdAt,
            questions: d.questions || [],
          });
        });
        setSessions(data);
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function deleteSession(id: string) {
    if (!confirm("Delete this CBT session?")) return;
    await deleteDoc(doc(db, "cbtSessions", id));
    setSessions(s => s.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  return (
    <div>
      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 14px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8,
            color: "#f87171",
            fontSize: 13,
          }}
        >
          ⚠️ {error}
        </div>
      )}
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Recent CBT Sessions</h2>
      {loading ? (
        <p style={{ color: "#475569", fontSize: 13 }}>Loading sessions...</p>
      ) : (
        <div
          style={{
            borderRadius: 12,
            border: "1px solid rgba(56,139,253,0.15)",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              fontSize: 12,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "rgba(15,23,42,0.9)",
                  borderBottom: "1px solid rgba(30,64,175,0.5)",
                }}
              >
                <th style={{ textAlign: "left", padding: "8px 10px" }}>
                  User / ID
                </th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>
                  Email
                </th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>
                  Subject
                </th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>
                  Score
                </th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>
                  Date
                </th>
                <th style={{ padding: "8px 10px" }} />
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const isGuest = s.userId?.startsWith("guest_");
                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: "1px solid rgba(15,23,42,0.8)",
                      background: "rgba(15,23,42,0.4)",
                    }}
                  >
                    <td style={{ padding: "8px 10px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#e2e8f0" }}>
                          {isGuest ? "Guest" : "Registered"}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: "#60a5fa",
                            wordBreak: "break-all",
                          }}
                        >
                          {s.userId}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 10px", color: "#94a3b8" }}>
                      {s.userEmail || "-"}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#cbd5f5" }}>
                      {s.subject || "-"}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#e5e7eb" }}>
                      {s.score}/{s.total} ({s.pct}%)
                    </td>
                    <td style={{ padding: "8px 10px", color: "#94a3b8" }}>
                      {s.createdAt?.toDate?.().toLocaleString?.() || "-"}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        onClick={() => setSelected(s)}
                        style={{
                          fontSize: 11,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid rgba(59,130,246,0.4)",
                          background: "rgba(37,99,235,0.15)",
                          color: "#93c5fd",
                          cursor: "pointer",
                          marginRight: 6,
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteSession(s.id)}
                        style={{
                          fontSize: 11,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.1)",
                          color: "#f87171",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sessions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "16px 10px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No sessions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple modal for questions */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "min(900px, 96vw)",
              maxHeight: "80vh",
              overflowY: "auto",
              background: "rgba(15,23,42,0.98)",
              borderRadius: 14,
              border: "1px solid rgba(56,139,253,0.3)",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#e5e7eb",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  Session: {selected.userId}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    margin: 0,
                  }}
                >
                  {selected.score}/{selected.total} ({selected.pct}%) ·{" "}
                  {selected.subject || "All subjects"}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(148,163,184,0.6)",
                  background: "transparent",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            {(selected.questions || []).length === 0 && (
              <p
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  marginTop: 8,
                }}
              >
                No questions stored for this session.
              </p>
            )}

            {(selected.questions || []).map((q, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(30,64,175,0.5)",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "#e5e7eb",
                    margin: "0 0 6px",
                    fontWeight: 500,
                  }}
                >
                  {i + 1}.{" "}
                  <MathText text={q.question} />
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  {q.options.map((opt, idx) => {
                    const hasLabel = /^[ABCD]\.\s/i.test(opt);
                    const letter = hasLabel
                      ? opt.charAt(0).toUpperCase()
                      : ["A", "B", "C", "D"][idx] || "?";
                    const optContent = hasLabel ? opt.slice(3).trim() : opt;
                    const isCorrect = letter === q.answer.toUpperCase();
                    return (
                      <div
                        key={idx}
                        style={{
                          fontSize: 11,
                          padding: "6px 8px",
                          borderRadius: 8,
                          border: "1px solid rgba(51,65,85,0.8)",
                          background: isCorrect
                            ? "rgba(22,163,74,0.12)"
                            : "rgba(15,23,42,0.9)",
                          color: isCorrect ? "#4ade80" : "#cbd5f5",
                          display: "flex",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 10,
                            marginTop: 1,
                          }}
                        >
                          {letter}.
                        </span>
                        <span style={{ flex: 1 }}>
                          <MathText text={optContent} />
                        </span>
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      margin: 0,
                    }}
                  >
                    <strong>Explanation:</strong>{" "}
                    <MathText text={q.explanation} />
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
