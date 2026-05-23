// components/AppStorageReset.tsx
"use client";

import { useEffect } from "react";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

export default function AppStorageReset() {
  useEffect(() => {
    try {
      const savedVersion = localStorage.getItem("appVersion");

      // If same version, do nothing
      if (savedVersion === APP_VERSION) return;

      // Hard reset: clear all localStorage for this origin
      localStorage.clear(); // wipes all keys for your site on this browser[web:21][web:53]

      // Store new version so it only happens once per browser per version
      localStorage.setItem("appVersion", APP_VERSION);
    } catch (e) {
      console.error("AppStorageReset failed", e);
    }
  }, []);

  return null;
}
