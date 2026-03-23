"use client";
import { useState, useEffect } from "react";

const MESSAGES_VISION = [
  "Reading your PDF...",
  "Extracting questions...",
  "Analysing content...",
  "Generating CBT questions...",
  "Adding explanations...",
  "Almost ready...",
];

const MESSAGES_TEXT = [
  "Generating questions...",
  "Adding answer options...",
  "Writing explanations...",
  "Almost ready...",
];

export default function LoadingBar({ active, isVision = false }: { active: boolean; isVision?: boolean }) {
  const [pct, setPct] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = isVision ? MESSAGES_VISION : MESSAGES_TEXT;

  useEffect(() => {
    if (!active) { setPct(0); setMsgIdx(0); return; }

    // Smooth progress that never actually hits 100 until done
    // Speeds: fast to 40%, slower 40-70%, crawls 70-92%
    const intervals: NodeJS.Timeout[] = [];

    let p = 0;
    const tick = setInterval(() => {
      setPct(prev => {
        if (prev >= 92) return prev; // hold at 92 until active=false
        const speed = prev < 40 ? 3 : prev < 70 ? 1.2 : 0.4;
        return Math.min(prev + speed, 92);
      });
    }, 120);
    intervals.push(tick);

    // Cycle messages
    const msgTick = setInterval(() => {
      setMsgIdx(i => (i + 1) % messages.length);
    }, isVision ? 2800 : 2000);
    intervals.push(msgTick);

    return () => intervals.forEach(clearInterval);
  }, [active, isVision]);

  // Snap to 100 when done
  useEffect(() => {
    if (!active && pct > 0) {
      setPct(100);
      const t = setTimeout(() => setPct(0), 600);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (pct === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, #2563eb, #0891b2, #22d3ee)",
          borderRadius: 2,
          transition: "width 0.12s ease",
          boxShadow: "0 0 8px rgba(34,211,238,0.5)",
        }} />
      </div>
      {/* Message + percentage */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", animation: "pulse-text 2s ease-in-out infinite" }}>
          {messages[msgIdx]}
        </span>
        <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600, fontFamily: "var(--font-display)" }}>
          {pct < 100 ? `${Math.round(pct)}%` : "✓"}
        </span>
      </div>
      <style>{`@keyframes pulse-text { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  );
}
