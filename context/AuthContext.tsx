"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User, onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isPremium: boolean;
  isApprovedAmbassador: boolean;
  userId: string;
  loading: boolean;
  signIn:  (email: string, pass: string) => Promise<void>;
  signUp:  (email: string, pass: string, referralCode?: string) => Promise<void>;
  logout:  () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function generateReferralCode(uid: string): string {
  return "STU-" + uid.slice(0, 6).toUpperCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                         = useState<User | null>(null);
  const [isGuest, setIsGuest]                   = useState(false);
  const [isPremium, setIsPremium]               = useState(false);
  const [isApprovedAmbassador, setIsApprovedAmbassador] = useState(false);
  const [guestId, setGuestId]                   = useState("");
  const [loading, setLoading]                   = useState(true);

  /* ── fingerprint / guest ID ── */
  useEffect(() => {
    async function initGuestId() {
      try {
        const { getTrackedGuestId } = await import("@/lib/fingerprint");
        const id = await getTrackedGuestId();
        setGuestId(id);
      } catch {
        let id = localStorage.getItem("studiengine_guest_id");
        if (!id) {
          id = "guest_" + Math.random().toString(36).slice(2);
          localStorage.setItem("studiengine_guest_id", id);
        }
        setGuestId(id);
      }
    }
    initGuestId();
  }, []);

  /* ── auth state listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsGuest(false);
        try {
          const ref  = doc(db, "usage", u.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              quizCount:    0,
              scanCount:    0,
              lastReset:    new Date().toISOString().split("T")[0],
              isPremium:    false,
              email:        u.email || "",
              referralCode: generateReferralCode(u.uid),
              referredBy:   null,
              createdAt:    new Date().toISOString(),
            });
            setIsPremium(false);
          } else {
            const data = snap.data();
            setIsPremium(data?.isPremium === true);
            const updates: Record<string, any> = {};
            if (!data?.email && u.email)     updates.email        = u.email;
            if (!data?.referralCode)         updates.referralCode = generateReferralCode(u.uid);
            if (Object.keys(updates).length) await setDoc(ref, updates, { merge: true });
          }

          /* ── check ambassador status ── */
          try {
            const ambSnap = await getDoc(doc(db, "ambassadors", u.uid));
            setIsApprovedAmbassador(ambSnap.exists() && ambSnap.data()?.approved === true);
          } catch {
            setIsApprovedAmbassador(false);
          }

        } catch { setIsPremium(false); setIsApprovedAmbassador(false); }
      } else {
        setIsApprovedAmbassador(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const userId = user ? user.uid : (isGuest ? guestId : "");

  async function signIn(email: string, pass: string) {
    await signInWithEmailAndPassword(auth, email, pass);
    setIsGuest(false);
  }

  async function signUp(email: string, pass: string, referralCode?: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid  = cred.user.uid;

    let referredBy: string | null   = null;
    let referrerUid: string | null  = null;

    if (referralCode) {
      try {
        const q    = query(collection(db, "usage"), where("referralCode", "==", referralCode.trim().toUpperCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          referrerUid = snap.docs[0].id;
          referredBy  = referralCode.trim().toUpperCase();
        }
      } catch {}
    }

    await setDoc(doc(db, "usage", uid), {
      quizCount:    0,
      scanCount:    0,
      lastReset:    new Date().toISOString().split("T")[0],
      isPremium:    false,
      email,
      referralCode: generateReferralCode(uid),
      referredBy:   referredBy,
      createdAt:    new Date().toISOString(),
    });

    if (referrerUid && referredBy) {
      try {
        await setDoc(doc(db, "referrals", uid), {
          newUserUid:   uid,
          newUserEmail: email,
          referrerUid,
          referralCode: referredBy,
          verified:     false,
          createdAt:    new Date().toISOString(),
        });
      } catch {}
    }

    setIsGuest(false);
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setIsGuest(false);
    setIsPremium(false);
    setIsApprovedAmbassador(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("studiengine_onboarded_v2");
      localStorage.removeItem("studiengine_guest_id");
    }
  }

  function continueAsGuest() {
    setUser(null);
    setIsGuest(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("studiengine_onboarded_v2", "1");
      if (!localStorage.getItem("studiengine_guest_id") && guestId) {
        localStorage.setItem("studiengine_guest_id", guestId);
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, isPremium, isApprovedAmbassador, userId, loading, signIn, signUp, logout, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

