"use client";

interface Props {
  onStart: (seconds: number | null) => void;
  selected: number | null;
}

const PRESETS = [
  { label: "No timer", value: null, icon: "—" },
  { label: "30 min", value: 30 * 60, icon: "⏱" },
  { label: "1 hour", value: 60 * 60, icon: "⏱" },
  { label: "1.5 hrs", value: 90 * 60, icon: "⏱" },
];

export default function TimerSetup({ onStart, selected }: Props) {
  return (
    <div style={{ marginBottom: 4 }}>
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>⏱ Timer (optional)</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
        {PRESETS.map(p => {
          const isSelected = selected === p.value;
          return (
            <button key={p.label} onClick={() => onStart(p.value)} style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid",
              borderColor: isSelected ? "rgba(59,130,246,0.5)" : "rgba(56,139,253,0.15)",
              background: isSelected ? "linear-gradient(135deg,rgba(37,99,235,0.3),rgba(8,145,178,0.2))" : "rgba(8,20,40,0.4)",
              color: isSelected ? "#93c5fd" : "#475569",
              fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)",
              fontWeight: isSelected ? 600 : 400,
              transition: "all 0.15s",
            }}>
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
