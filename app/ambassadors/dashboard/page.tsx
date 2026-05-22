"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AmbassadorDoc {
  uid: string;
  email: string;
  approved: boolean;
  tier: "bronze" | "silver" | "gold";
  verifiedCount: number;
  submittedForReview: boolean;
  lastSubmittedAt?: string;
  joinedAt?: string;
}

const TIERS = {
  bronze: { label: "Bronze", emoji: "🥉", color: "#cd7f32", bg: "rgba(205,127,50,0.08)", border: "rgba(205,127,50,0.25)", next: 15 },
  silver: { label: "Silver", emoji: "🥈", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.25)", next: 30 },
  gold: { label: "Gold", emoji: "🥇", color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", next: null },
} as const;

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width="26" height="26" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 8, display: "block", flexShrink: 0 }}>
        <defs>
          <linearGradient id="db-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d0f1a" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="db-s" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="60%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="db-l" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e2440" />
            <stop offset="100%" stopColor="#252b50" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#db-bg)" />
        <rect x="160" y="96" width="260" height="52" rx="26" fill="url(#db-l)" opacity="0.9" />
        <rect x="96" y="166" width="320" height="52" rx="26" fill="url(#db-l)" opacity="0.78" />
        <rect x="96" y="236" width="330" height="52" rx="26" fill="url(#db-l)" opacity="0.62" />
        <rect x="96" y="306" width="320" height="52" rx="26" fill="url(#db-l)" opacity="0.46" />
        <rect x="96" y="376" width="220" height="52" rx="26" fill="url(#db-l)" opacity="0.30" />
        <path d="M330 130 C330 130 330 86 256 86 C182 86 158 130 158 174 C158 218 194 238 256 256 C318 274 354 294 354 338 C354 382 330 426 256 426 C182 426 158 382 158 382"
          fill="none" stroke="url(#db-s)" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", background: "linear-gradient(135deg,#f1f5f9,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        Studiengine
      </span>
    </div>
  );
}

