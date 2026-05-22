"use client";

import { useEffect } from "react";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

const KEYS_TO_REMOVE = [
  "quizState",
  "draftAnswers",
  "attemptCache",
  "selectedTopic",
  "appVersion",
];

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

      if (savedVersion !== APP_VERSION) {
        for (const key of KEYS_TO_REMOVE) {
          localStorage.removeItem(key);
        }

        for (const key of AUTH_KEYS) {
          if (localStorage.getItem(key)) {
            // keep auth keys
          }
        }

        localStorage.setItem("appVersion", APP_VERSION);
      }
    } catch {}
  }, []);

  return null;
}
