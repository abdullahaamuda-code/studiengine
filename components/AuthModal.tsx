"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface Props {
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

function Logo() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 24,
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: 9, display: "block" }}
      >
        <defs>
          <linearGradient id="ab" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a1628" />
            <stop offset="100%" stopColor="#0c1a2e" />
          </linearGradient>
          <linearGradient id="as" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect width="80" height="80" rx="16" fill="url(#ab)" />
        <rect
          x="30"
          y="12"
          width="34"
          height="8"
          rx="4"
          fill="#1e3a5f"
          opacity="0.8"
        />
        <rect
          x="14"
          y="24"
          width="50"
          height="8"
          rx="4"
          fill="#1e3a5f"
          opacity="0.7"
        />
        <rect
          x="14"
          y="36"
          width="52"
          height="8"
          rx="4"
          fill="#1e3a5f"
          opacity="0.6"
        />
        <rect
          x="14"
          y="48"
          width="50"
          height="8"
          rx="4"
          fill="#1e3a5f"
          opacity="0.5"
        />
        <rect
          x="14"
          y="60"
          width="34"
          height="8"
          rx="4"
          fill="#1e3a5f"
          opacity="0.4"
        />
        <path
          d="M52 20 C52 20 52 13 40 13 C28 13 24 20 24 27 C24 34 30 37 40 40 C50 43 56 46 56 53 C56 60 52 67 40 67 C28 67 24 60 24 60"
          fill="none"
          stroke="url(#as)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          fontSize: 20,
          fontWeight: 800,
          fontFamily: "var(--font-display)",
          background: "linear-gradient(135deg,#60a5fa,#22d3ee)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Studiengine
      </span>
    </div>
  );
}

export default function AuthModal({
  onClose,
  initialMode = "signup",
}: Props) {
  // FIX: lock the initial mode so parent prop changes don’t reset component
  const initialRef = useRef<"signin" | "signup">(initialMode);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(
    initialRef.current
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, continueAsGuest } = useAuth();

  async function handleSubmit() {
    if (!email) {
      setError("Enter your email.");
      return;
    }
    if (mode !== "forgot") {
      if (!password) {
        setError("Fill in both fields.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else if (mode === "signup") {
        await signUp(email, password);
      }
      onClose();
    } catch (e: any) {
      setError(
        e.code === "auth/user-not-found"
          ? "No account found with that email."
          : e.code === "auth/wrong-password"
          ? "Wrong password."
          : e.code === "auth/invalid-credential"
          ? "Wrong email or password."
          : e.code === "auth/email-already-in-use"
          ? "Email already in use. Sign in instead."
          : e.code === "auth/invalid-email"
          ? "Invalid email address."
          : e.message || "Something went wrong."
      );
    }
    setLoading(false);
  }

  async function handleForgot() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Reset link sent! Check your email.");
    } catch (e: any) {
      setError(
        e.code === "auth/user-not-found"
          ? "No account found with that email."
          : "Failed to send. Try again."
      );
    }
    setLoading(false);
  }

  function handleGuest() {
    continueAsGuest();
    onClose();
  }

  const Input = ({
    type,
    placeholder,
    value,
    onChange,
  }: {
    type: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      onKeyDown={(e: any) =>
        e.key === "Enter" &&
        (mode === "forgot" ? handleForgot() : handleSubmit())
      }
      style={{
        width: "100%",
        background: "rgba(8,20,40,0.8)",
        border: "1px solid rgba(56,139,253,0.15)",
        borderRadius: 10,
        color: "#e2e8f0",
        padding: "11px 14px",
        fontSize: 14,
        outline: "none",
        fontFamily: "var(--font-body)",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
    />
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(2,8,23,0.88)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "rgba(6,14,30,0.97)",
          border: "1px solid rgba(56,139,253,0.18)",
          borderRadius: 20,
          padding: "28px 24px",
          width: "100%",
          maxWidth: 400,
          position: "relative",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#475569",
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        <Logo />

        {mode === "signup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "#e8f0fe",
                  margin: "0 0 6px",
                }}
              >
                Create your account
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#475569",
                  margin: 0,
                }}
              >
                Free forever · No credit card needed
              </p>
            </div>
            <div
              style={{
                padding: "8px 12px",
                background: "rgba(5,150,105,0.08)",
                border: "1px solid rgba(16,185,129,0.15)",
                borderRadius: 8,
                fontSize: 12,
                color: "#4ade80",
              }}
            >
              ✓ 4 CBTs/day · Past question analysis · Math rendering
            </div>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
            />
            <Input
              type="password"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={setPassword}
            />
            {error && (
              <p
                style={{
                  fontSize: 12,
                  color: "#f87171",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: "12px 0",
                borderRadius: 10,
                background: loading
                  ? "rgba(37,99,235,0.4)"
                  : "linear-gradient(135deg,#2563eb,#0891b2)",
                border: "none",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-body)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Creating account...
                </>
              ) : (
                "Create Account →"
              )}
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "#334155",
                }}
              >
                or
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>
            <button
              onClick={handleGuest}
              style={{
                padding: "11px 0",
                borderRadius: 10,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(139,92,246,0.25)",
                color: "#a78bfa",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
              }}
            >
              Continue as Guest{" "}
              <span
                style={{
                  fontSize: 11,
                  color: "#6d28d9",
                  marginLeft: 4,
                }}
              >
                (2 CBTs/day)
              </span>
            </button>
            <p
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "#334155",
                margin: 0,
              }}
            >
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#60a5fa",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "var(--font-body)",
                }}
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        {mode === "signin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "#e8f0fe",
                  margin: "0 0 6px",
                }}
              >
                Welcome back
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#475569",
                  margin: 0,
                }}
              >
                Sign in to continue studying
              </p>
            </div>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
            />
            {error && (
              <p
                style={{
                  fontSize: 12,
                  color: "#f87171",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: "12px 0",
                borderRadius: 10,
                background: loading
                  ? "rgba(37,99,235,0.4)"
                  : "linear-gradient(135deg,#2563eb,#0891b2)",
                border: "none",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-body)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Signing in...
                </>
              ) : (
                "Sign In →"
              )}
            </button>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setInfo("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#475569",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                Forgot password?
              </button>
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setInfo("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#60a5fa",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                Create account
              </button>
            </div>
          </div>
        )}

        {mode === "forgot" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "#e8f0fe",
                  margin: "0 0 6px",
                }}
              >
                Reset password
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#475569",
                  margin: 0,
                }}
              >
                We'll send a reset link to your email
              </p>
            </div>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
            />
            {error && (
              <p
                style={{
                  fontSize: 12,
                  color: "#f87171",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
            {info && (
              <p
                style={{
                  fontSize: 12,
                  color: "#4ade80",
                  background: "rgba(5,150,105,0.08)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  margin: 0,
                }}
              >
                {info}
              </p>
            )}
            <button
              onClick={handleForgot}
              disabled={loading}
              style={{
                padding: "12px 0",
                borderRadius: 10,
                background: "linear-gradient(135deg,#2563eb,#0891b2)",
                border: "none",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              onClick={() => {
                setMode("signin");
                setError("");
                setInfo("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#475569",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
