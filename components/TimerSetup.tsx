"use client";

import { useState } from "react";

interface Props {
  onStart: (seconds: number | null) => void;
  selected: number | null;
}

// We keep a logical "Custom" preset, but we’ll render its label dynamically
const PRESETS = [
  { type: "none" as const, label: "No timer", value: null as number | null },
  { type: "preset" as const, label: "30 min", value: 30 * 60 },
  { type: "preset" as const, label: "1 hour", value: 60 * 60 },
  { type: "preset" as const, label: "1.5 hrs", value: 90 * 60 },
  { type: "custom" as const, label: "Custom", value: -1 as number | null }, // sentinel
];

export default function TimerSetup({ onStart, selected }: Props) {
  const [customMinutes, setCustomMinutes] = useState<string>("");

  const isCustom = selected !== null && selected > 0 && !PRESETS.some(
    (p) => p.type === "preset" && p.value === selected
  );

  function handlePresetClick(type: "none" | "preset" | "custom", value: number | null) {
    if (type === "custom") {
      // Select custom mode, but don't fix seconds until user hits Set
      onStart(-1);
      return;
    }
    onStart(value);
  }

  function handleCustomApply() {
    const mins = parseInt(customMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    onStart(mins * 60);
  }

  // Derive label when a custom duration is active
  const customLabel = isCustom && selected
    ? `${Math.round(selected / 60)} min`
    : "Custom";

  return (
    <div style={{ marginBottom: 4 }}>
      <p
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        ⏱ Timer (optional)
      </p>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap" as const,
          marginBottom: isCustom || selected === -1 ? 8 : 0,
        }}
      >
        {PRESETS.map((p) => {
          const isNoneSelected = p.type === "none" && selected === null;
          const isPresetSelected =
            p.type === "preset" && selected === p.value;
          const isCustomSelected =
            p.type === "custom" && (selected === -1 || isCustom);

          const isSelected =
            isNoneSelected || isPresetSelected || isCustomSelected;

          const label =
            p.type === "custom" ? customLabel : p.label;

          return (
            <button
              key={p.label}
              onClick={() => handlePresetClick(p.type, p.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: isSelected
                  ? "rgba(59,130,246,0.5)"
                  : "rgba(56,139,253,0.15)",
                background: isSelected
                  ? "linear-gradient(135deg,rgba(37,99,235,0.3),rgba(8,145,178,0.2))"
                  : "rgba(8,20,40,0.4)",
                color: isSelected ? "#93c5fd" : "#475569",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontWeight: isSelected ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {(selected === -1 || isCustom) && (
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <input
            type="number"
            min={1}
            placeholder="Enter minutes (e.g. 45)"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            style={{
              flex: 1,
              background: "rgba(8,20,40,0.8)",
              border: "1px solid rgba(56,139,253,0.25)",
              borderRadius: 8,
              color: "#e2e8f0",
              padding: "6px 10px",
              fontSize: 12,
              outline: "none",
              fontFamily: "var(--font-body)",
            }}
          />
          <button
            onClick={handleCustomApply}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "none",
              background:
                "linear-gradient(135deg,rgba(37,99,235,0.9),rgba(8,145,178,0.9))",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Set
          </button>
        </div>
      )}
    </div>
  );
}
