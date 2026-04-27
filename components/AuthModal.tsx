"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

/* ── Logo ── */
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
      <svg width="30" height="30" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 10, display: "block", flexShrink: 0 }}>
        <defs>
          <linearGradient id="ab2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d0f1a" /><stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="as2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <rect width="80" height="80" rx="18" fill="url(#ab2)" />
        <rect x="30" y="12" width="34" height="7" rx="3.5" fill="#1e2440" opacity="0.9" />
        <rect x="14" y="23" width="50" height="7" rx="3.5" fill="#1e2440" opacity="0.75" />
        <rect x="14" y="34" width="52" height="7" rx="3.5" fill="#1e2440" opacity="0.6" />
        <rect x="14" y="45" width="50" height="7" rx="3.5" fill="#1e2440" opacity="0.45" />
        <rect x="14" y="56" width="34" height="7" rx="3.5" fill="#1e2440" opacity="0.3" />
        <path d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60" fill="none" stroke="url(#as2)" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", background: "linear-gradient(135deg,#f1f5f9,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        Studiengine
      </span>
    </div>
  );
}

/* ── Input — defined outside to prevent remount ── */
const Input = ({ type, placeholder, value, onChange }: {
  type: string; placeholder: string; value: string; onChange: (v: string) => void;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        background: focused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? "rgba(99,102,241,0.55)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 10,
        color: "#f1f5f9",
        padding: "12px 14px",
        fontSize: 14,
        outline: "none",
        fontFamily: "var(--font-body)",
        boxSizing: "border-box",
        transition: "all 0.2s",
        boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
      }}
    />
  );
};

/* ── Divider ── */
const Divider = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
    <span style={{ fontSize: 11, color: "#334155", letterSpacing: "0.04em" }}>or</span>
    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
  </div>
);

