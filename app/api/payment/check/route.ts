import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await res.json();

    if (!data.status || data.data?.status !== "success") {
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
    }

    const { metadata, amount } = data.data;
    const plan = metadata?.plan || "monthly";

    const now = new Date();
    let expiresAt: Date;
    if      (plan === "annual")    { expiresAt = new Date(new Date().setFullYear(now.getFullYear() + 1)); }
    else if (plan === "quarterly") { expiresAt = new Date(new Date().setMonth(now.getMonth() + 3)); }
    else                           { expiresAt = new Date(new Date().setMonth(now.getMonth() + 1)); }

    return NextResponse.json({
      success: true,
      plan,
      expiresAt: expiresAt.toISOString(),
      amount,
    });

  } catch (err: any) {
    console.error("Payment check error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
