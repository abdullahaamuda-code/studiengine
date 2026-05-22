"use client";
import { useState } from "react";

interface Props { value: number; onChange: (n: number) => void; maxAllowed: number; }

const PRESETS = [5, 10, 15];

export default function QuestionCountSelector({ value, onChange, maxAllowed }: Props) {
  const [custom, setCustom]       = useState("");
  const [useCustom, setUseCustom] = useState(false);

  function handleCustom(raw: string) {
    setCustom(raw);
    const n = parseInt(raw);
    if (!isNaN(n) && n >= 1) onChange(Math.min(n, maxAllowed));
  }

  function selectPreset(n: number) {
    setUseCustom(false); setCustom(""); onChange(n);
  }

  const isPremium = maxAllowed >= 30;

  return (
    <div style={{ marginBottom:14 }}>
      <style>{`
        .qcs-btn { flex:1; padding:9px 0; border-radius:9px; border:1px solid; font-size:13px; cursor:pointer; font-family:var(--font-body); transition:all 0.18s; }
        .qcs-active   { background:linear-gradient(135deg,rgba(99,102,241,0.22),rgba(56,189,248,0.12)); border-color:rgba(99,102,241,0.45) !important; color:#c7d2fe !important; font-weight:700; box-shadow:inset 0 1px 0 rgba(255,255,255,0.06); }
        .qcs-inactive { background:transparent; border-color:rgba(255,255,255,0.08); color:var(--text-muted); }
        .qcs-inactive:hover { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.13); color:var(--text-secondary); }
        .qcs-input { width:100%; padding:9px 8px; border-radius:9px; font-size:13px; text-align:center; background:rgba(255,255,255,0.04); color:#f1f5f9; font-family:var(--font-body); outline:none; transition:all 0.2s; }
        .qcs-input:focus { border-color:rgba(99,102,241,0.55) !important; box-shadow:0 0 0 3px rgba(99,102,241,0.1); background:rgba(255,255,255,0.07); }
        .upgrade-link { color:#fbbf24; cursor:pointer; font-weight:600; transition:color 0.15s; }
        .upgrade-link:hover { color:#fde68a; text-decoration:underline; }
      `}</style>

      <p style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:9, textTransform:"uppercase", letterSpacing:"0.08em" }}>
        Number of questions
      </p>

      <div style={{ display:"flex", gap:6, marginBottom:9 }}>
        {PRESETS.map(n => (
          <button key={n} className={`qcs-btn ${!useCustom && value===n ? "qcs-active" : "qcs-inactive"}`}
            onClick={() => selectPreset(n)}>
            {n}
          </button>
        ))}
        <input
          type="number" min={1} max={maxAllowed} placeholder="Custom"
          value={custom}
          onChange={e => { setUseCustom(true); handleCustom(e.target.value); }}
          onFocus={() => setUseCustom(true)}
          className="qcs-input"
          style={{ flex:1, border:`1px solid ${useCustom ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.08)"}` }}
        />
      </div>

      <p style={{ fontSize:11.5, color:"#334155", margin:0 }}>
        Max {maxAllowed} questions
        {!isPremium && (
          <> · <span className="upgrade-link">upgrade for 30 ⚡</span></>
        )}
      </p>
    </div>
  );
}
