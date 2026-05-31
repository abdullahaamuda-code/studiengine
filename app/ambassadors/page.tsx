"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
} from "firebase/firestore";

interface AmbassadorDoc {
  uid: string;
  email: string;
  name?: string;
  approved: boolean;
  tier: "bronze" | "silver" | "gold";
  verifiedCount: number;
  pendingCount: number;
  totalEarnings: number;
  joinedAt: string;
  featuredName?: string;
  submittedForReview?: boolean;
  lastSubmittedAt?: string;
}

interface ReferralDoc {
  id: string;
  newUserEmail: string;
  newUserUid: string;
  referralCode: string;
  verified: boolean;
  active: boolean;
  createdAt: string;
}

const TIERS = [
  {
    id: "bronze",
    label: "Bronze",
    emoji: "🥉",
    color: "#cd7f32",
    bg: "rgba(205,127,50,0.08)",
    border: "rgba(205,127,50,0.25)",
    req: "0–14 verified referrals",
    perks: [
      "1 free month Premium per 5 verified referrals",
      "1 free month for every paying user you refer",
      "Access to Ambassador dashboard",
      "Ambassador WhatsApp group",
    ],
  },
  {
    id: "silver",
    label: "Silver",
    emoji: "🥈",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.25)",
    req: "15–29 verified referrals",
    perks: [
      "Everything in Bronze",
      "10% commission per paying user you refer",
      "Priority support",
      "Early access to new features",
    ],
  },
  {
    id: "gold",
    label: "Gold",
    emoji: "🥇",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.25)",
    req: "30+ verified referrals",
    perks: [
      "Everything in Silver",
      "20% commission per active Premium user",
      "Featured on the Ambassadors page",
      "Co-create Studiengine content",
      "Exclusive Gold badge",
    ],
  },
] as const;

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Apply to join",
    desc: "Message us on WhatsApp to apply. We'll review and approve you — then you get your unique referral link.",
  },
  {
    n: "02",
    title: "Share your link",
    desc: "Share your referral link with friends, classmates, or your audience. Anyone who signs up through it is tracked to you.",
  },
  {
    n: "03",
    title: "Submit for review",
    desc: "When you hit a milestone, submit for review from your dashboard. We verify your referrals and activate your rewards.",
  },
];

const WHATSAPP_NUMBER = "2348169936326";

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: 9, display: "block", flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="amb-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d0f1a" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="amb-s" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="60%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="amb-l" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e2440" />
            <stop offset="100%" stopColor="#252b50" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#amb-bg)" />
        <rect x="160" y="96" width="260" height="52" rx="26" fill="url(#amb-l)" opacity="0.9" />
        <rect x="96" y="166" width="320" height="52" rx="26" fill="url(#amb-l)" opacity="0.78" />
        <rect x="96" y="236" width="330" height="52" rx="26" fill="url(#amb-l)" opacity="0.62" />
        <rect x="96" y="306" width="320" height="52" rx="26" fill="url(#amb-l)" opacity="0.46" />
        <rect x="96" y="376" width="220" height="52" rx="26" fill="url(#amb-l)" opacity="0.30" />
        <path
          d="M330 130 C330 130 330 86 256 86 C182 86 158 130 158 174 C158 218 194 238 256 256 C318 274 354 294 354 338 C354 382 330 426 256 426 C182 426 158 382 158 382"
          fill="none"
          stroke="url(#amb-s)"
          strokeWidth="42"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontSize: 16,
          fontWeight: 800,
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.02em",
          background: "linear-gradient(135deg,#f1f5f9,#818cf8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Studiengine
      </span>
    </div>
  );
}

