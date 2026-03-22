"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc, query, orderBy, limit } from "firebase/firestore";

interface FeedbackItem {
  id: string; rating: number; message: string; userId: string; createdAt: any;
}

export default function FeedbackTab() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const snap = await getDocs(query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(50)));
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })) as FeedbackItem[]);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function del(id: string) {
    await deleteDoc(doc(db, "feedback", id));
    setItems(i => i.filter(x => x.id !== id));
  }

  const avg = items.length > 0 ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1) : "—";

  return (
    <div>
      {error && <div style={{ marginBottom: 12, padding: "8px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>⚠️ {error}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[{ label: "Total", value: items.length, color: "#60a5fa" }, { label: "Avg Rating", value: `${avg} ⭐`, color: "#fbbf24" }].map(c => (
          <div key={c.label} style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontSize: 11, color: "#475569", margin: "0 0 4px", textTransform: "uppercase" }}>{c.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: c.color, margin: 0 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {loading ? <p style={{ color: "#475569", fontSize: 13 }}>Loading feedback...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.length === 0 && <p style={{ color: "#334155", fontSize: 13 }}>No feedback yet</p>}
          {items.map(item => (
            <div key={item.id} style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: item.message ? 8 : 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span>{"⭐".repeat(item.rating)}</span>
                  <span style={{ fontSize: 11, color: "#334155" }}>{item.userId?.startsWith("guest_") ? "Guest" : "Registered user"}</span>
                  {item.createdAt && <span style={{ fontSize: 10, color: "#1e293b" }}>{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</span>}
                </div>
                <button onClick={() => del(item.id)} style={{ fontSize: 11, padding: "3px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#f87171", cursor: "pointer" }}>Delete</button>
              </div>
              {item.message && <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{item.message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
