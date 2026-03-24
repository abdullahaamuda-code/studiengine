"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const params = url.searchParams.toString();

    const returning =
      localStorage.getItem("studiengine_onboarded_v2") ||
      localStorage.getItem("studiengine_guest_id") ||
      localStorage.getItem("studiengine_theme");

    if (returning) {
      // /?mode=signup -> /app?mode=signup
      router.replace(params ? `/app?${params}` : "/app");
    } else {
      // /?mode=signup -> /landing?mode=signup
      router.replace(params ? `/landing?${params}` : "/landing");
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#03080f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          border: "2px solid rgba(255,255,255,0.1)",
          borderTopColor: "#60a5fa",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