function DashboardInner() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [ambassador, setAmbassador] = useState<AmbassadorDoc | null>(null);
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [notApproved, setNotApproved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth?mode=signin");
      return;
    }

    async function load() {
      try {
        const ambSnap = await getDoc(doc(db, "ambassadors", user!.uid));
        if (!ambSnap.exists() || !ambSnap.data()?.approved) {
          setNotApproved(true);
          setLoading(false);
          return;
        }

        const ambData = { uid: user!.uid, ...ambSnap.data() } as AmbassadorDoc;
        setAmbassador(ambData);
        setSubmitDone(ambData.submittedForReview || false);

        const usageSnap = await getDoc(doc(db, "usage", user!.uid));
        if (usageSnap.exists()) setRefCode(usageSnap.data()?.referralCode || "");
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }

    load();
  }, [user, authLoading, router]);

  async function submitForReview() {
    if (!user || !ambassador) return;
    setSubmitting(true);
    try {
      await setDoc(
        doc(db, "ambassadors", user.uid),
        {
          submittedForReview: true,
          lastSubmittedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSubmitDone(true);
    } catch {}
    setSubmitting(false);
  }

  function copyLink() {
    const link = `https://www.studiengine.com.ng/auth?mode=signup&ref=${refCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 20, height: 20, border: "2.5px solid rgba(255,255,255,0.08)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "db-spin 0.7s linear infinite" }} />
        <style>{`@keyframes db-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (notApproved) {
    return (
      <div style={{ minHeight: "100vh", background: "#080c14", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" }}>Not an approved ambassador</h2>
        <p style={{ fontSize: 13.5, color: "#475569", margin: 0, textAlign: "center", lineHeight: 1.7, maxWidth: 340 }}>
          Your account hasn't been approved yet. Apply on WhatsApp and we'll review your application.
        </p>
        <button
          onClick={() => router.push("/ambassadors")}
          style={{
            padding: "11px 20px",
            borderRadius: 11,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "#64748b",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  if (!ambassador) return null;

  const tier = TIERS[ambassador.tier];
  const verifiedCount = ambassador.verifiedCount || 0;
  const nextMilestone = tier.next;
  const canSubmit = nextMilestone !== null && verifiedCount >= nextMilestone && !submitDone;
  const progress = nextMilestone ? Math.min((verifiedCount / nextMilestone) * 100, 100) : 100;
  const refLink = `https://www.studiengine.com.ng/auth?mode=signup&ref=${refCode}`;

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", fontFamily: "var(--font-body)", color: "#f1f5f9" }}>
      <style>{`
        @keyframes db-spin { to{transform:rotate(360deg)} }
        @keyframes db-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .db-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:18px 20px; }
        .copy-btn { padding:9px 16px; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; border:1px solid; transition:all 0.2s; white-space:nowrap; }
        .submit-btn { width:100%; padding:13px 0; border-radius:12px; font-size:14px; font-weight:800; cursor:pointer; font-family:inherit; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .submit-btn:hover:not(:disabled) { transform:translateY(-1px); }
        .submit-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .stats-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
        @media(min-width:640px) {
          .stats-grid { grid-template-columns:repeat(3,1fr); }
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-5%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 65%)", filter: "blur(80px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 620, margin: "0 auto", padding: "0 16px 60px" }}>
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,12,20,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <Logo />
          <button onClick={() => router.push("/ambassadors")} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontFamily: "var(--font-body)" }}>
            ← Ambassador page
          </button>
        </nav>

        <div style={{ animation: "db-in 0.4s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: tier.bg, border: `1px solid ${tier.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {tier.emoji}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)", color: "#f1f5f9", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                Ambassador Dashboard
              </h1>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: tier.bg, border: `1px solid ${tier.border}`, fontSize: 12, fontWeight: 700, color: tier.color }}>
                {tier.emoji} {tier.label} Ambassador
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="db-card" style={{ textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#34d399", fontFamily: "var(--font-display)", margin: "0 0 2px" }}>{verifiedCount}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Verified</p>
              <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>Approved referrals</p>
            </div>

            <div className="db-card" style={{ textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#818cf8", fontFamily: "var(--font-display)", margin: "0 0 2px" }}>{nextMilestone ? `${verifiedCount}/${nextMilestone}` : verifiedCount}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Progress</p>
              <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>To next tier</p>
            </div>
          </div>

          {nextMilestone && (
            <div className="db-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", margin: 0 }}>
  Progress to {ambassador.tier === "bronze" ? "Silver" : "Gold"}
</p>
                <span style={{ fontSize: 12, color: "#475569" }}>{verifiedCount} / {nextMilestone}</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,${tier.color},${tier.color})`, borderRadius: 99, transition: "width 0.6s ease" }} />
              </div>
              <p style={{ fontSize: 11.5, color: "#334155", margin: 0 }}>
                {nextMilestone - verifiedCount > 0
                  ? `${nextMilestone - verifiedCount} more verified referrals to unlock the next tier`
                  : `🎉 You've hit the milestone! Submit for review below.`}
              </p>
            </div>
          )}

          <div className="db-card" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Your Referral Link
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "10px 13px", fontSize: 12.5, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {refCode ? refLink : "Loading…"}
              </div>
              <button
                className="copy-btn"
                onClick={copyLink}
                style={{
                  background: copied ? "rgba(52,211,153,0.12)" : "rgba(99,102,241,0.12)",
                  borderColor: copied ? "rgba(52,211,153,0.3)" : "rgba(99,102,241,0.3)",
                  color: copied ? "#34d399" : "#818cf8",
                }}
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#334155", marginTop: 8, marginBottom: 0 }}>
              Anyone who signs up through this link is tracked to you automatically.
            </p>
          </div>

          {(canSubmit || submitDone) && (
            <div className="db-card" style={{ background: submitDone ? "rgba(56,189,248,0.05)" : "rgba(251,191,36,0.05)", border: `1px solid ${submitDone ? "rgba(56,189,248,0.2)" : "rgba(251,191,36,0.22)"}` }}>
              {submitDone ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>⏳</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", margin: "0 0 2px" }}>Review submitted</p>
                    <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>We're reviewing your referrals and will contact you soon.</p>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", margin: "0 0 4px" }}>
                    🎉 You've hit the milestone!
                  </p>
                  <p style={{ fontSize: 12.5, color: "#475569", margin: "0 0 14px", lineHeight: 1.65 }}>
                    Submit for review to unlock your next tier perks.
                  </p>
                  <button
                    className="submit-btn"
                    onClick={submitForReview}
                    disabled={submitting}
                    style={{
                      background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                      border: "none",
                      color: "#000",
                      boxShadow: "0 4px 20px rgba(251,191,36,0.3)",
                    }}
                  >
                    {submitting ? "Submitting…" : "Submit for Review →"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AmbassadorDashboardPage() {
  return (
    <Suspense fallback={<div />}>
      <DashboardInner />
    </Suspense>
  );
}
