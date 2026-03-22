"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Message { role: "user" | "assistant"; content: string; }

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I'm your Studiengine admin assistant. Ask me anything about your users, stats, or how to manage the platform." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchContext(): Promise<string> {
    try {
      const usageSnap = await getDocs(collection(db, "usage"));
      const users = usageSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const total = users.length;
      const premium = users.filter(u => u.isPremium).length;
      const guests = users.filter(u => u.id.startsWith("guest_")).length;
      const todayCBTs = users.reduce((s, u) => s + (u.quizCount || 0), 0);
      return `Stats: ${total} users (${guests} guests, ${total - guests} registered, ${premium} premium). ${todayCBTs} CBTs today.`;
    } catch { return "Could not fetch live stats."; }
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    const context = await fetchContext();
    try {
      const groqKey = process.env.NEXT_PUBLIC_GROQ_KEY;
      if (!groqKey) throw new Error("Add NEXT_PUBLIC_GROQ_KEY to your env vars");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", max_tokens: 400,
          messages: [
            { role: "system", content: `You are the admin AI for Studiengine, a Nigerian student CBT exam prep app. Be concise and practical. Live data: ${context}` },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg },
          ],
        }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.choices?.[0]?.message?.content || "No response." }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(56,139,253,0.1)" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#93c5fd", margin: 0 }}>🤖 Admin AI Assistant</p>
          <p style={{ fontSize: 11, color: "#334155", margin: "2px 0 0" }}>Ask about users, analytics, or platform management</p>
        </div>

        <div style={{ height: 360, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "10px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                background: m.role === "user" ? "linear-gradient(135deg,#2563eb,#0891b2)" : "rgba(255,255,255,0.04)",
                color: m.role === "user" ? "#fff" : "#cbd5e1",
                border: m.role === "assistant" ? "1px solid rgba(56,139,253,0.12)" : "none",
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 12, display: "flex", gap: 4, alignItems: "center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa", animation: `dot 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid rgba(56,139,253,0.1)", padding: 12, display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask anything..."
            style={{ flex: 1, background: "rgba(5,15,35,0.8)", border: "1px solid rgba(56,139,253,0.2)", borderRadius: 10, color: "#e2e8f0", padding: "10px 14px", fontSize: 13, outline: "none" }} />
          <button onClick={send} disabled={loading || !input.trim()}
            style={{ padding: "10px 18px", background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            →
          </button>
        </div>
      </div>
      <style>{`@keyframes dot { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}
