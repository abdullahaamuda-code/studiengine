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

export default function AuthModal({
  open,
  onClose,
  initialMode = "signup",
}: Props) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(
    initialMode === "signin" ? "signin" : "signup"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, continueAsGuest } = useAuth();

  useEffect(() => {
    if (open) {
      setMode(initialMode === "signin" ? "signin" : "signup");
      setPassword("");
      setError("");
      setInfo("");
    }
  }, [open, initialMode]);

  const visibilityStyle = open
    ? {}
    : { pointerEvents: "none" as const, opacity: 0, transform: "scale(0.98)" };

  async function handleSubmit() {
    if (!email) {
      setError("Enter your email.");
      return;
    }
    if (mode !== "forgot") {
      if (!password) {
        setError("Enter your password.");
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
        onClose();
      } else if (mode === "signup") {
        await signUp(email, password);
        onClose();
      }
    } catch (e: any) {
      setError(
        e.code === "auth/user-not-found"
          ? "No account with that email."
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
    setInfo("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Reset link sent! Check your email.");
    } catch (e: any) {
      setError(
        e.code === "auth/user-not-found"
          ? "No account with that email."
          : "Failed to send. Try again."
      );
    }

    setLoading(false);
  }

  function handleGuest() {
    continueAsGuest();
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: open ? "rgba(0,0,0,0.5)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        ...visibilityStyle,
      }}
      onClick={(e) => {
        if (open && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#020617",
          borderRadius: 16,
          padding: 20,
          width: "100%",
          maxWidth: 400,
          color: "white",
        }}
      >
        <button
          style={{ float: "right" }}
          onClick={onClose}
        >
          ×
        </button>

        <h2 style={{ marginTop: 0, marginBottom: 8 }}>
          {mode === "signup"
            ? "Create account"
            : mode === "signin"
            ? "Sign in"
            : "Reset password"}
        </h2>

        {mode !== "forgot" && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", marginBottom: 8, padding: 8 }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", marginBottom: 8, padding: 8 }}
            />
          </>
        )}

        {mode === "forgot" && (
          <input
            type="email"
            placeholder="Email for reset"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", marginBottom: 8, padding: 8 }}
          />
        )}

        {error && (
          <p
            style={{
              color: "#fca5a5",
              fontSize: 12,
              margin: "4px 0 0",
            }}
          >
            {error}
          </p>
        )}

        {info && (
          <p
            style={{
              color: "#4ade80",
              fontSize: 12,
              margin: "4px 0 0",
            }}
          >
            {info}
          </p>
        )}

        <button
          onClick={mode === "forgot" ? handleForgot : handleSubmit}
          disabled={loading}
          style={{
            marginTop: 12,
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "none",
            background: loading ? "#1e293b" : "#2563eb",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? mode === "forgot"
              ? "Sending..."
              : mode === "signin"
              ? "Signing in..."
              : "Creating..."
            : mode === "forgot"
            ? "Send reset link"
            : mode === "signin"
            ? "Sign in"
            : "Create account"}
        </button>

        <button
          onClick={handleGuest}
          style={{
            marginTop: 8,
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #475569",
            background: "transparent",
            color: "#e2e8f0",
            cursor: "pointer",
          }}
        >
          Continue as guest
        </button>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          {mode !== "forgot" && (
            <button
              onClick={() => {
                setMode("forgot");
                setError("");
                setInfo("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          )}

          {mode === "signin" && (
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
                cursor: "pointer",
                padding: 0,
              }}
            >
              Create account
            </button>
          )}

          {mode === "signup" && (
            <button
              onClick={() => {
                setMode("signin");
                setError("");
                setInfo("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#60a5fa",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Have an account? Sign in
            </button>
          )}

          {mode === "forgot" && (
            <button
              onClick={() => {
                setMode("signin");
                setError("");
                setInfo("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#60a5fa",
                cursor: "pointer",
                padding: 0,
                marginLeft: "auto",
              }}
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
