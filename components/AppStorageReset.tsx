"use client";
import { useEffect } from "react";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

// Keys to clear on version bump — does NOT include auth/theme keys
// so users stay logged in and keep their theme preference
const KEYS_TO_CLEAR = [
  "studiengine_onboarded_v2",   // onboarding modal
  "studiengine_install_dismissed_at", // install prompt
  "studiengine_admin_ai_chat",  // admin AI chat history
  "quizState",
  "draftAnswers",
  "attemptCache",
  "selectedTopic",
];

// Never touch these — user stays logged in
const PRESERVE_KEYS = [
  "studiengine_guest_id",
  "studiengine_theme",
  "studiengine_installed",
  "appVersion",
];

export default function AppStorageReset() {
  useEffect(() => {
    try {
      const savedVersion = localStorage.getItem("appVersion");
      if (savedVersion === APP_VERSION) return; // already up to date

      // Clear only the non-auth keys
      for (const key of KEYS_TO_CLEAR) {
        localStorage.removeItem(key);
      }

      // Save new version
      localStorage.setItem("appVersion", APP_VERSION);

    } catch {}
  }, []);

  return null;
}
