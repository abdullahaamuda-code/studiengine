"use client";
import { useState } from "react";

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
    const isOp = ["+","−","×","÷"].includes(val);
    const isEquals = val === "=";
    const isAC = val === "AC";
    const isSqrt = val === "√";
    const isBack = val === "⌫";
    const isPlusMinus = val === "+/-";
    
    return {
      padding: "16px 0",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.08)",
      cursor: "pointer",
      fontSize: val === "⌫" ? 17 : 15,
      fontWeight: 700,
      fontFamily: "var(--font-display)",
      transition: "all 0.15s cubic-bezier(0.4,0,0.2,1)",
      background: isEquals 
        ? "linear-gradient(135deg,#6366f1,#818cf8)"
        : isAC 
        ? "rgba(239,68,68,0.15)"
        : isSqrt 
        ? "rgba(8,145,178,0.15)"
        : isOp 
        ? "rgba(99,102,241,0.1)"
        : "rgba(255,255,255,0.04)",
      color: isEquals 
        ? "#fff"
        : isAC 
        ? "#f87171"
        : isSqrt 
        ? "#22d3ee"
        : isOp 
        ? "#a5b4fc"
        : "#f1f5f9",
      boxShadow: isEquals 
        ? "0 4px 12px rgba(99,102,241,0.3)"
        : "none",
    } as React.CSSProperties;
  }

  return (
    <>
      <style>{`
        @keyframes calc-in {
          from { opacity:0; transform:translateY(12px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        
        .calc-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(129,140,248,0.2);
        }
        .calc-btn:active {
          transform: scale(0.96);
        }

        @media (max-width: 640px) {
          .calculator-container {
            bottom: 16px !important;
            right: 12px !important;
            width: 280px !important;
          }
        }
      `}</style>

      <div
        className="calculator-container"
        style={{
          position: "fixed",
          bottom: 80,
          right: 16,
          zIndex: 60,
          width: 300,
          background: "rgba(10,13,22,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 40px rgba(99,102,241,0.08)",
          overflow: "hidden",
          animation: "calc-in 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Top shimmer line */}
        <div style={{
          position: "absolute", top: 0, left: "25%", right: "25%", height: 1,
          background: "linear-gradient(90deg,transparent,rgba(129,140,248,0.4),transparent)",
        }} />

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: "rgba(129,140,248,0.1)",
              border: "1px solid rgba(129,140,248,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#818cf8",
            }}>🔢</div>
            <span style={{
              fontSize: 11,
              color: "#94a3b8",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontFamily: "var(--font-display)",
            }}>Calculator</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#475569", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#475569"; }}
          >×</button>
        </div>

        {/* Display */}
        <div style={{
          padding: "16px 18px 18px",
          background: "rgba(255,255,255,0.02)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <p style={{
            fontSize: 11,
            color: "#475569",
            minHeight: 16,
            margin: "0 0 6px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "right",
            fontFamily: "var(--font-body)",
          }}>
            {expr || " "}
          </p>
          <p style={{
            fontSize: 36,
            fontWeight: 800,
            color: "#f1f5f9",
            fontFamily: "var(--font-display)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "right",
            letterSpacing: "-0.02em",
          }}>
            {display}
          </p>
        </div>

        {/* Buttons */}
        <div style={{
          padding: "14px 12px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
        }}>
          {ROWS.flat().map((btn, i) => (
            <button
              key={i}
              className="calc-btn"
              onClick={() => press(btn)}
              style={btnStyle(btn)}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.94)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
