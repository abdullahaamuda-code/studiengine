"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import QuizPlayer from "@/components/QuizPlayer";
import { useAuth } from "@/context/AuthContext";

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
      <svg width="28" height="28" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 7 }}>
        <defs>
          <linearGradient id="qlb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0a1628"/><stop offset="100%" stopColor="#0c1a2e"/></linearGradient>
          <linearGradient id="qls" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#22d3ee"/></linearGradient>
        </defs>
        <rect width="80" height="80" rx="16" fill="url(#qlb)"/>
        <rect x="30" y="12" width="34" height="8" rx="4" fill="#1e3a5f" opacity="0.8"/>
        <rect x="14" y="24" width="50" height="8" rx="4" fill="#1e3a5f" opacity="0.7"/>
        <rect x="14" y="36" width="52" height="8" rx="4" fill="#1e3a5f" opacity="0.6"/>
        <rect x="14" y="48" width="50" height="8" rx="4" fill="#1e3a5f" opacity="0.5"/>
        <rect x="14" y="60" width="34" height="8" rx="4" fill="#1e3a5f" opacity="0.4"/>
        <path d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60" fill="none" stroke="url(#qls)" strokeWidth="6.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-display)", background: "linear-gradient(135deg,#60a5fa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Studiengine</span>
    </div>
  );
}

export default function SharedQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { continueAsGuest } = useAuth();
  const [questions, setQuestions] = useState<any[] | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "sharedQuizzes", id as string)).then(snap => {
      if (!snap.exists()) { setError("This quiz link is invalid or has expired."); setLoading(false); return; }
      const data = snap.data();
      setQuestions(data.questions);
      setMeta({ subject: data.subject, count: data.questions?.length });
      setLoading(false);
    }).catch(() => { setError("Could not load quiz."); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#03080f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#60a5fa", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#03080f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "var(--font-body)", gap: 12 }}>
      <div style={{ fontSize: 40 }}>😕</div>
      <p style={{ fontSize: 16, color: "#e8f0fe", fontFamily: "var(--font-display)", fontWeight: 700 }}>Quiz not found</p>
      <p style={{ fontSize: 13, color: "#475569" }}>{error}</p>
      <button onClick={() => router.push("/landing")} style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", color: "#fff", padding: "12px 24px", borderRadius: 10, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Try Studiengine →</button>
    </div>
  );

  if (started && questions) return (
    <div style={{ minHeight: "100vh", background: "#03080f", fontFamily: "var(--font-body)" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ marginBottom: 16 }}><Logo /></div>
        <div style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 18, padding: "22px 18px" }}>
          <QuizPlayer
            questions={questions}
            onReset={() => router.push("/landing")}
            notice={meta?.subject ? `Subject: ${meta.subject}` : undefined}
          />
        </div>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#334155" }}>
          Powered by Studiengine ·{" "}
          <button onClick={() => router.push("/app")} style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>Create your own CBT</button>
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#03080f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "var(--font-body)" }}>
      <div style={{ maxWidth: 400, width: "100%" }}>
        <div style={{ marginBottom: 28 }}><Logo /></div>
        <div style={{ background: "rgba(8,20,40,0.7)", border: "1px solid rgba(56,139,253,0.18)", borderRadius: 20, padding: "28px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", color: "#e8f0fe", margin: "0 0 6px" }}>
            {meta?.subject ? `${meta.subject} CBT` : "Shared CBT Quiz"}
          </h1>
          <p style={{ fontSize: 13, color: "#475569", margin: "0 0 24px" }}>{meta?.count} questions · Shared via Studiengine</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { continueAsGuest(); setStarted(true); }} style={{ width: "100%", padding: "13px 0", background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Take the Quiz →
            </button>
            <button onClick={() => router.push("/app")} style={{ width: "100%", padding: "11px 0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#7896b4", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Sign in to save your score
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#1e293b", marginTop: 20 }}>
            Want to create your own?{" "}
            <button onClick={() => router.push("/landing")} style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 11, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>Try Studiengine free</button>
          </p>
        </div>
      </div>
    </div>
  );
}
