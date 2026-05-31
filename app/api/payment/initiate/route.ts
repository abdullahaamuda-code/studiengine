import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, plan, userId } = await req.json();

    if (!email || !plan || !userId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const PLANS: Record<string, { amount: number; label: string }> = {
      monthly:   { amount: 60000,  label: "Studiengine Premium — Monthly"   },
      quarterly: { amount: 160000, label: "Studiengine Premium — Quarterly"  },
      annual:    { amount: 600000, label: "Studiengine Premium — Annual"     },
    };

    const selected = PLANS[plan];
    if (!selected) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: selected.amount,
        currency: "NGN",
        metadata: {
          userId,
          plan,
          custom_fields: [
            { display_name: "Plan",    variable_name: "plan",    value: plan    },
            { display_name: "User ID", variable_name: "user_id", value: userId  },
          ],
        },
        // ✅ FIXED: redirect user to success page, not the webhook
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        label: selected.label,
      }),
    });

    const data = await paystackRes.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Paystack error." }, { status: 500 });
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference:         data.data.reference,
    });

  } catch (err: any) {
    console.error("Payment initiation error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
