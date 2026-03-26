"use client";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    if (open) {
      setMode(initialMode === "signin" ? "signin" : "signup");
      setPassword("");
    }
  }, [open, initialMode]);

  const visibilityStyle = open
    ? {}
    : { pointerEvents: "none" as const, opacity: 0, transform: "scale(0.98)" };

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
        }}
      >
        <button
          style={{ float: "right" }}
          onClick={onClose}
        >
          ×
        </button>

        <h2 style={{ color: "white", marginTop: 0 }}>
          {mode === "signup" ? "Signup" : mode === "signin" ? "Signin" : "Forgot"}
        </h2>

        {mode !== "forgot" && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
          </>
        )}

        {mode === "forgot" && (
          <input
            type="email"
            placeholder="Email for reset"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => setMode("signin")}>Signin</button>
          <button onClick={() => setMode("signup")}>Signup</button>
          <button onClick={() => setMode("forgot")}>Forgot</button>
        </div>
      </div>
    </div>
  );
}
