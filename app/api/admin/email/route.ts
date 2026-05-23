import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

function checkAuth(req: NextRequest) {
  const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  return !adminUid || req.headers.get("x-admin-uid") === adminUid;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) return NextResponse.json({ error:"BREVO_API_KEY not configured" }, { status:500 });

  try {
    const { subject, body, recipients, specificEmail, selectedEmails } = await req.json();
    let emailList: { email:string }[] = [];

    if (recipients === "specific" && specificEmail) {
      emailList = [{ email: specificEmail }];
    } else if (recipients === "select" && selectedEmails?.length) {
      emailList = selectedEmails.map((e:string) => ({ email:e }));
    } else {
      const snap = await getDocs(collection(db,"usage"));
      snap.docs.forEach(d => {
        const data = d.data() as any;
        if (!d.id.startsWith("guest_") && data.email) {
          if (
            recipients === "all" ||
            (recipients === "premium" && data.isPremium) ||
            (recipients === "free"    && !data.isPremium)
          ) {
            emailList.push({ email: data.email });
          }
        }
      });
    }

    if (emailList.length === 0) return NextResponse.json({ error:"No recipients found." }, { status:400 });

    const htmlContent = `
<div style="font-family:'Inter',sans-serif;max-width:580px;margin:0 auto;padding:20px;background:#f8fafc">
  <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:24px 28px;border-radius:14px 14px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em">Studiengine</h1>
    <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px">AI-powered CBT exam prep</p>
  </div>
  <div style="background:#ffffff;padding:28px;border-radius:0 0 14px 14px;border:1px solid #e2e8f0;border-top:none">
    ${body.replace(/\n/g,"<br>")}
    <hr style="margin:28px 0;border:none;border-top:1px solid #f1f5f9">
    <div style="text-align:center">
      <a href="https://www.studiengine.com.ng" style="display:inline-block;padding:10px 22px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:16px">Open Studiengine →</a>
    </div>
    <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0">
      You're receiving this because you signed up for Studiengine.<br>
      Reply to this email to get in touch with us.
    </p>
  </div>
</div>`;

    // Send in batches of 50 (Brevo free limit per call)
    const batches: { email:string }[][] = [];
    for (let i = 0; i < emailList.length; i += 50) batches.push(emailList.slice(i, i+50));

    let totalSent = 0;
    for (const batch of batches) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type":"application/json", "api-key":brevoKey },
        body: JSON.stringify({
          sender:   { name:"Studiengine", email:"hello@studiengine.com.ng" },
          replyTo:  { email:"hello@studiengine.com.ng", name:"Studiengine" },
          to:       batch,
          subject,
          htmlContent,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Brevo error:", err);
        // continue with other batches even if one fails
      } else {
        totalSent += batch.length;
      }
    }

    return NextResponse.json({ success:true, sent:totalSent });
  } catch (e:any) {
    return NextResponse.json({ error:e.message }, { status:500 });
  }
}
