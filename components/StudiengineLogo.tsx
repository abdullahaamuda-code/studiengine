interface StudiengineLogoProps {
  size?: number;
}

export default function StudiengineLogo({ size = 32 }: StudiengineLogoProps) {
  // Scale all coordinates relative to the base 80px design
  const s = size / 80;

  // Base dimensions
  const r  = size;                        // viewBox = size × size
  const rx = 18 * s;                      // outer corner radius
  const brx = 14 * s;                     // inner border radius
  const bPad = 6 * s;                     // border inset from edge
  const sw  = Math.max(1, 3 * s);         // main stroke width
  const sw2 = Math.max(0.8, 2.5 * s);    // secondary stroke width
  const sw3 = Math.max(0.5, 1.5 * s);    // ring stroke width
  const dotR  = 3.5 * s;                  // spark dot radius
  const ringR = 6 * s;                    // pulse ring radius

  // Key anchor points (based on 80px grid)
  const cx = size / 2;                    // 40 @ 80px

  // Brain lobe arcs — top
  const arcY1  = 70 * s;                  // arc baseline y
  const arcTop = 62 * s;                  // arc peak y
  const lx1 = 24 * s; const lx2 = 32 * s; const lx3 = 40 * s; // left lobe x1 x2 x3
  const rx1 = 42 * s; const rx2 = 50 * s; const rx3 = 58 * s; // right lobe x1 x2 x3

  // Verticals
  const vertBot = 88 * s;

  // Bottom arc
  const botArcY1 = 88 * s;
  const botArcY2 = 100 * s;
  const botMidX  = 32 * s;
  const botEndX  = 40 * s;
  const botEndY  = 92 * s;

  // Spark dot
  const dotX = 41 * s;
  const dotY = 92 * s;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${r} ${r}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0, borderRadius: rx }}
    >
      <defs>
        <linearGradient id={`sg-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={`sg-dim-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Background tile */}
      <rect width={r} height={r} rx={rx} fill="#0d0f1a" />

      {/* Outer border ring — Option C frame */}
      <rect
        x={bPad} y={bPad}
        width={r - bPad * 2} height={r - bPad * 2}
        rx={brx}
        fill="none"
        stroke={`url(#sg-dim-${size})`}
        strokeWidth={sw3}
      />

      {/* Left brain lobe arc */}
      <path
        d={`M${lx1} ${arcY1} Q${lx1} ${arcTop} ${lx2} ${arcTop} Q${lx3} ${arcTop} ${lx3} ${arcY1}`}
        fill="none"
        stroke={`url(#sg-grad-${size})`}
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* Right brain lobe arc */}
      <path
        d={`M${rx1} ${arcY1} Q${rx1} ${arcTop} ${rx2} ${arcTop} Q${rx3} ${arcTop} ${rx3} ${arcY1}`}
        fill="none"
        stroke={`url(#sg-grad-${size})`}
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* Center bridge connecting both lobes */}
      <line
        x1={lx1} y1={arcY1}
        x2={rx3} y2={arcY1}
        stroke={`url(#sg-grad-${size})`}
        strokeWidth={sw2}
        strokeLinecap="round"
      />

      {/* Left vertical — structured knowledge pillar */}
      <line
        x1={lx1} y1={arcY1}
        x2={lx1} y2={vertBot}
        stroke="#818cf8"
        strokeWidth={sw2}
        strokeLinecap="round"
      />

      {/* Right vertical */}
      <line
        x1={rx3} y1={arcY1}
        x2={rx3} y2={vertBot}
        stroke="#38bdf8"
        strokeWidth={sw2}
        strokeLinecap="round"
      />

      {/* Bottom arc — chin / base of brain */}
      <path
        d={`M${lx1} ${botArcY1} Q${lx1} ${botArcY2} ${botMidX} ${botArcY2} Q${botEndX} ${botArcY2} ${botEndX} ${botEndY}`}
        fill="none"
        stroke={`url(#sg-grad-${size})`}
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* Spark dot — the "aha" moment */}
      <circle cx={dotX} cy={dotY} r={dotR} fill="#38bdf8" />

      {/* Pulse ring around spark */}
      <circle
        cx={dotX} cy={dotY} r={ringR}
        fill="none"
        stroke="#38bdf8"
        strokeWidth={sw3}
        strokeOpacity="0.35"
      />
    </svg>
  );
}
