"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function EmailTab() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState("all");
  const [specificEmail, setSpecificEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function send() {
    if (!subject || !body) { setError("Fill in subject and message."); return; }
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-uid": user?.uid || "" },
        body: JSON.stringify({ subject, body, recipients, specificEmail }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(`✓ Sent to ${data.sent} recipient(s)`);
      setSubject(""); setBody("");
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  const templates = [
    { label: "🚀 New Feature", subject: "New on Studiengine!", body: "Hi,\n\nWe just launched something new on Studiengine that you'll love.\n\nBest,\nStudiengine" },
    { label: "⚙️ Maintenance", subject: "Scheduled maintenance", body: "Hi,\n\nWe will be performing maintenance on [DATE] from [TIME].\n\nSorry for any inconvenience.\n\nStudiengine" },
    { label: "⚡ Premium Launch", subject: "Premium is now available!", body: "Hi,\n\nStudiengine Premium is now available! Get unlimited CBTs, up to 30 questions, full review, and more.\n\nStudiengine" },
  ];

  const recipientOptions = [
    { value: "all", label: "All Users" },
    { value: "free", label: "Free Users" },
    { value: "premium", label: "Premium" },
    { value: "specific", label: "Specific Email" },
  ];

  return (
    <div style={{ maxWidth: 580 }}>
      {result && <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(5,150,105,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, color: "#4ade80", fontSize: 13 }}>{result}</div>}
      {error && <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#f87171", fontSize: 13 }}>⚠️ {error}</div>}

      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 11, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Templates</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {templates.map(t => (
            <button key={t.label} onClick={() => { setSubject(t.subject); setBody(t.body); }}
              style={{ fontSize: 12, padding: "6px 14px", background: "rgba(37,99,235,0.12)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20, color: "#60a5fa", cursor: "pointer", fontFamily: "inherit" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Send To</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {recipientOptions.map(o => (
            <button key={o.value} onClick={() => setRecipients(o.value)} style={{
              padding: "8px 16px", borderRadius: 10, border: "1px solid",
              borderColor: recipients === o.value ? "rgba(59,130,246,0.5)" : "rgba(56,139,253,0.15)",
              background: recipients === o.value ? "rgba(37,99,235,0.2)" : "transparent",
              color: recipients === o.value ? "#93c5fd" : "#475569",
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}>{o.label}</button>
          ))}
        </div>
        {recipients === "specific" && (
          <input value={specificEmail} onChange={e => setSpecificEmail(e.target.value)} placeholder="email@example.com"
            style={{ marginTop: 10, width: "100%", background: "rgba(8,20,40,0.8)", border: "1px solid rgba(56,139,253,0.2)", borderRadius: 10, color: "#e2e8f0", padding: "10px 14px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        )}
      </div>

      <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line..."
        style={{ width: "100%", background: "rgba(8,20,40,0.8)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 10, color: "#e2e8f0", padding: "11px 14px", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />

      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your email here..." rows={7}
        style={{ width: "100%", background: "rgba(8,20,40,0.8)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 10, color: "#e2e8f0", padding: "11px 14px", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", marginBottom: 16 }} />

      <button onClick={send} disabled={loading}
        style={{ padding: "12px 28px", background: loading ? "rgba(37,99,235,0.3)" : "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
        {loading ? "Sending..." : "Send Email →"}
      </button>
    </div>
  );
}
