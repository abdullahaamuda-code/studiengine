"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Message { role: "user" | "assistant"; content: string; }

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I'm your Studiengine admin assistant. Ask me anything about your users, stats, or how to manage the platform. I can query your Firestore data directly." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchContext(): Promise<string> {
    try {
      const usageSnap = await getDocs(collection(db, "usage"));
      const users = usageSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const totalUsers = users.length;
      const premiumUsers = users.filter(u => u.isPremium).length;
      const guestUsers = users.filter(u => u.id.startsWith("guest_")).length;
      const todayCBTs = users.reduce((s, u) => s + (u.quizCount || 0), 0);
      return `Current Studiengine stats: ${totalUsers} total users (${guestUsers} guests, ${totalUsers - guestUsers} registered, ${premiumUsers} premium). ${todayCBTs} CBTs generated today.`;
    } catch {
      return "Could not fetch live stats (Firestore permission issue).";
    }
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    const context = await fetchContext();

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_KEY || ""}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 500,
          messages: [
            { role: "system", content: `You are the admin AI assistant for Studiengine, a Nigerian student CBT exam prep app. You help the admin manage users, understand analytics, and operate the platform. Be concise and practical. Current data: ${context}` },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg },
          ],
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Could not get response. Check NEXT_PUBLIC_GROQ_KEY in env.";
      setMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: "assistant", content: `Error: ${e.message}. Make sure NEXT_PUBLIC_GROQ_KEY is set in .env.local` }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 14, padding: 0, overflow: "hidden" }}>
        {/* Messages */}
        <div style={{ height: 380, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "10px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                background: m.role === "user" ? "linear-gradient(135deg,#2563eb,#0891b2)" : "rgba(255,255,255,0.05)",
                color: m.role === "user" ? "#fff" : "#cbd5e1",
                border: m.role === "assistant" ? "1px solid rgba(56,139,253,0.15)" : "none",
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 12 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Input */}
        <div style={{ borderTop: "1px solid rgba(56,139,253,0.12)", padding: 12, display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask about your users, stats, how to do something..."
            style={{ flex: 1, background: "rgba(5,15,35,0.8)", border: "1px solid rgba(56,139,253,0.2)", borderRadius: 8, color: "#e2e8f0", padding: "9px 12px", fontSize: 13, outline: "none" }} />
          <button onClick={send} disabled={loading || !input.trim()} style={{ padding: "9px 16px", background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Send
          </button>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#334155", marginTop: 8 }}>
        Needs NEXT_PUBLIC_GROQ_KEY in .env.local (same as your Groq key, just with NEXT_PUBLIC_ prefix so it's accessible client-side)
      </p>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}
