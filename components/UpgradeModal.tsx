"use client";

interface Props { onClose: () => void; reason?: string; }

export default function UpgradeModal({ onClose, reason }: Props) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(2,8,23,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass animate-in" style={{ borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380, textAlign: "center", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        <div style={{ fontSize: 36, marginBottom: 10 }}>⚡</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 8 }} className="gradient-text">Upgrade to Premium</h2>
        {reason && <p style={{ fontSize: 13, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 8, padding: "8px 14px", marginBottom: 16 }}>{reason}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          <div className="glass-static" style={{ borderRadius: 12, padding: "12px 10px" }}>
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>MONTHLY</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: 2 }}>₦200</p>
            <p style={{ fontSize: 10, color: "var(--text-muted)" }}>per month</p>
          </div>
          <div style={{ borderRadius: 12, padding: "12px 10px", background: "linear-gradient(135deg,rgba(37,99,235,0.2),rgba(8,145,178,0.15))", border: "1px solid rgba(59,130,246,0.4)", position: "relative" }}>
            <span style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", fontSize: 9, background: "#16a34a", color: "#fff", padding: "2px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>BEST VALUE</span>
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>YEARLY</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#93c5fd", fontFamily: "var(--font-display)", marginBottom: 2 }}>₦2,000</p>
            <p style={{ fontSize: 10, color: "var(--text-muted)" }}>per year</p>
          </div>
        </div>

        <div style={{ textAlign: "left", marginBottom: 18 }}>
          {[
            "Unlimited quiz generations",
            "Unlimited scanned PDF uploads",
            "Up to 30 questions per quiz",
            "Full extensive review after every quiz",
            "Quiz history — review past sessions anytime",
            "Priority AI processing",
          ].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ color: "#4ade80", fontSize: 12 }}>✓</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{f}</span>
            </div>
          ))}
        </div>

        <button className="btn-primary" style={{ width: "100%", padding: "12px 0", borderRadius: 12, fontSize: 14, marginBottom: 10 }}
          onClick={() => alert("Payment coming soon via Paystack! 🚀")}>
          Get Premium — Coming Soon
        </button>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>
          Continue with free plan
        </button>
      </div>
    </div>
  );
}