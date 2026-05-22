"use client";
import { useState } from "react";

interface Props { onStart: (seconds: number | null) => void; selected: number | null; }

const PRESETS = [
  { type:"none"   as const, label:"No timer", value:null    as number | null },
  { type:"preset" as const, label:"30 min",   value:30 * 60 },
  { type:"preset" as const, label:"1 hour",   value:60 * 60 },
  { type:"preset" as const, label:"1.5 hrs",  value:90 * 60 },
  { type:"custom" as const, label:"Custom",   value:-1      as number | null },
];

export default function TimerSetup({ onStart, selected }: Props) {
  const [customMinutes, setCustomMinutes] = useState("");

  const isCustom = selected !== null && selected > 0 &&
    !PRESETS.some(p => p.type === "preset" && p.value === selected);

  function handleClick(type: "none" | "preset" | "custom", value: number | null) {
    if (type === "custom") { onStart(-1); return; }
    onStart(value);
  }

  function applyCustom() {
    const mins = parseInt(customMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    onStart(mins * 60);
    setCustomMinutes("");
  }

  const customLabel = isCustom && selected ? `${Math.round(selected / 60)} min` : "Custom";

  return (
    <div style={{ marginBottom:4 }}>
      <style>{`
        .ts-btn { padding:7px 13px; border-radius:8px; border:1px solid; font-size:12px; cursor:pointer; font-family:var(--font-body); transition:all 0.15s; white-space:nowrap; }
        .ts-active   { background:linear-gradient(135deg,rgba(99,102,241,0.22),rgba(56,189,248,0.12)); border-color:rgba(99,102,241,0.45) !important; color:#c7d2fe; font-weight:700; box-shadow:inset 0 1px 0 rgba(255,255,255,0.07); }
        .ts-inactive { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.08); color:var(--text-muted); }
        .ts-inactive:hover { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.13); color:var(--text-secondary); }
        .ts-apply { padding:7px 13px; border-radius:8px; border:none; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; font-size:12px; font-weight:700; cursor:pointer; font-family:var(--font-body); white-space:nowrap; transition:all 0.2s; }
        .ts-apply:hover { box-shadow:0 4px 14px rgba(99,102,241,0.4); }
      `}</style>

      <p style={{ fontSize:11, fontWeight:600, color:"#334155", marginBottom:9, textTransform:"uppercase", letterSpacing:"0.08em" }}>
        ⏱ Timer (optional)
      </p>

      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom: (isCustom || selected === -1) ? 9 : 0 }}>
        {PRESETS.map(p => {
          const active =
            (p.type==="none"   && selected === null) ||
            (p.type==="preset" && selected === p.value) ||
            (p.type==="custom" && (selected === -1 || isCustom));
          const label = p.type === "custom" ? customLabel : p.label;
          return (
            <button key={p.label} className={`ts-btn ${active ? "ts-active" : "ts-inactive"}`}
              onClick={() => handleClick(p.type, p.value)}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Custom input */}
      {selected === -1 && (
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <input
            type="number" min={1} placeholder="Minutes (e.g. 45)"
            value={customMinutes} onChange={e => setCustomMinutes(e.target.value)}
            onKeyDown={e => e.key === "Enter" && applyCustom()}
            style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:8, color:"#f1f5f9", padding:"8px 11px", fontSize:12, outline:"none", fontFamily:"var(--font-body)", transition:"border-color 0.2s" }}
            onFocus={e=>{(e.currentTarget as HTMLInputElement).style.borderColor="rgba(99,102,241,0.55)";}}
            onBlur={e=>{(e.currentTarget as HTMLInputElement).style.borderColor="rgba(99,102,241,0.25)";}}
          />
          <button className="ts-apply" onClick={applyCustom}>Set</button>
        </div>
      )}
    </div>
  );
}
