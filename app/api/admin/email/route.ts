import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Resend } from "resend";

function checkAuth(req: NextRequest) {
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  return !adminUid || req.headers.get("x-admin-uid") === adminUid;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const { subject, body, recipients, specificEmail } = await req.json();
    let emailList: { email: string }[] = [];

    if (recipients === "specific" && specificEmail) {
      emailList = [{ email: specificEmail }];
    } else {
      const snap = await getDocs(collection(db, "usage"));
      snap.docs.forEach((d) => {
        const data = d.data() as any;
        if (!d.id.startsWith("guest_") && data.email) {
          if (
            recipients === "all" ||
            (recipients === "premium" && data.isPremium) ||
            (recipients === "free" && !data.isPremium)
          ) {
            emailList.push({ email: data.email });
          }
        }
      });
    }

    if (emailList.length === 0) {
      return NextResponse.json(
        { error: "No recipients found." },
        { status: 400 }
      );
    }

    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#1e3a8a,#0891b2);padding:20px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0">Studiengine</h1>
      </div>
      <div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px">
        ${body.replace(/\n/g, "<br>")}
        <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:12px;text-align:center">
          AI-powered CBT exam prep for Nigerian students
        </p>
      </div>
    </div>`;

    const batch = emailList.slice(0, 100).map((r) => r.email);

    const { error } = await resend.emails.send({
      from: "Studiengine <technologywiz10@gmail.com>",
      to: batch,
      subject,
      html,
    }); [web:397][web:401]

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, sent: batch.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
