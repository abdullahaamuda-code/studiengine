"use client";

interface Props {
  found: number;
  requested: number;
  isPremium: boolean;
  onUseFound: () => void;
  onFillRemaining: () => void;
  filling?: boolean;
}

export default function QuestionChoiceModal({ found, requested, isPremium, onUseFound, onFillRemaining, filling }: Props) {
  const remaining = requested - found;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(2,8,23,0.88)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="glass animate-in" style={{ borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,rgba(251,191,36,0.2),rgba(234,179,8,0.1))", border: "1px solid rgba(251,191,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
          📋
        </div>

        <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: 8 }}>
          {found} questions found
        </p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
          Your content had <strong style={{ color: "var(--text-primary)" }}>{found} questions</strong> but you selected <strong style={{ color: "var(--text-primary)" }}>{requested}</strong>. What would you like to do?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Option 1 — use what was found */}
          <button onClick={onUseFound} style={{
            padding: "14px 16px", borderRadius: 12, textAlign: "left",
            background: "rgba(37,99,235,0.12)", border: "1px solid rgba(59,130,246,0.25)",
            color: "var(--text-primary)", cursor: "pointer", fontFamily: "var(--font-body)",
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 3px" }}>Continue with {found} questions</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Use only the questions from your content</p>
          </button>

          {/* Option 2 — AI fills the rest (premium only) */}
          <button
            onClick={isPremium ? onFillRemaining : undefined}
            disabled={filling || !isPremium}
            style={{
              padding: "14px 16px", borderRadius: 12, textAlign: "left",
              background: !isPremium
                ? "rgba(255,255,255,0.03)"
                : filling
                ? "rgba(37,99,235,0.08)"
                : "linear-gradient(135deg,rgba(37,99,235,0.2),rgba(8,145,178,0.15))",
              border: `1px solid ${!isPremium ? "rgba(255,255,255,0.08)" : "rgba(59,130,246,0.4)"}`,
              color: !isPremium ? "var(--text-muted)" : filling ? "var(--text-muted)" : "var(--text-primary)",
              cursor: !isPremium || filling ? "not-allowed" : "pointer",
              fontFamily: "var(--font-body)",
              opacity: !isPremium ? 0.6 : 1,
            }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 3px", display: "flex", alignItems: "center", gap: 6 }}>
              {filling
                ? <><span style={{ animation: "spin 0.7s linear infinite", display: "inline-block" }}>⏳</span> Generating {remaining} more...</>
                : <>✨ AI generates {remaining} more {!isPremium && <span style={{ fontSize: 10, color: "#fbbf24", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", padding: "2px 7px", borderRadius: 20 }}>⚡ Premium</span>}</>
              }
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
              {isPremium ? `Fill up to ${requested} with AI-generated questions on the same topic` : "Upgrade to Premium to generate additional questions"}
            </p>
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
