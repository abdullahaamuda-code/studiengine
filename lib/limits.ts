import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface UsageDoc {
  quizCount: number;
  scanCount: number;
  lastReset: string;
  isPremium: boolean;
}

export const LIMITS = {
  guest:   { quiz: 2, scan: 2, maxQuestions: 15, maxPages: 10 },
  free:    { quiz: 4, scan: 2, maxQuestions: 15, maxPages: 20 },
  premium: { quiz: Infinity, scan: Infinity, maxQuestions: 30, maxPages: 50 },
};

function today() { return new Date().toISOString().split("T")[0]; }

export async function getUsage(userId: string): Promise<UsageDoc> {
  const ref = doc(db, "usage", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const fresh: UsageDoc = { quizCount: 0, scanCount: 0, lastReset: today(), isPremium: false };
    await setDoc(ref, fresh);
    return fresh;
  }
  const data = snap.data() as UsageDoc;
  if (data.lastReset !== today()) {
    const reset: Partial<UsageDoc> = { quizCount: 0, scanCount: 0, lastReset: today() };
    await updateDoc(ref, reset);
    return { ...data, ...reset };
  }
  return data;
}

export async function incrementQuiz(userId: string) {
  const ref = doc(db, "usage", userId);
  const usage = await getUsage(userId);
  await updateDoc(ref, { quizCount: usage.quizCount + 1 });
}

export async function incrementScan(userId: string) {
  const ref = doc(db, "usage", userId);
  const usage = await getUsage(userId);
  await updateDoc(ref, { scanCount: usage.scanCount + 1 });
}

export function getLimitsForUser(isPremium: boolean, isGuest: boolean) {
  if (isPremium) return LIMITS.premium;
  if (isGuest) return LIMITS.guest;
  return LIMITS.free;
}

export function canGenerateQuiz(usage: UsageDoc, isGuest: boolean): boolean {
  if (usage.isPremium) return true;
  const limit = isGuest ? LIMITS.guest.quiz : LIMITS.free.quiz;
  return usage.quizCount < limit;
}

export function canScanPDF(usage: UsageDoc, isGuest: boolean): boolean {
  if (usage.isPremium) return true;
  const limit = isGuest ? LIMITS.guest.scan : LIMITS.free.scan;
  return usage.scanCount < limit;
}

export function getGuestId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("studiengine_guest_id");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("studiengine_guest_id", id);
  }
  return id;
}