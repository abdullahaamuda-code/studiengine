"use client";
import { useAuth } from "@/context/AuthContext";

interface Props { onClose: () => void; reason?: string; }

const FREE_FEATURES = [
  "4 CBTs per day",
  "Up to 15 questions per session",
  "Basic review (first 3 questions)",
  "PQ Analyzer",
  "Text PDF upload (up to 10 pages)",
  "Built-in calculator",
];

const PREMIUM_FEATURES = [
  { text: "Unlimited CBTs every day", hot: false },
  { text: "Up to 30 questions per session", hot: false },
  { text: "Full extensive review of all questions", hot: true },
  { text: "AI explanations per question", hot: true },
  { text: "CBT history & score tracking", hot: false },
  { text: "Text PDF upload (up to 30 pages)", hot: false },
  { text: "Scanned PDF support (beta, best effort)", hot: false },
];

export default function UpgradeModal({ onClose, reason }: Props) {
  const { user } = useAuth();

  function handlePayment() {
    alert("Payment coming soon! We're setting up Paystack. For now, contact us on WhatsApp to manually activate Premium.");
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(2,8,23,0.9)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "rgba(6,14,30,0.98)", border: "1px solid rgba(56,139,253,0.18)", borderRadius: 20, width: "100%", maxWidth: 420, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.7)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>×</button>

        {/* Header */}
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(56,139,253,0.08)" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)", color: "#e8f0fe", margin: "0 0 6px" }}>Upgrade to Premium</h2>
          {reason ? (
            <p style={{ fontSize: 13, color: "#fbbf24", margin: 0, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 8, padding: "7px 10px" }}>
              {reason}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>Unlock the full Studiengine experience</p>
          )}
        </div>

        {/* Pricing */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(56,139,253,0.08)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={handlePayment} style={{ padding: "14px 12px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, cursor: "pointer", textAlign: "center", fontFamily: "var(--font-body)", transition: "all 0.2s" }}>
              <p style={{ fontSize: 11, color: "#475569", margin: "0 0 4px" }}>Monthly</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#60a5fa", margin: "0 0 2px", fontFamily: "var(--font-display)" }}>₦200</p>
              <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>per month</p>
            </button>
            <button onClick={handlePayment} style={{ padding: "14px 12px", background: "linear-gradient(135deg,rgba(37,99,235,0.2),rgba(8,145,178,0.15))", border: "1px solid rgba(59,130,246,0.35)", borderRadius: 12, cursor: "pointer", textAlign: "center", fontFamily: "var(--font-body)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 6, right: 6, fontSize: 9, background: "linear-gradient(135deg,#2563eb,#0891b2)", color: "#fff", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>BEST</div>
              <p style={{ fontSize: 11, color: "#475569", margin: "0 0 4px" }}>Yearly</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#60a5fa", margin: "0 0 2px", fontFamily: "var(--font-display)" }}>₦2,000</p>
              <p style={{ fontSize: 10, color: "#4ade80", margin: 0 }}>save ₦400</p>
            </button>
          </div>
        </div>

        {/* Features comparison */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: "#334155", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Free Plan</p>
            {FREE_FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0" }}>
                <span style={{ color: "#334155", fontSize: 12 }}>✓</span>
                <span style={{ fontSize: 12, color: "#475569" }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.08),rgba(8,145,178,0.05))", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 14, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: "#60a5fa", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>⚡ Premium</p>
            {PREMIUM_FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0" }}>
                <span style={{ color: "#4ade80", fontSize: 12 }}>✓</span>
                <span style={{ fontSize: 12, color: f.hot ? "#e8f0fe" : "#94a3b8", fontWeight: f.hot ? 600 : 400 }}>{f.text}</span>
                {f.hot && <span style={{ fontSize: 9, background: "rgba(239,68,68,0.2)", color: "#f87171", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>HOT</span>}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 24px 24px" }}>
          <button onClick={handlePayment} style={{ width: "100%", padding: "14px 0", background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 0 20px rgba(37,99,235,0.3)" }}>
            Get Premium →
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "#1e293b", marginTop: 10 }}>Payment via Paystack · Coming soon</p>
        </div>
      </div>
    </div>
  );
}
