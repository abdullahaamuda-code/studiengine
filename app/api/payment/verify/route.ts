export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body      = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";
    const secret    = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      console.error("Webhook: PAYSTACK_SECRET_KEY not set");
      return NextResponse.json({ error: "Missing secret key" }, { status: 500 });
    }

    /* ── verify signature ── */
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
    if (hash !== signature) {
      console.warn("Webhook: signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Paystack webhook received:", event.event);

    if (event.event === "charge.success") {
      const { metadata, amount, reference, customer } = event.data;
      const uid  = metadata?.userId;
      const plan = metadata?.plan;

      if (!uid) {
        console.warn("Webhook: no userId in metadata", metadata);
        return NextResponse.json({ received: true });
      }

      const now = new Date();
      let expiresAt: Date;
      if      (plan === "annual")    { expiresAt = new Date(new Date().setFullYear(now.getFullYear() + 1)); }
      else if (plan === "quarterly") { expiresAt = new Date(new Date().setMonth(now.getMonth() + 3));       }
      else                           { expiresAt = new Date(new Date().setMonth(now.getMonth() + 1));       }

      const db = getAdminDb();
      await db.collection("usage").doc(uid).set(
        {
          isPremium:      true,
          premiumPlan:    plan || "monthly",
          premiumExpiry:  expiresAt,
          lastPaymentAt:  now,
          lastPaymentAmt: amount,
          lastPaymentRef: reference,
          lastPaymentEmail: customer?.email || null,
        },
        { merge: true }
      );

      console.log(`✅ Premium activated — uid:${uid} | plan:${plan} | expires:${expiresAt.toISOString()}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error("Webhook error:", err.message || err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
