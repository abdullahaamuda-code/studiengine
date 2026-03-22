import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch, limit, query } from "firebase/firestore";

function checkAuth(req: NextRequest) {
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  return !adminUid || req.headers.get("x-admin-uid") === adminUid;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const snap = await getDocs(query(collection(db, "usage"), limit(100)));
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { action, userId, value } = await req.json();
    const today = new Date().toISOString().split("T")[0];

    if (action === "set_premium") {
      await setDoc(doc(db, "usage", userId), { isPremium: value }, { merge: true });
      return NextResponse.json({ success: true });
    }
    if (action === "reset_limits") {
      await updateDoc(doc(db, "usage", userId), { quizCount: 0, scanCount: 0, lastReset: today });
      return NextResponse.json({ success: true });
    }
    if (action === "reset_all_limits") {
      const snap = await getDocs(collection(db, "usage"));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.update(d.ref, { quizCount: 0, scanCount: 0, lastReset: today }));
      await batch.commit();
      return NextResponse.json({ success: true, count: snap.size });
    }
    if (action === "delete_user") {
      await deleteDoc(doc(db, "usage", userId));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
