"use client";
import { useEffect } from "react";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

// Only these keys survive a version bump
const PRESERVE_KEYS = new Set([
  "studiengine_guest_id",
  "studiengine_theme",
  "studiengine_installed",
  "appVersion",
  "token",
  "accessToken",
  "refreshToken",
  "auth",
  "user",
  "session",
]);

export default function AppStorageReset() {
  useEffect(() => {
    try {
      const savedVersion = localStorage.getItem("appVersion");

      // If same version, do nothing
      if (savedVersion === APP_VERSION) return;

      // Snapshot keys first so removing doesn't mess up indexing
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }

      // Remove everything except preserved keys
      for (const key of keys) {
        if (!PRESERVE_KEYS.has(key)) {
          localStorage.removeItem(key);
        }
      }

      // Store new version
      localStorage.setItem("appVersion", APP_VERSION);
    } catch (e) {
      console.error("AppStorageReset failed", e);
    }
  }, []);

  return null;
}
