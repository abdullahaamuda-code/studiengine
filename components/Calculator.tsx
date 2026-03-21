"use client";
import { useState, useRef } from "react";

// Module-level memory so it persists across opens
let persistedDisplay = "0";
let persistedExpr = "";

export default function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState(persistedDisplay);
  const [expr, setExpr] = useState(persistedExpr);
  const [justCalc, setJustCalc] = useState(false);

  function update(d: string, e: string) {
    persistedDisplay = d;
    persistedExpr = e;
    setDisplay(d);
    setExpr(e);
  }

  function press(val: string) {
    if (val === "AC") {
      update("0", "");
      setJustCalc(false);
      return;
    }

    if (val === "⌫") {
      const nd = display.length > 1 ? display.slice(0, -1) : "0";
      update(nd, expr);
      return;
    }

    if (val === "+/-") {
      const nd = display.startsWith("-") ? display.slice(1) : "-" + display;
      update(nd, expr);
      return;
    }

    if (val === "√") {
      try {
        const n = parseFloat(display);
        const r = parseFloat(Math.sqrt(n).toFixed(10));
        update(String(r), "");
        setJustCalc(true);
      } catch { update("Error", ""); }
      return;
    }

    if (val === "=") {
      try {
        const full = expr + display;
        const safe = full.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
        const result = Function(`"use strict"; return (${safe})`)();
        const rounded = parseFloat(parseFloat(result).toFixed(10));
        update(String(rounded), "");
        setJustCalc(true);
      } catch { update("Error", ""); setJustCalc(false); }
      return;
    }

    const ops = ["+", "−", "×", "÷"];
    if (ops.includes(val)) {
      const ne = expr + display + val;
      update("0", ne);
      setJustCalc(false);
      return;
    }

    // digit or decimal
    setDisplay(d => {
      let nd: string;
      if (justCalc) { setJustCalc(false); nd = val === "." ? "0." : val; }
      else if (d === "0" && val !== ".") nd = val;
      else if (val === "." && d.includes(".")) nd = d;
      else nd = d + val;
      persistedDisplay = nd;
      return nd;
    });
  }

  const ROWS = [
    ["AC", "+/-", "√", "÷"],
    ["7",  "8",  "9", "×"],
    ["4",  "5",  "6", "−"],
    ["1",  "2",  "3", "+"],
    ["⌫",  "0",  ".", "="],
  ];

  function btnStyle(val: string) {
    const isOp = ["+","−","×","÷","="].includes(val);
    const isAC = val === "AC";
    const isSqrt = val === "√";
    return {
      padding: "15px 0", borderRadius: 10, border: "none", cursor: "pointer",
      fontSize: val === "⌫" ? 16 : 15, fontWeight: 600,
      fontFamily: "var(--font-body)", transition: "all 0.12s",
      background: val === "=" ? "linear-gradient(135deg,#2563eb,#0891b2)"
        : isAC ? "rgba(239,68,68,0.2)"
        : isSqrt ? "rgba(8,145,178,0.2)"
        : isOp ? "rgba(37,99,235,0.25)"
        : "rgba(255,255,255,0.06)",
      color: val === "=" ? "#fff"
        : isAC ? "#f87171"
        : isSqrt ? "#67e8f9"
        : isOp ? "#93c5fd"
        : "var(--text-primary)",
    } as React.CSSProperties;
  }

  return (
    <div style={{
      position: "fixed", bottom: 80, right: 16, zIndex: 60,
      width: 260,
      background: "rgba(5,12,28,0.97)", backdropFilter: "blur(24px)",
      border: "1px solid rgba(56,139,253,0.25)", borderRadius: 20,
      boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(37,99,235,0.15)",
      overflow: "hidden",
    }} className="animate-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px 0" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em" }}>CALCULATOR</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
      </div>

      {/* Display */}
      <div style={{ padding: "6px 16px 12px", textAlign: "right" }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)", minHeight: 16, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expr || " "}</p>
        <p style={{ fontSize: 34, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display}</p>
      </div>

      {/* Buttons */}
      <div style={{ padding: "0 10px 12px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {ROWS.flat().map((btn, i) => (
          <button key={i} onClick={() => press(btn)} style={btnStyle(btn)}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.93)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}