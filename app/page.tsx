"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Root() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();

    const returning =
      typeof window !== "undefined" &&
      (localStorage.getItem("studiengine_onboarded_v2") ||
        localStorage.getItem("studiengine_guest_id") ||
        localStorage.getItem("studiengine_theme"));

    if (returning) {
      // e.g. /?mode=signup -> /app?mode=signup
      router.replace(params ? `/app?${params}` : "/app");
    } else {
      // e.g. /?mode=signup -> /landing?mode=signup
      router.replace(params ? `/landing?${params}` : "/landing");
    }
  }, [router, searchParams]);

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
