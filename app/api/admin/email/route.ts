import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

function checkAuth(req: NextRequest) {
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  return !adminUid || req.headers.get("x-admin-uid") === adminUid;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) return NextResponse.json({ error: "BREVO_API_KEY not configured" }, { status: 500 });

  try {
    const { subject, body, recipients, specificEmail } = await req.json();

    let emailList: { email: string; name?: string }[] = [];

    if (recipients === "specific" && specificEmail) {
      emailList = [{ email: specificEmail }];
    } else {
      // Get registered users from usage collection
      const snap = await db.collection("usage").get();
      snap.docs.forEach(d => {
        const data = d.data();
        // Only registered users have email-like IDs (Firebase UIDs are alphanumeric)
        // We stored email separately if needed — for now skip guests
        if (!d.id.startsWith("guest_") && data.email) {
          if (recipients === "all" || 
              (recipients === "premium" && data.isPremium) ||
              (recipients === "free" && !data.isPremium)) {
            emailList.push({ email: data.email });
          }
        }
      });
    }

    if (emailList.length === 0) {
      return NextResponse.json({ error: "No recipients found. Note: user emails need to be stored in Firestore." }, { status: 400 });
    }

    // Send via Brevo
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoKey,
      },
      body: JSON.stringify({
        sender: { name: "Studiengine", email: "abdullahaamuda@gmail.com" },
        to: emailList.slice(0, 100), // Brevo limit per request
        subject,
        htmlContent: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:linear-gradient(135deg,#1e3a8a,#0891b2);padding:20px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px">Studiengine</h1>
          </div>
          <div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px">
            ${body.replace(/\n/g, "<br>")}
            <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
            <p style="color:#94a3b8;font-size:12px;text-align:center">AI-powered CBT exam prep for Nigerian students</p>
          </div>
        </div>`,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: (err as any)?.message || "Brevo error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, sent: emailList.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
