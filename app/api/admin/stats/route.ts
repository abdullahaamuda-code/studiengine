import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET(req: NextRequest) {
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  if (adminUid && req.headers.get("x-admin-uid") !== adminUid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const usageSnap = await getDocs(collection(db, "usage"));
    const users = usageSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    const totalUsers = users.length;
    const guestUsers = users.filter(u => u.id.startsWith("guest_")).length;
    const registeredUsers = totalUsers - guestUsers;
    const premiumUsers = users.filter(u => u.isPremium).length;
    const totalCBTs = users.reduce((s, u) => s + (u.allTimeQuizCount || 0), 0);
    const todayCBTs = users.reduce((s, u) => s + (u.quizCount || 0), 0);
    const feedbackSnap = await getDocs(collection(db, "feedback"));
    return NextResponse.json({ totalUsers, guestUsers, registeredUsers, premiumUsers, totalCBTs, todayCBTs, totalFeedback: feedbackSnap.size });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
