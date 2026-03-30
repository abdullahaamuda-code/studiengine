"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface UsageDoc {
  quizCount: number;
  scanCount: number;
  lastReset: string;
  isPremium?: boolean;
  premiumExpiry?: any; // Firestore Timestamp
}

export function useUsage() {
  const { userId } = useAuth();
  const [usage, setUsage] = useState<UsageDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) {
        setUsage(null);
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db, "usage", userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUsage(snap.data() as UsageDoc);
        } else {
          setUsage(null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const now = new Date();
  const hasActivePremium =
    !!usage?.isPremium &&
    !!usage?.premiumExpiry &&
    usage.premiumExpiry.toDate() > now;

  return { usage, hasActivePremium, loading };
}
