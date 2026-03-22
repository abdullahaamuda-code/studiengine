import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  const authHeader = req.headers.get("x-admin-uid");
  if (adminUid && authHeader !== adminUid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all usage docs
    const usageSnap = await db.collection("usage").get();
    const users = usageSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    const totalUsers = users.length;
    const guestUsers = users.filter(u => u.id.startsWith("guest_")).length;
    const registeredUsers = totalUsers - guestUsers;
    const premiumUsers = users.filter(u => u.isPremium).length;
    const totalCBTs = users.reduce((sum, u) => sum + (u.allTimeQuizCount || 0), 0);
    const todayCBTs = users.reduce((sum, u) => sum + (u.quizCount || 0), 0);

    // Get feedback count
    const feedbackSnap = await db.collection("feedback").get();
    const totalFeedback = feedbackSnap.size;

    return NextResponse.json({
      totalUsers, guestUsers, registeredUsers, premiumUsers,
      totalCBTs, todayCBTs, totalFeedback,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
