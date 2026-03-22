"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isPremium: boolean;
  userId: string;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [guestId, setGuestId] = useState("");
  const [loading, setLoading] = useState(true);

  // Init fingerprint-based guest ID on mount
  useEffect(() => {
    async function initGuestId() {
      try {
        const { getTrackedGuestId } = await import("@/lib/fingerprint");
        const id = await getTrackedGuestId();
        setGuestId(id);
      } catch {
        // Fallback to simple random ID
        let id = localStorage.getItem("studiengine_guest_id");
        if (!id) { id = "guest_" + Math.random().toString(36).slice(2); localStorage.setItem("studiengine_guest_id", id); }
        setGuestId(id);
      }
    }
    initGuestId();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsGuest(false);
        try {
          const snap = await getDoc(doc(db, "usage", u.uid));
          setIsPremium(snap.data()?.isPremium === true);
        } catch { setIsPremium(false); }
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

  async function signUp(email: string, pass: string) {
    await createUserWithEmailAndPassword(auth, email, pass);
    setIsGuest(false);
  }

  async function logout() {
    await signOut(auth);
    setIsGuest(false);
    setIsPremium(false);
  }

  function continueAsGuest() { setIsGuest(true); }

  return (
    <AuthContext.Provider value={{ user, isGuest, isPremium, userId, loading, signIn, signUp, logout, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
