"use client";

import { useEffect } from "react";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

// Keys we want to keep
const AUTH_KEYS = [
  "token",
  "accessToken",
  "refreshToken",
  "auth",
  "user",
  "session",
];

export default function AppStorageReset() {
  useEffect(() => {
    try {
      const savedVersion = localStorage.getItem("appVersion");
      if (savedVersion === APP_VERSION) return;

      // 1) Snapshot auth values
      const authSnapshot: Record<string, string> = {};
      for (const key of AUTH_KEYS) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          authSnapshot[key] = value;
        }
      }

      // 2) Clear EVERYTHING for this origin
      localStorage.clear(); // wipes all keys for this domain[web:21][web:22][web:25]

      // 3) Restore auth values
      for (const [key, value] of Object.entries(authSnapshot)) {
        localStorage.setItem(key, value);
      }

      // 4) Set new app version
      localStorage.setItem("appVersion", APP_VERSION);
    } catch (e) {
      console.error("AppStorageReset failed", e);
    }
  }, []);

  return null;
}
