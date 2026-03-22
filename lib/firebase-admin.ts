// Server-side Firebase Admin SDK
// Uses the client SDK in a server context for simplicity
// For production, swap to firebase-admin package with service account

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
  
  // Fallback: use application default credentials (works on Vercel with Firebase extension)
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export const adminApp = getAdminApp();
export const db = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
