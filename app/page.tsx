"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url    = new URL(window.location.href);
    const params = url.searchParams.toString();

    const returning =
      localStorage.getItem("studiengine_onboarded_v2") ||
      localStorage.getItem("studiengine_guest_id")     ||
      localStorage.getItem("studiengine_theme");

    if (returning) {
      // returning user — go straight to app, preserve any params
      router.replace(params ? `/app?${params}` : "/app");
    } else {
      // new visitor — go to landing, preserve any params
      router.replace(params ? `/landing?${params}` : "/landing");
    }
  }, [router]);

  return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:20, height:20, border:"2px solid rgba(255,255,255,0.1)", borderTopColor:"#818cf8", borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
