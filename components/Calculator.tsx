"use client";
import { useState } from "react";

// Module-level persistence across opens
let persistedDisplay = "0";
let persistedExpr    = "";

export default function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState(persistedDisplay);
  const [expr, setExpr]       = useState(persistedExpr);
  const [justCalc, setJustCalc] = useState(false);

  function update(d: string, e: string) {
    persistedDisplay = d; persistedExpr = e;
    setDisplay(d); setExpr(e);
  }

  function press(val: string) {
    if (val === "AC") { update("0", ""); setJustCalc(false); return; }

    if (val === "⌫") {
      const nd = display.length > 1 ? display.slice(0, -1) : "0";
      update(nd, expr); return;
    }

    if (val === "+/-") {
      update(display.startsWith("-") ? display.slice(1) : "-" + display, expr); return;
    }

    if (val === "√") {
      try {
        const r = parseFloat(Math.sqrt(parseFloat(display)).toFixed(10));
        update(String(r), ""); setJustCalc(true);
      } catch { update("Error", ""); }
      return;
    }

    if (val === "=") {
      try {
        const full = (expr + display).replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-");
        const result = parseFloat(parseFloat(Function(`"use strict";return(${full})`)()).toFixed(10));
        update(String(result), ""); setJustCalc(true);
      } catch { update("Error", ""); setJustCalc(false); }
      return;
    }

    const ops = ["+","−","×","÷"];
    if (ops.includes(val)) { update("0", expr + display + val); setJustCalc(false); return; }

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
    ["AC", "+/-", "√",  "÷"],
    ["7",  "8",   "9",  "×"],
    ["4",  "5",   "6",  "−"],
    ["1",  "2",   "3",  "+"],
    ["⌫",  "0",   ".",  "="],
  ];

  function btnStyle(val: string): React.CSSProperties {
    const isEq  = val === "=";
    const isOp  = ["+","−","×","÷"].includes(val);
    const isAC  = val === "AC";
    const isSq  = val === "√";
    const isDel = val === "⌫";
    return {
      padding: "15px 0", borderRadius: 10, border: "none", cursor: "pointer",
      fontSize: isDel ? 17 : 15, fontWeight: 700,
      fontFamily: "var(--font-body)", transition: "all 0.12s",
      background:
        isEq  ? "linear-gradient(135deg,#6366f1,#4f46e5)" :
        isAC  ? "rgba(239,68,68,0.18)" :
        isSq  ? "rgba(56,189,248,0.15)" :
        isOp  ? "rgba(99,102,241,0.2)" :
                "rgba(255,255,255,0.05)",
      color:
        isEq  ? "#fff" :
        isAC  ? "#fca5a5" :
        isSq  ? "#7dd3fc" :
        isOp  ? "#a5b4fc" :
                "var(--text-primary)",
      boxShadow: isEq ? "0 4px 16px rgba(99,102,241,0.35)" : "none",
    };
  }

  return (
    <>
      <style>{`
        @keyframes calc-in { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .calc-key:active { transform: scale(0.91) !important; }
      `}</style>

      <div style={{
        position:"fixed", bottom:82, right:16, zIndex:60,
        width:264,
        background:"rgba(10,13,22,0.97)",
        backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)",
        border:"1px solid rgba(255,255,255,0.09)",
        borderRadius:20,
        boxShadow:"0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 40px rgba(99,102,241,0.08)",
        overflow:"hidden",
        animation:"calc-in 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Top glow */}
        <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.35),transparent)" }} />

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px 4px" }}>
          <span style={{ fontSize:10, color:"#334155", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Calculator</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:19, lineHeight:1, padding:"2px 4px", transition:"color 0.15s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#94a3b8";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#475569";}}>×</button>
        </div>

        {/* Display */}
        <div style={{ padding:"4px 16px 14px", textAlign:"right" }}>
          <p style={{ fontSize:11, color:"#334155", minHeight:16, margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"var(--font-body)" }}>
            {expr || " "}
          </p>
          <p style={{ fontSize:36, fontWeight:800, color:"#f1f5f9", fontFamily:"var(--font-display)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-0.02em" }}>
            {display}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height:1, background:"rgba(255,255,255,0.05)", margin:"0 10px" }} />

        {/* Keypad */}
        <div style={{ padding:"10px 10px 12px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5 }}>
          {ROWS.flat().map((btn, i) => (
            <button key={i} className="calc-key" onClick={() => press(btn)} style={btnStyle(btn)}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.91)")}
              onMouseUp={e   => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
              {btn}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
