import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

function checkAuth(req: NextRequest) {
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  const authHeader = req.headers.get("x-admin-uid");
  return !adminUid || authHeader === adminUid;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const snap = await db.collection("usage").orderBy("lastReset", "desc").limit(100).get();
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

    if (action === "set_premium") {
      await db.collection("usage").doc(userId).set({ isPremium: value }, { merge: true });
      return NextResponse.json({ success: true });
    }

    if (action === "reset_limits") {
      const today = new Date().toISOString().split("T")[0];
      await db.collection("usage").doc(userId).set(
        { quizCount: 0, scanCount: 0, lastReset: today },
        { merge: true }
      );
      return NextResponse.json({ success: true });
    }

    if (action === "reset_all_limits") {
      const snap = await db.collection("usage").get();
      const today = new Date().toISOString().split("T")[0];
      const batch = db.batch();
      snap.docs.forEach(d => {
        batch.update(d.ref, { quizCount: 0, scanCount: 0, lastReset: today });
      });
      await batch.commit();
      return NextResponse.json({ success: true, count: snap.size });
    }

    if (action === "delete_user") {
      await db.collection("usage").doc(userId).delete();
      // Also delete history subcollection
      const histSnap = await db.collection("users").doc(userId).collection("history").get();
      const batch = db.batch();
      histSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
