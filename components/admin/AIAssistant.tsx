"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Message { role:"user"|"assistant"; content:string; }

const STORAGE_KEY = "studiengine_admin_ai_chat";

const SUGGESTIONS = [
  "How many users signed up today?",
  "What's my premium conversion rate?",
  "Which features are most used?",
  "How can I improve user retention?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([{
    role:"assistant",
    content:"Hey! I'm your Studiengine admin assistant. Ask me anything about your users, stats, or platform strategy. I can pull live data to give you accurate answers.",
  }]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) { try { const p = JSON.parse(raw); if (Array.isArray(p) && p.length) setMessages(p); } catch {} }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  async function fetchContext(): Promise<string> {
    try {
      const [usageSnap, feedbackSnap, sessionsSnap] = await Promise.all([
        getDocs(collection(db,"usage")),
        getDocs(collection(db,"feedback")),
        getDocs(collection(db,"cbtSessions")),
      ]);
      const users    = usageSnap.docs.map(d=>({ id:d.id, ...d.data() })) as any[];
      const total    = users.length;
      const guests   = users.filter(u=>u.id.startsWith("guest_")).length;
      const premium  = users.filter(u=>u.isPremium).length;
      const todayCBTs = users.reduce((s,u)=>s+(u.quizCount||0),0);
      const totalCBTs = users.reduce((s,u)=>s+(u.allTimeQuizCount||0),0);
      const avgFeedback = feedbackSnap.size > 0
        ? (feedbackSnap.docs.reduce((s,d)=>s+((d.data() as any).rating||0),0)/feedbackSnap.size).toFixed(1)
        : "N/A";
      const sessions = sessionsSnap.docs.map(d=>d.data() as any);
      const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((s,d)=>s+(d.pct||0),0)/sessions.length) : 0;
      return `Live data: ${total} total users (${guests} guests, ${total-guests} registered, ${premium} premium). ${todayCBTs} CBTs today, ${totalCBTs} all-time. ${feedbackSnap.size} feedback submissions, avg rating ${avgFeedback}. ${sessions.length} CBT sessions logged, avg score ${avgScore}%.`;
    } catch { return "Could not fetch live data."; }
  }

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(m => [...m, { role:"user", content:msg }]);
    setLoading(true);

    const context = await fetchContext();

    try {
      const groqKey = process.env.NEXT_PUBLIC_GROQ_KEY;
      if (!groqKey) throw new Error("Add NEXT_PUBLIC_GROQ_KEY to env vars");

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${groqKey}` },
        body: JSON.stringify({
          model:"llama-3.3-70b-versatile",
          max_tokens:500,
          messages:[
            { role:"system", content:`You are the admin AI for Studiengine, a Nigerian student CBT exam prep app. Be concise, practical and data-driven. ${context}` },
            ...messages.map(m=>({ role:m.role, content:m.content })),
            { role:"user", content:msg },
          ],
        }),
      });

      const data = await res.json();
      setMessages(m => [...m, { role:"assistant", content:data.choices?.[0]?.message?.content || "No response." }]);
    } catch (e:any) {
      setMessages(m => [...m, { role:"assistant", content:`Error: ${e.message}` }]);
    }
    setLoading(false);
  }

  function clearChat() {
    const init = [{ role:"assistant" as const, content:"Chat cleared. Ready for your next question." }];
    setMessages(init);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div style={{ maxWidth:640, margin:"0 auto" }}>
      <style>{`
        @keyframes ai-dot { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes msg-in  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .ai-input { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:10px; color:#f1f5f9; padding:11px 14px; font-size:13px; outline:none; font-family:inherit; transition:all 0.2s; resize:none; }
        .ai-input:focus { border-color:rgba(99,102,241,0.5); background:rgba(255,255,255,0.06); }
        .send-btn { padding:11px 18px; background:linear-gradient(135deg,#6366f1,#4f46e5); border:none; border-radius:10px; color:#fff; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.2s; white-space:nowrap; }
        .send-btn:hover:not(:disabled) { box-shadow:0 4px 20px rgba(99,102,241,0.4); }
        .send-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .msg-user { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; border-radius:14px 14px 4px 14px; }
        .msg-ai   { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#cbd5e1; border-radius:14px 14px 14px 4px; }
        .suggestion-btn { padding:7px 14px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:99px; color:#64748b; font-size:12px; cursor:pointer; font-family:inherit; transition:all 0.15s; white-space:nowrap; }
        .suggestion-btn:hover { background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.25); color:#a5b4fc; }
        .chat-scroll::-webkit-scrollbar { width:3px; }
        .chat-scroll::-webkit-scrollbar-thumb { background:rgba(129,140,248,0.2); border-radius:99px; }
      `}</style>

      <div style={{ background:"rgba(10,13,22,0.97)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:20, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>

        {/* Header */}
        <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#f1f5f9", margin:0 }}>Admin AI Assistant</p>
              <p style={{ fontSize:11, color:"#334155", margin:0 }}>Pulls live data · Powered by Groq</p>
            </div>
          </div>
          <button onClick={clearChat} style={{ fontSize:11, padding:"5px 12px", borderRadius:99, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"#475569", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#94a3b8";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#475569";}}>
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="chat-scroll" style={{ height:380, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
          {messages.map((m,i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", animation:"msg-in 0.3s ease" }}>
              <div className={m.role==="user"?"msg-user":"msg-ai"} style={{ maxWidth:"82%", padding:"11px 14px", fontSize:13, lineHeight:1.65 }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display:"flex", justifyContent:"flex-start" }}>
              <div className="msg-ai" style={{ padding:"11px 16px", display:"flex", gap:5, alignItems:"center" }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#818cf8", animation:`ai-dot 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ padding:"0 16px 12px", display:"flex", gap:6, flexWrap:"wrap" }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="suggestion-btn" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"12px 14px", display:"flex", gap:8 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Ask about users, stats, strategy…" className="ai-input" />
          <button onClick={()=>send()} disabled={loading||!input.trim()} className="send-btn">→</button>
        </div>
      </div>
    </div>
  );
}
