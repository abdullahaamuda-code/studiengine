"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const reference = params.get("reference") || params.get("trxref");

  const [status, setStatus] = useState<"waiting" | "success" | "timeout">("waiting");
  const [plan, setPlan] = useState<string>("");
  const [expiry, setExpiry] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    // Poll Firestore until isPremium flips true (webhook may take a few seconds)
    const start = Date.now();
    const TIMEOUT = 30_000; // 30s max wait

    const unsub = onSnapshot(doc(db, "usage", user.uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      if (data?.isPremium) {
        const raw = data.premiumExpiry;
        // Firestore Timestamp → Date
        const expiryDate = raw?.toDate ? raw.toDate() : new Date(raw);
        setExpiry(expiryDate);
        setPlan(data.premiumPlan || "monthly");
        setStatus("success");
        unsub();
      } else if (Date.now() - start > TIMEOUT) {
        setStatus("timeout");
        unsub();
      }
    });

    return () => unsub();
  }, [user]);

  // Auto-redirect to app after 5 seconds once success confirmed
  useEffect(() => {
    if (status === "success") {
      const t = setTimeout(() => router.replace("/app"), 5000);
      return () => clearTimeout(t);
    }
  }, [status, router]);

  const planLabel: Record<string, string> = {
    monthly:   "1 Month",
    quarterly: "3 Months",
    annual:    "1 Year",
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080c14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body)",
        padding: "24px",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.88) translateY(16px) }
          100% { opacity: 1; transform: scale(1) translateY(0) }
        }
        @keyframes shimmer-x {
          0% { background-position: 200% center }
          100% { background-position: -200% center }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52,211,153,0.4) }
          70% { transform: scale(1); box-shadow: 0 0 0 16px rgba(52,211,153,0) }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52,211,153,0) }
        }
        .success-card {
          animation: pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .shimmer-text {
          background: linear-gradient(135deg,#f1f5f9 0%,#34d399 35%,#38bdf8 65%,#f1f5f9 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-x 4s linear infinite;
        }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(52,211,153,0.07) 0%,transparent 65%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 65%)", filter: "blur(80px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>

        {/* ── WAITING ── */}
        {status === "waiting" && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                border: "3px solid rgba(255,255,255,0.06)",
                borderTopColor: "#34d399",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", margin: "0 0 8px" }}>
              Confirming your payment…
            </p>
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
              This usually takes just a few seconds.
            </p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === "success" && expiry && (
          <div
            className="success-card"
            style={{
              background: "rgba(10,13,22,0.97)",
              border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: 22,
              padding: "36px 28px",
              textAlign: "center",
              backdropFilter: "blur(14px)",
              boxShadow: "0 0 60px rgba(52,211,153,0.08), 0 24px 60px rgba(0,0,0,0.5)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top glow line */}
            <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(90deg,transparent,rgba(52,211,153,0.5),transparent)" }} />

            {/* Check icon */}
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "rgba(52,211,153,0.1)",
                border: "2px solid rgba(52,211,153,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                animation: "pulse-ring 2s ease-in-out infinite",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M7 16.5L13 22.5L25 10" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h1
              className="shimmer-text"
              style={{
                fontSize: 26,
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
                margin: "0 0 8px",
              }}
            >
              You're Premium! 🎉
            </h1>

            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
              Your payment was successful. Welcome to Studiengine Premium.
            </p>

            {/* Plan details card */}
            <div
              style={{
                background: "rgba(52,211,153,0.05)",
                border: "1px solid rgba(52,211,153,0.15)",
                borderRadius: 14,
                padding: "16px 20px",
                marginBottom: 24,
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>Plan</span>
                <span style={{ fontSize: 13, color: "#34d399", fontWeight: 700 }}>
                  👑 {planLabel[plan] || plan} Premium
                </span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 10 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>Access until</span>
                <span style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 700 }}>
                  {formatDate(expiry)}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.replace("/app")}
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 12,
                background: "linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)",
                border: "1px solid rgba(129,140,248,0.4)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                letterSpacing: "0.01em",
              }}
            >
              Go to App →
            </button>

            <p style={{ fontSize: 11, color: "#334155", marginTop: 14, margin: "14px 0 0" }}>
              Redirecting automatically in 5 seconds…
            </p>
          </div>
        )}

        {/* ── TIMEOUT ── */}
        {status === "timeout" && (
          <div
            className="success-card"
            style={{
              background: "rgba(10,13,22,0.97)",
              border: "1px solid rgba(251,191,36,0.2)",
              borderRadius: 22,
              padding: "36px 28px",
              textAlign: "center",
              backdropFilter: "blur(14px)",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24", fontFamily: "var(--font-display)", margin: "0 0 10px" }}>
              Payment received
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px", lineHeight: 1.7 }}>
              Your payment went through but your account is still being upgraded.
              This can take up to a minute. Refresh the app in a moment — if you're
              still not upgraded, message us on WhatsApp.
            </p>
            <button
              onClick={() => router.replace("/app")}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#f1f5f9",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Go to App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 24, height: 24, border: "2.5px solid rgba(255,255,255,0.08)", borderTopColor: "#34d399", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
