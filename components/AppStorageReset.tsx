"use client";

import { useEffect } from "react";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

export default function AppStorageReset() {
  useEffect(() => {
    try {
      const savedVersion = localStorage.getItem("appVersion");

      // If same version, do nothing
      if (savedVersion === APP_VERSION) return;

      // Hard reset: clear all data for this origin
      localStorage.clear(); // nukes everything for this site[web:21][web:22][web:25]

      // Store new version so this only happens once per browser
      localStorage.setItem("appVersion", APP_VERSION);
    } catch (e) {
      // On Safari with cookies/localStorage blocked, this can throw
      console.error("AppStorageReset failed", e);
    }
  }, []);

  return null;
}
