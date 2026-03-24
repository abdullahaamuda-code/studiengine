"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    // Returning user check — if they've been here before, skip landing
    const returning = localStorage.getItem("studiengine_onboarded_v2") ||
                      localStorage.getItem("studiengine_guest_id") ||
                      localStorage.getItem("studiengine_theme");
    if (returning) {
      router.replace("/app");
    } else {
      router.replace("/landing");
    }
  }, []);

  // Show nothing while redirecting
  return (
    <div style={{ minHeight: "100vh", background: "#03080f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#60a5fa", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
