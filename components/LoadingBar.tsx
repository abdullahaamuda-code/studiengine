"use client";
import { useState, useEffect } from "react";

const MESSAGES_VISION = [
  "Reading your PDF…",
  "Extracting questions…",
  "Analysing content…",
  "Generating CBT questions…",
  "Adding explanations…",
  "Almost ready…",
];
const MESSAGES_TEXT = [
  "Generating questions…",
  "Adding answer options…",
  "Writing explanations…",
  "Almost ready…",
];

export default function LoadingBar({ active, isVision = false }: { active: boolean; isVision?: boolean }) {
  const [pct, setPct]       = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = isVision ? MESSAGES_VISION : MESSAGES_TEXT;

  useEffect(() => {
    if (!active) { setPct(0); setMsgIdx(0); return; }
    const tick = setInterval(() => {
      setPct(p => {
        if (p >= 92) return p;
        const speed = p < 40 ? 3 : p < 70 ? 1.2 : 0.4;
        return Math.min(p + speed, 92);
      });
    }, 120);
    const msg = setInterval(() => {
      setMsgIdx(i => (i + 1) % messages.length);
    }, isVision ? 2800 : 2000);
    return () => { clearInterval(tick); clearInterval(msg); };
  }, [active, isVision]);

  useEffect(() => {
    if (!active && pct > 0) {
      setPct(100);
      const t = setTimeout(() => setPct(0), 600);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (pct === 0) return null;

  const done = pct >= 100;

  return (
    <>
      <style>{`@keyframes lb-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
      <div style={{ marginBottom:14 }}>
        {/* Track */}
        <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:99, overflow:"hidden", marginBottom:8 }}>
          <div style={{
            height:"100%", width:`${pct}%`,
            background:"linear-gradient(90deg,#6366f1,#818cf8,#38bdf8)",
            backgroundSize:"200% 100%",
            borderRadius:99,
            transition:"width 0.12s ease",
            boxShadow:"0 0 8px rgba(99,102,241,0.5)",
          }} />
        </div>
        {/* Message row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, color:"var(--text-muted)", animation:done ? "none" : "lb-pulse 2s ease-in-out infinite" }}>
            {done ? "Done!" : messages[msgIdx]}
          </span>
          <span style={{ fontSize:11, fontWeight:700, color:"#818cf8", fontFamily:"var(--font-display)" }}>
            {done ? "✓" : `${Math.round(pct)}%`}
          </span>
        </div>
      </div>
    </>
  );
}
