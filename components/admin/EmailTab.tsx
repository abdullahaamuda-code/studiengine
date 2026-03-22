"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function EmailTab({ adminEmail }: { adminEmail: string }) {
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
    { label: "New Feature", subject: "🚀 New feature on Studiengine!", body: "Hi there,\n\nWe just launched something new on Studiengine that you'll love...\n\nBest,\nStudiengine Team" },
    { label: "Maintenance", subject: "⚙️ Scheduled maintenance", body: "Hi,\n\nWe will be performing maintenance on Studiengine on [DATE] from [TIME]. The app may be unavailable for a short period.\n\nSorry for any inconvenience.\n\nStudiengine Team" },
    { label: "Premium Launch", subject: "⚡ Premium is now available!", body: "Hi,\n\nExciting news — Studiengine Premium is now available! Get unlimited CBTs, up to 30 questions per session, full review, and more.\n\nCheck it out: studiengine.com\n\nStudiengine Team" },
  ];

  return (
    <div style={{ maxWidth: 600 }}>
      {result && <div style={{ marginBottom: 12, padding: "8px 14px", background: "rgba(5,150,105,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, color: "#4ade80", fontSize: 13 }}>{result}</div>}
      {error && <div style={{ marginBottom: 12, padding: "8px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>⚠️ {error}</div>}

      {/* Templates */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Templates</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {templates.map(t => (
            <button key={t.label} onClick={() => { setSubject(t.subject); setBody(t.body); }}
              style={{ fontSize: 12, padding: "5px 12px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 20, color: "#60a5fa", cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipients */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Send To</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["all","All Users"],["free","Free Users"],["premium","Premium Users"],["specific","Specific Email"]].map(([val, label]) => (
            <button key={val} onClick={() => setRecipients(val)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid", borderColor: recipients === val ? "rgba(59,130,246,0.5)" : "rgba(56,139,253,0.15)", background: recipients === val ? "rgba(37,99,235,0.25)" : "transparent", color: recipients === val ? "#93c5fd" : "#64748b", fontSize: 12, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
        {recipients === "specific" && (
          <input value={specificEmail} onChange={e => setSpecificEmail(e.target.value)} placeholder="email@example.com"
            style={{ marginTop: 8, width: "100%", background: "rgba(8,20,40,0.8)", border: "1px solid rgba(56,139,253,0.2)", borderRadius: 8, color: "#e2e8f0", padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        )}
      </div>

      <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
        style={{ width: "100%", background: "rgba(8,20,40,0.8)", border: "1px solid rgba(56,139,253,0.2)", borderRadius: 8, color: "#e2e8f0", padding: "10px 12px", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Email body..." rows={8}
        style={{ width: "100%", background: "rgba(8,20,40,0.8)", border: "1px solid rgba(56,139,253,0.2)", borderRadius: 8, color: "#e2e8f0", padding: "10px 12px", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />

      <p style={{ fontSize: 11, color: "#475569", marginTop: 6, marginBottom: 12 }}>From: {adminEmail}</p>

      <button onClick={send} disabled={loading} style={{ padding: "12px 28px", background: loading ? "rgba(37,99,235,0.3)" : "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Sending..." : "Send Email →"}
      </button>
    </div>
  );
}
