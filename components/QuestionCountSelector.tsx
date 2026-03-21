"use client";
import { useState, useEffect } from "react";

interface Props {
  value: number;
  onChange: (n: number) => void;
  maxAllowed: number; // 15 for free/guest, 30 for premium
}

const PRESETS = [5, 10, 15];

export default function QuestionCountSelector({ value, onChange, maxAllowed }: Props) {
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  function handleCustom(raw: string) {
    setCustom(raw);
    const n = parseInt(raw);
    if (!isNaN(n) && n >= 1) {
      onChange(Math.min(n, maxAllowed));
    }
  }

  function selectPreset(n: number) {
    setUseCustom(false);
    setCustom("");
    onChange(n);
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Number of questions
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {PRESETS.map(n => (
          <button key={n} onClick={() => selectPreset(n)} style={{
            flex: 1, padding: "9px 0", borderRadius: 9, border: "1px solid",
            borderColor: !useCustom && value === n ? "rgba(59,130,246,0.5)" : "rgba(56,139,253,0.15)",
            background: !useCustom && value === n ? "linear-gradient(135deg,rgba(37,99,235,0.3),rgba(8,145,178,0.2))" : "transparent",
            color: !useCustom && value === n ? "#93c5fd" : "var(--text-secondary)",
            fontSize: 13, fontWeight: !useCustom && value === n ? 700 : 400,
            cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s",
          }}>
            {n}
          </button>
        ))}
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="number"
            min={1}
            max={maxAllowed}
            placeholder="Custom"
            value={custom}
            onChange={e => { setUseCustom(true); handleCustom(e.target.value); }}
            onFocus={() => setUseCustom(true)}
            className="input-glass"
            style={{
              width: "100%", padding: "9px 8px", borderRadius: 9, fontSize: 13,
              textAlign: "center", height: "100%",
              borderColor: useCustom ? "rgba(59,130,246,0.5)" : "rgba(56,139,253,0.15)",
            }}
          />
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
        Max {maxAllowed} questions{maxAllowed < 30 ? " — " : ""}{maxAllowed < 30 ? <span style={{ color: "#fbbf24", cursor: "pointer" }} onClick={() => {}}>upgrade for up to 30 ⚡</span> : ""}
      </p>
    </div>
  );
}
