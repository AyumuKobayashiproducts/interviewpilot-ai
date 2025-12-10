import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!stripe || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { customerId, userEmail } = body;

    if (!customerId && !userEmail) {
      return NextResponse.json(
        { error: "Customer ID or email required" },
        { status: 400 }
      );
    }

    let stripeCustomerId = customerId;

    // If no customer ID provided, look up by email
    if (!stripeCustomerId && userEmail) {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return NextResponse.json(
          { error: "No subscription found for this account" },
          { status: 404 }
        );
      }

      stripeCustomerId = customers.data[0].id;
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}