/* ── Error / Info banners ── */
const ErrorMsg = ({ msg }: { msg: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#fca5a5", background: "rgba(36,10,10,0.7)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8, padding: "10px 12px" }}>
    <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>{msg}
  </div>
);
const InfoMsg = ({ msg }: { msg: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#6ee7b7", background: "rgba(4,47,29,0.6)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 8, padding: "10px 12px" }}>
    <span style={{ flexShrink: 0, marginTop: 1 }}>✓</span>{msg}
  </div>
);

/* ── Primary button ── */
const PrimaryBtn = ({ onClick, disabled, loading, children }: { onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: "100%",
      padding: "13px 0",
      borderRadius: 10,
      background: disabled || loading
        ? "rgba(99,102,241,0.25)"
        : "linear-gradient(135deg,#6366f1 0%,#4f46e5 60%,#4338ca 100%)",
      border: "1px solid rgba(129,140,248,0.35)",
      color: "#fff",
      fontSize: 14,
      fontWeight: 700,
      cursor: disabled || loading ? "not-allowed" : "pointer",
      fontFamily: "var(--font-body)",
      letterSpacing: "0.01em",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      transition: "all 0.2s",
      boxShadow: disabled || loading ? "none" : "0 4px 20px rgba(99,102,241,0.3)",
    }}
    onMouseEnter={e => { if (!disabled && !loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 28px rgba(99,102,241,0.5)"; }}
    onMouseLeave={e => { if (!disabled && !loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.3)"; }}
  >
    {loading ? (
      <>
        <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "auth-spin 0.65s linear infinite", display: "inline-block" }} />
        {children}
      </>
    ) : children}
  </button>
);

export default function AuthModal({ open, onClose, initialMode = "signup" }: Props) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode === "signin" ? "signin" : "signup");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");
  const [loading, setLoading]   = useState(false);
  const { signIn, signUp, continueAsGuest } = useAuth();

  useEffect(() => {
    if (open) {
      setMode(initialMode === "signin" ? "signin" : "signup");
      setError(""); setInfo(""); setPassword("");
    }
  }, [open, initialMode]);

  /* ── prevent body scroll when open ── */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const reset = () => { setError(""); setInfo(""); };

  async function handleSubmit() {
    if (!email)    { setError("Enter your email."); return; }
    if (!password) { setError("Fill in both fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    reset(); setLoading(true);
    try {
      if (mode === "signin")  await signIn(email, password);
      if (mode === "signup")  await signUp(email, password);
      onClose();
    } catch (e: any) {
      setError(
        e.code === "auth/user-not-found"       ? "No account found with that email." :
        e.code === "auth/wrong-password"        ? "Wrong password." :
        e.code === "auth/invalid-credential"    ? "Wrong email or password." :
        e.code === "auth/email-already-in-use"  ? "Email already in use — sign in instead." :
        e.code === "auth/invalid-email"         ? "Invalid email address." :
        e.message || "Something went wrong."
      );
    }
    setLoading(false);
  }

  async function handleForgot() {
    if (!email) { setError("Enter your email first."); return; }
    reset(); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Reset link sent! Check your inbox.");
    } catch (e: any) {
      setError(e.code === "auth/user-not-found" ? "No account found with that email." : "Failed to send. Try again.");
    }
    setLoading(false);
  }

  function handleGuest() { continueAsGuest(); onClose(); }

  /* ── TITLES per mode ── */
  const TITLES: Record<string, { h: string; sub: string }> = {
    signup: { h: "Create your account",       sub: "Free forever · No credit card needed" },
    signin: { h: "Welcome back",              sub: "Sign in to continue studying" },
    forgot: { h: "Reset your password",       sub: "We'll send a reset link to your email" },
  };

  return (
    <>
      <style>{`
        @keyframes auth-spin   { to { transform: rotate(360deg); } }
        @keyframes auth-in     { from { opacity:0; transform:scale(0.96) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes auth-fade   { from { opacity:0; } to { opacity:1; } }
        .auth-link { background:none; border:none; cursor:pointer; font-family:var(--font-body); font-size:13px; transition:color 0.15s; }
        .auth-link:hover { text-decoration: underline; }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        onClick={(e) => { if (open && e.target === e.currentTarget) onClose(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: open ? "rgba(4,6,12,0.85)" : "transparent",
          backdropFilter: open ? "blur(14px)" : "none",
          WebkitBackdropFilter: open ? "blur(14px)" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
          transition: "background 0.2s ease, backdrop-filter 0.2s ease",
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
        }}
      >
        {/* ── Modal card ── */}
        <div style={{
          background: "rgba(10,13,22,0.96)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 22,
          padding: "30px 26px",
          width: "100%", maxWidth: 390,
          position: "relative",
          maxHeight: "92vh", overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 60px rgba(99,102,241,0.06)",
          animation: open ? "auth-in 0.25s cubic-bezier(0.4,0,0.2,1) forwards" : "none",
        }}>
          {/* Subtle top glow line */}
          <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg,transparent,rgba(129,140,248,0.4),transparent)", borderRadius: 1 }} />

          {/* ── Close button ── */}
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
          >×</button>

          <Logo />

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", color: "#f1f5f9", margin: "0 0 5px", letterSpacing: "-0.02em" }}>
              {TITLES[mode].h}
            </h2>
            <p style={{ fontSize: 12.5, color: "#475569", margin: 0 }}>{TITLES[mode].sub}</p>
          </div>

          {/* ══════════════ SIGN UP ══════════════ */}
          {mode === "signup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {/* Benefits badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 10 }}>
                <span style={{ fontSize: 14 }}>🎓</span>
                <span style={{ fontSize: 12, color: "#6ee7b7" }}>4 CBTs/day · PQ analytics · Math rendering</span>
              </div>

              <Input type="email"    placeholder="Email address"              value={email}    onChange={setEmail} />
              <Input type="password" placeholder="Create a password (min 6)" value={password} onChange={setPassword} />

              {error && <ErrorMsg msg={error} />}

              <PrimaryBtn onClick={handleSubmit} loading={loading}>
                {loading ? "Creating account…" : "Create Account →"}
              </PrimaryBtn>

              <Divider />

              <button onClick={handleGuest} style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.14)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.08)"; }}>
                Continue as Guest <span style={{ fontSize: 11, color: "#6366f1", marginLeft: 4 }}>(2 CBTs/day)</span>
              </button>

              <p style={{ textAlign: "center", fontSize: 12.5, color: "#334155", margin: 0 }}>
                Already have an account?{" "}
                <button className="auth-link" onClick={() => { setMode("signin"); reset(); }} style={{ color: "#818cf8" }}>Sign in</button>
              </p>
            </div>
          )}

          {/* ══════════════ SIGN IN ══════════════ */}
          {mode === "signin" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <Input type="email"    placeholder="Email address" value={email}    onChange={setEmail} />
              <Input type="password" placeholder="Password"      value={password} onChange={setPassword} />

              {error && <ErrorMsg msg={error} />}

              <PrimaryBtn onClick={handleSubmit} loading={loading}>
                {loading ? "Signing in…" : "Sign In →"}
              </PrimaryBtn>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <button className="auth-link" onClick={() => { setMode("forgot"); reset(); }} style={{ color: "#475569" }}>Forgot password?</button>
                <button className="auth-link" onClick={() => { setMode("signup"); reset(); }} style={{ color: "#818cf8" }}>Create account</button>
              </div>

              <Divider />

              <button onClick={handleGuest} style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.14)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.08)"; }}>
                Continue as Guest <span style={{ fontSize: 11, color: "#6366f1", marginLeft: 4 }}>(2 CBTs/day)</span>
              </button>
            </div>
          )}

          {/* ══════════════ FORGOT ══════════════ */}
          {mode === "forgot" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <Input type="email" placeholder="Email address" value={email} onChange={setEmail} />

              {error && <ErrorMsg msg={error} />}
              {info  && <InfoMsg  msg={info}  />}

              <PrimaryBtn onClick={handleForgot} loading={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </PrimaryBtn>

              <button className="auth-link" onClick={() => { setMode("signin"); reset(); }} style={{ color: "#475569", textAlign: "center", marginTop: 2 }}>
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* ── Footer note ── */}
          <p style={{ textAlign: "center", fontSize: 11, color: "#1e293b", marginTop: 20, marginBottom: 0 }}>
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </>
  );
}
