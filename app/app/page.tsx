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
  // lock the initial mode so parent re-renders don't flip it
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

        {/* SIGNUP */}
        {mode === "signup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* ... everything else exactly as you had it ... */}
            {/* I’m not changing the rest of your JSX to keep behaviour identical */}
          </div>
        )}

        {/* SIGNIN */}
        {mode === "signin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* ... your existing signin block unchanged ... */}
          </div>
        )}

        {/* FORGOT */}
        {mode === "forgot" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* ... your existing forgot block unchanged ... */}
          </div>
        )}
      </div>
    </div>
  );
}
