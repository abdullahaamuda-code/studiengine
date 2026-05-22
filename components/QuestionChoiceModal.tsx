"use client";

interface Props {
  found: number; requested: number; isPremium: boolean;
  onUseFound: () => void; onFillRemaining: () => void; filling?: boolean;
}

export default function QuestionChoiceModal({ found, requested, isPremium, onUseFound, onFillRemaining, filling }: Props) {
  const remaining = requested - found;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(4,6,12,0.88)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`
        @keyframes qc-in  { from{opacity:0;transform:scale(0.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes qc-spin{ to{transform:rotate(360deg)} }
        .qc-opt { padding:14px 16px; border-radius:12px; text-align:left; cursor:pointer; font-family:var(--font-body); transition:all 0.2s; width:100%; }
        .qc-opt-a { background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.22); }
        .qc-opt-a:hover { background:rgba(99,102,241,0.14); border-color:rgba(99,102,241,0.38); }
        .qc-opt-b { background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(56,189,248,0.07)); border:1px solid rgba(99,102,241,0.28); }
        .qc-opt-b:hover:not(:disabled) { background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(56,189,248,0.12)); border-color:rgba(99,102,241,0.45); }
        .qc-opt-locked { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07); opacity:0.55; cursor:not-allowed; }
      `}</style>

      <div style={{ background:"rgba(10,13,22,0.97)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:22, padding:"28px 24px", width:"100%", maxWidth:380, boxShadow:"0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)", animation:"qc-in 0.25s cubic-bezier(0.4,0,0.2,1)", position:"relative" }}>
        {/* Top glow */}
        <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent)" }} />

        {/* Icon */}
        <div style={{ width:46, height:46, borderRadius:13, background:"linear-gradient(135deg,rgba(251,191,36,0.12),rgba(234,179,8,0.07))", border:"1px solid rgba(251,191,36,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:21, marginBottom:16 }}>📋</div>

        <p style={{ fontSize:18, fontWeight:800, color:"#f1f5f9", fontFamily:"var(--font-display)", margin:"0 0 8px", letterSpacing:"-0.02em" }}>
          {found} questions found
        </p>
        <p style={{ fontSize:13.5, color:"#475569", lineHeight:1.7, margin:"0 0 22px" }}>
          Your content had <strong style={{ color:"#f1f5f9" }}>{found} questions</strong> but you selected <strong style={{ color:"#f1f5f9" }}>{requested}</strong>. What would you like to do?
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {/* Option A — use found */}
          <button className="qc-opt qc-opt-a" onClick={onUseFound}>
            <p style={{ fontSize:13.5, fontWeight:700, color:"#f1f5f9", margin:"0 0 3px" }}>
              Continue with {found} questions
            </p>
            <p style={{ fontSize:12, color:"#475569", margin:0 }}>Use only the questions from your content</p>
          </button>

          {/* Option B — AI fills */}
          <button
            className={`qc-opt ${isPremium ? "qc-opt-b" : "qc-opt-locked"}`}
            onClick={isPremium && !filling ? onFillRemaining : undefined}
            disabled={filling || !isPremium}
          >
            <p style={{ fontSize:13.5, fontWeight:700, color: isPremium ? "#f1f5f9" : "#475569", margin:"0 0 3px", display:"flex", alignItems:"center", gap:7 }}>
              {filling ? (
                <><span style={{ width:13, height:13, border:"2px solid rgba(255,255,255,0.15)", borderTopColor:"#818cf8", borderRadius:"50%", animation:"qc-spin 0.65s linear infinite", display:"inline-block" }} /> Generating {remaining} more…</>
              ) : (
                <>✨ AI generates {remaining} more
                  {!isPremium && <span style={{ fontSize:10, fontWeight:700, color:"#fbbf24", background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.25)", padding:"2px 7px", borderRadius:99, marginLeft:4 }}>⚡ PRO</span>}
                </>
              )}
            </p>
            <p style={{ fontSize:12, color:"#475569", margin:0 }}>
              {isPremium
                ? `Fill up to ${requested} with AI-generated questions on the same topic`
                : "Upgrade to Premium to generate additional questions"}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
