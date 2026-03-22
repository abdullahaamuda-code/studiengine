import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

function checkAuth(req: NextRequest) {
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  return !adminUid || req.headers.get("x-admin-uid") === adminUid;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const snap = await db.collection("feedback").orderBy("createdAt", "desc").limit(50).get();
    const feedback = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ feedback });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await req.json();
    await db.collection("feedback").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
