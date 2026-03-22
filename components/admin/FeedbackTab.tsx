"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface FeedbackItem {
  id: string;
  rating: number;
  message: string;
  userId: string;
  createdAt: any;
}

export default function FeedbackTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/feedback", { headers: { "x-admin-uid": user?.uid || "" } });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.feedback);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { if (user) load(); }, [user]);

  async function deleteFeedback(id: string) {
    try {
      await fetch("/api/admin/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-uid": user?.uid || "" },
        body: JSON.stringify({ id }),
      });
      setItems(items.filter(i => i.id !== id));
    } catch (e: any) { setError(e.message); }
  }

  const avgRating = items.length > 0 ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1) : "—";

  return (
    <div>
      {error && <div style={{ marginBottom: 12, padding: "8px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>⚠️ {error}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 10, padding: "14px 18px" }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px", textTransform: "uppercase" }}>Total</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#60a5fa", margin: 0 }}>{items.length}</p>
        </div>
        <div style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 10, padding: "14px 18px" }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px", textTransform: "uppercase" }}>Avg Rating</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#fbbf24", margin: 0 }}>{avgRating} ⭐</p>
        </div>
      </div>

      {loading ? <p style={{ color: "#64748b", fontSize: 13 }}>Loading feedback...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.length === 0 && <p style={{ color: "#475569", fontSize: 13 }}>No feedback yet</p>}
          {items.map(item => (
            <div key={item.id} style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {"⭐".repeat(item.rating)}
                  <span style={{ fontSize: 11, color: "#475569" }}>{item.userId?.startsWith("guest_") ? "Guest" : "User"}</span>
                </div>
                <button onClick={() => deleteFeedback(item.id)} style={{ fontSize: 11, padding: "3px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#f87171", cursor: "pointer" }}>Delete</button>
              </div>
              {item.message && <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{item.message}</p>}
              {item.createdAt && <p style={{ fontSize: 10, color: "#334155", margin: "6px 0 0" }}>{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
