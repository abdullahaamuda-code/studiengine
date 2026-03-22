"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthModalProps { onClose: () => void; defaultMode?: "signin" | "signup"; }

export default function AuthModal({ onClose, defaultMode = "signin" }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "choose" | "forgot">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, continueAsGuest } = useAuth();

  async function handleSubmit() {
    if (!email || !password) { setError("Fill in both fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError(""); setLoading(true);
    try {
      if (mode === "signin") await signIn(email, password);
      else await signUp(email, password);
      onClose();
    } catch (e: any) {
      const msg = e.code === "auth/user-not-found" ? "No account found with that email."
        : e.code === "auth/wrong-password" ? "Wrong password."
        : e.code === "auth/invalid-credential" ? "Wrong email or password."
        : e.code === "auth/email-already-in-use" ? "Email already in use. Sign in instead."
        : e.code === "auth/invalid-email" ? "Invalid email address."
        : e.message || "Something went wrong.";
      setError(msg);
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!email) { setError("Enter your email address first."); return; }
    setError(""); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Reset link sent! Check your email.");
    } catch (e: any) {
      setError(e.code === "auth/user-not-found" ? "No account found with that email." : "Failed to send reset email. Try again.");
    }
    setLoading(false);
  }

  function handleGuest() { continueAsGuest(); onClose(); }

  const Logo = () => (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
<img src="/studiengine-logo.svg" width="28" height="28" style={{ borderRadius: 7 }} />
        <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-display)" }} className="gradient-text">Studiengine</span>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(2,8,23,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="glass animate-in" style={{ borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 400, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

        <Logo />

        {mode === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn-primary" onClick={() => setMode("signup")} style={{ padding: "13px 0", borderRadius: 12, fontSize: 14 }}>
              Create Free Account
            </button>
            {/* Simple benefit */}
            <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>FREE ACCOUNT</p>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ color: "#4ade80", fontSize: 12 }}>✓</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>4 quizzes per day — 2× more than guest</span>
              </div>
            </div>
            <button className="btn-ghost" onClick={() => setMode("signin")} style={{ padding: "11px 0", borderRadius: 12, fontSize: 14 }}>Sign In</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>
            <button onClick={handleGuest} style={{
              padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 600,
              fontFamily: "var(--font-body)", cursor: "pointer",
              background: "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.2))",
              border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd", transition: "all 0.2s",
            }}>
              Continue as Guest
              <span style={{ fontSize: 11, color: "rgba(196,181,253,0.7)", marginLeft: 6 }}>(2 quizzes/day)</span>
            </button>
          </div>
        )}

        {(mode === "signin" || mode === "signup") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", margin: 0, color: "var(--text-primary)" }}>
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            {mode === "signup" && (
              <p style={{ fontSize: 12, color: "#4ade80", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "7px 12px" }}>
                ✓ Free forever — 4 quizzes/day, no credit card needed
              </p>
            )}
            <input className="input-glass" type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ padding: "12px 14px", borderRadius: 10, width: "100%" }} />
            <input className="input-glass" type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ padding: "12px 14px", borderRadius: 10, width: "100%" }} />
            {error && <p style={{ fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>{error}</p>}
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}
              style={{ padding: "13px 0", borderRadius: 12, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? <><div className="spinner" />{mode === "signin" ? "Signing in..." : "Creating account..."}</> : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => { setMode("choose"); setError(""); }} className="btn-ghost" style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8 }}>← Back</button>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {mode === "signin" && (
                  <button onClick={() => { setMode("forgot"); setError(""); setInfo(""); }}
                    style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                    Forgot password?
                  </button>
                )}
                <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                  style={{ fontSize: 12, color: "#60a5fa", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  {mode === "signin" ? "New here? Sign up" : "Have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "forgot" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", margin: 0, color: "var(--text-primary)" }}>Reset password</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Enter your email and we'll send a reset link.</p>
            <input className="input-glass" type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
              style={{ padding: "12px 14px", borderRadius: 10, width: "100%" }} />
            {error && <p style={{ fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>{error}</p>}
            {info && <p style={{ fontSize: 12, color: "#4ade80", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 12px" }}>{info}</p>}
            <button className="btn-primary" onClick={handleForgotPassword} disabled={loading}
              style={{ padding: "13px 0", borderRadius: 12, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? <><div className="spinner" /> Sending...</> : "Send Reset Link"}
            </button>
            <button onClick={() => { setMode("signin"); setError(""); setInfo(""); }} className="btn-ghost" style={{ fontSize: 12, padding: "8px 0", borderRadius: 8 }}>← Back to Sign In</button>
          </div>
        )}
      </div>
    </div>
  );
}