function AmbassadorDashboard({
  ambassador,
  referrals,
  onSubmit,
  submitting,
}: {
  ambassador: AmbassadorDoc;
  referrals: ReferralDoc[];
  onSubmit: () => void;
  submitting: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    getDoc(doc(db, "usage", ambassador.uid)).then((snap) => {
      if (snap.exists()) setRefCode(snap.data()?.referralCode || "");
    });
  }, [ambassador.uid]);

  const tier = TIERS.find((t) => t.id === ambassador.tier) || TIERS[0];
  const nextTierIndex = TIERS.findIndex((t) => t.id === ambassador.tier) + 1;
  const nextTier = TIERS[nextTierIndex];
  const verified = ambassador.verifiedCount || 0;
  const pending = referrals.filter((r) => !r.verified).length;
  const active = referrals.filter((r) => r.verified && r.active).length;

  const nextMilestone = ambassador.tier === "bronze" ? 15 : ambassador.tier === "silver" ? 30 : null;
  const canSubmit = nextMilestone !== null && verified >= nextMilestone && !ambassador.submittedForReview;
  const alreadySubmitted = ambassador.submittedForReview;
  const progress = nextMilestone ? Math.min((verified / nextMilestone) * 100, 100) : 100;

  const link = `https://www.studiengine.com.ng/auth?mode=signup&ref=${refCode}`;

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 16px 60px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 26 }}>{tier.emoji}</span>
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                color: "#f1f5f9",
                margin: "0 0 2px",
                letterSpacing: "-0.02em",
              }}
            >
              Your Ambassador Dashboard
            </h2>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 10px",
                borderRadius: 99,
                background: tier.bg,
                border: `1px solid ${tier.border}`,
                fontSize: 12,
                fontWeight: 700,
                color: tier.color,
              }}
            >
              {tier.emoji} {tier.label} Ambassador
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Verified", value: verified, color: "#34d399", note: "Approved referrals" },
          { label: "Pending", value: pending, color: "#fbbf24", note: "Awaiting review" },
          { label: "Active", value: active, color: "#818cf8", note: "Using the app" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 13,
              padding: "14px 12px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "var(--font-display)", margin: "0 0 2px", letterSpacing: "-0.02em" }}>{s.value}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", margin: "0 0 1px" }}>{s.label}</p>
            <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>{s.note}</p>
          </div>
        ))}
      </div>

      {nextTier && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Progress to {nextTier.label}</p>
            <span style={{ fontSize: 12, color: "#475569" }}>{verified} / {nextMilestone}</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: `linear-gradient(90deg,${tier.color},${nextTier.color})`,
                borderRadius: 99,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <p style={{ fontSize: 11, color: "#334155", marginTop: 8 }}>
            {nextMilestone! - verified > 0
              ? `${nextMilestone! - verified} more verified referrals to reach ${nextTier.label}`
              : `You've hit the ${nextTier.label} milestone! Submit for review below.`}
          </p>
        </div>
      )}

      <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
          Your Referral Link
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "9px 12px", fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {refCode ? link : "Loading…"}
          </div>
          <button
            onClick={copyLink}
            style={{
              padding: "9px 14px",
              borderRadius: 9,
              background: copied ? "rgba(52,211,153,0.15)" : "rgba(99,102,241,0.15)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(99,102,241,0.3)"}`,
              color: copied ? "#34d399" : "#818cf8",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {(canSubmit || alreadySubmitted) && (
        <div
          style={{
            background: alreadySubmitted ? "rgba(56,189,248,0.05)" : "rgba(251,191,36,0.05)",
            border: `1px solid ${alreadySubmitted ? "rgba(56,189,248,0.2)" : "rgba(251,191,36,0.2)"}`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          {alreadySubmitted ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", margin: "0 0 2px" }}>Review submitted</p>
                <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>We're reviewing your referrals. You'll hear from us soon via WhatsApp.</p>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", margin: "0 0 4px" }}>
                🎉 You've hit the {nextTier?.label} milestone!
              </p>
              <p style={{ fontSize: 12, color: "#475569", margin: "0 0 12px", lineHeight: 1.6 }}>
                Submit for review to unlock your {nextTier?.label} tier perks. We'll verify your referrals manually and activate your rewards.
              </p>
              <button
                onClick={onSubmit}
                disabled={submitting}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                  border: "none",
                  color: "#000",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? "Submitting…" : "Submit for Review →"}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            People you invited ({referrals.length})
          </p>
        </div>

        {referrals.length === 0 ? (
          <div style={{ padding: "28px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>No referrals yet — share your link to get started.</p>
          </div>
        ) : (
          <div>
            {referrals.map((r, i) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 16px",
                  borderBottom: i < referrals.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: "#f1f5f9", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.newUserEmail}
                  </p>
                  <p style={{ fontSize: 11, color: "#334155", margin: 0 }}>
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recently"}
                    {r.active ? " · Used the app" : " · Signed up only"}
                  </p>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {r.verified ? (
                    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399", fontWeight: 700 }}>
                      Verified
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontWeight: 700 }}>
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AmbassadorsInner() {
  const router = useRouter();
  const { user, loading: authLoading, isApprovedAmbassador } = useAuth();

  const [ambassador, setAmbassador] = useState<AmbassadorDoc | null>(null);
  const [referrals, setReferrals] = useState<ReferralDoc[]>([]);
  const [featured, setFeatured] = useState<AmbassadorDoc[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<"public" | "dashboard">("public");

  useEffect(() => {
    async function load() {
      setLoadingData(true);
      try {
        const featuredSnap = await getDocs(
          query(collection(db, "ambassadors"), where("approved", "==", true), orderBy("verifiedCount", "desc"))
        );
        setFeatured(featuredSnap.docs.map((d) => ({ uid: d.id, ...d.data() })) as AmbassadorDoc[]);

        if (user && isApprovedAmbassador) {
          const ambSnap = await getDoc(doc(db, "ambassadors", user.uid));
          if (ambSnap.exists() && ambSnap.data()?.approved === true) {
            const ambData = { uid: user.uid, ...ambSnap.data() } as AmbassadorDoc;
            setAmbassador(ambData);

            const refSnap = await getDocs(
              query(collection(db, "referrals"), where("referrerUid", "==", user.uid), orderBy("createdAt", "desc"))
            );
            setReferrals(refSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ReferralDoc[]);
            setView("dashboard");
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoadingData(false);
    }

    if (!authLoading) load();
  }, [user, authLoading, isApprovedAmbassador]);

  async function handleSubmitReview() {
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
      setAmbassador((a) => (a ? { ...a, submittedForReview: true } : a));
    } catch {}
    setSubmitting(false);
  }

  function openWhatsApp() {
    const msg = `Hi! I'd like to join the Studiengine Ambassador Program. My email is ${user?.email || "[your email]"}.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  // ✅ UPDATED: smart back — signed in → /app, signed out → /landing
  function goBack() {
    if (user) {
      router.push("/app");
    } else {
      router.push("/landing");
    }
  }

  if (authLoading || loadingData) {
    return (
      <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 20, height: 20, border: "2.5px solid rgba(255,255,255,0.08)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", fontFamily: "var(--font-body)", color: "#f1f5f9", overflowX: "hidden" }}>
      <style>{`
        @keyframes amb-spin { to{transform:rotate(360deg)} }
        @keyframes amb-in { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer-x { 0%{background-position:200% center} 100%{background-position:-200% center} }

        .amb-title {
          background:linear-gradient(135deg,#f1f5f9 0%,#818cf8 35%,#38bdf8 65%,#f1f5f9 100%);
          background-size:300% auto;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
          animation:shimmer-x 6s linear infinite;
        }

        .tier-card { border-radius:16px; padding:22px 20px; border:1px solid; transition:all 0.25s; }
        .tier-card:hover { transform:translateY(-3px); }

        .wa-cta { transition:all 0.2s; }
        .wa-cta:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(52,211,153,0.4) !important; }

        .join-btn { transition:all 0.2s; }
        .join-btn:hover { box-shadow:0 8px 28px rgba(99,102,241,0.45) !important; transform:translateY(-1px); }

        .featured-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:16px; transition:all 0.2s; }
        .featured-card:hover { border-color:rgba(255,255,255,0.14); transform:translateY(-2px); }

        .divider-line { height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent); }

        @media(max-width:640px) {
          .tiers-grid { grid-template-columns:1fr !important; }
          .how-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-5%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 65%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.02) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <nav
          style={{
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(8,12,20,0.8)",
            backdropFilter: "blur(20px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Logo />
          </button>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* ✅ UPDATED: smart back button */}
            <button
              onClick={goBack}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#cbd5e1",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              ← Back
            </button>

            {/* ✅ UPDATED: dashboard button for approved ambassadors */}
            {isApprovedAmbassador && (
              <button
                onClick={() => router.push("/ambassadors/dashboard")}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  color: "#818cf8",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.15s",
                }}
              >
                My Dashboard
              </button>
            )}

            {!user && (
              <button
                onClick={() => router.push("/auth?mode=signin")}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </nav>

        {view === "dashboard" && ambassador && (
          <AmbassadorDashboard
            ambassador={ambassador}
            referrals={referrals}
            onSubmit={handleSubmitReview}
            submitting={submitting}
          />
        )}

        {view === "public" && (
          <>
            <section style={{ textAlign: "center", padding: "90px 24px 70px", maxWidth: 700, margin: "0 auto", animation: "amb-in 0.5s ease" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)", borderRadius: 99, padding: "5px 16px 5px 10px", fontSize: 12, color: "#a5b4fc", marginBottom: 24 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 8px rgba(129,140,248,0.8)", display: "inline-block" }} />
                Now recruiting ambassadors across Nigeria
              </div>

              <h1 className="amb-title" style={{ fontSize: "clamp(32px,6vw,60px)", fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 18px" }}>
                Become a Studiengine<br />Ambassador
              </h1>

              <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "#64748b", lineHeight: 1.75, maxWidth: 480, margin: "0 auto 32px" }}>
                Help Nigerian students study smarter — and earn real rewards for every person you bring. Free premium, commissions, and recognition.
              </p>

              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  className="wa-cta"
                  onClick={openWhatsApp}
                  style={{
                    padding: "13px 28px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#25d366,#128c7e)",
                    border: "none",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    boxShadow: "0 4px 20px rgba(37,211,102,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 17 }}>💬</span> Apply on WhatsApp
                </button>

                {isApprovedAmbassador && (
                  <button
                    className="join-btn"
                    onClick={() => router.push("/ambassadors/dashboard")}
                    style={{
                      padding: "13px 24px",
                      borderRadius: 12,
                      background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                      border: "1px solid rgba(129,140,248,0.4)",
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                    }}
                  >
                    My Dashboard →
                  </button>
                )}
              </div>
            </section>

            <div className="divider-line" style={{ maxWidth: 900, margin: "0 auto" }} />

            <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Ambassador Tiers</p>
                <h2 style={{ fontSize: "clamp(22px,4vw,36px)", fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.025em", margin: "0 0 10px", color: "#f1f5f9" }}>
                  The more you share, the more you earn
                </h2>
                <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>Tiers are based on verified referrals — people who actually sign up and use Studiengine.</p>
              </div>

              <div className="tiers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {TIERS.map((t) => (
                  <div key={t.id} className="tier-card" style={{ background: t.bg, borderColor: t.border }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{t.emoji}</div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: t.color, fontFamily: "var(--font-display)", margin: "0 0 4px", letterSpacing: "-0.01em" }}>{t.label}</p>
                    <p style={{ fontSize: 11, color: "#334155", margin: "0 0 18px", fontWeight: 600 }}>{t.req}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {t.perks.map((p, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ width: 14, height: 14, borderRadius: 4, background: `${t.color}18`, border: `1px solid ${t.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, color: t.color, marginTop: 2 }}>✓</span>
                          <span style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.55 }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="divider-line" style={{ maxWidth: 900, margin: "0 auto" }} />

            <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>How it works</p>
                <h2 style={{ fontSize: "clamp(22px,4vw,36px)", fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.025em", margin: 0, color: "#f1f5f9" }}>
                  Simple. Transparent. Rewarding.
                </h2>
              </div>

              <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3 }}>
                {HOW_IT_WORKS.map((s, i) => (
                  <div key={i} style={{ padding: "28px 24px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(129,140,248,0.5)", letterSpacing: "0.08em", marginBottom: 12 }}>{s.n}</p>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 15, color: "#818cf8" }}>
                      {["✦", "◈", "◉"][i]}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px", fontFamily: "var(--font-display)" }}>{s.title}</h3>
                    <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ textAlign: "center", padding: "80px 24px 100px", maxWidth: 560, margin: "0 auto" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>💬</div>
              <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.025em", margin: "0 0 12px", color: "#f1f5f9" }}>
                Ready to join?
              </h2>
              <p style={{ fontSize: 14, color: "#475569", marginBottom: 28, lineHeight: 1.75 }}>
                Message us on WhatsApp with your name and email. We'll review your application and add you to the Ambassador WhatsApp group within 24 hours.
              </p>
              <button
                className="wa-cta"
                onClick={openWhatsApp}
                style={{
                  padding: "15px 36px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#25d366,#128c7e)",
                  border: "none",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  boxShadow: "0 4px 20px rgba(37,211,102,0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <span style={{ fontSize: 18 }}>💬</span> Apply on WhatsApp →
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function AmbassadorsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 20, height: 20, border: "2.5px solid rgba(255,255,255,0.08)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }
    >
      <AmbassadorsInner />
    </Suspense>
  );
}
