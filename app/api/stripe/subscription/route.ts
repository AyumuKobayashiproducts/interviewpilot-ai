import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured, PlanType } from "@/lib/stripe";
import Stripe from "stripe";

// Helper to safely get subscription period end
function getSubscriptionPeriodEnd(sub: Stripe.Subscription): string | undefined {
  // Access the property using bracket notation to avoid TypeScript issues with Stripe API versions
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  if (periodEnd) {
    return new Date(periodEnd * 1000).toISOString();
  }
  return undefined;
}

function getSubscriptionCancelAtPeriodEnd(sub: Stripe.Subscription): boolean {
  return (sub as unknown as { cancel_at_period_end?: boolean }).cancel_at_period_end ?? false;
}

export async function GET(request: NextRequest) {
  if (!stripe || !isStripeConfigured()) {
    // Return free plan if Stripe is not configured
    return NextResponse.json({
      plan: "free" as PlanType,
      status: "active",
      configured: false,
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    if (!userEmail) {
      return NextResponse.json({
        plan: "free" as PlanType,
        status: "active",
        configured: true,
      });
    }

    // Look up customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({
        plan: "free" as PlanType,
        status: "active",
        configured: true,
      });
    }

    const customerId = customers.data[0].id;

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Check for trialing or past_due subscriptions
      const allSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
      });

      if (allSubscriptions.data.length > 0) {
        const sub = allSubscriptions.data[0];
        return NextResponse.json({
          plan: "pro" as PlanType,
          status: sub.status,
          currentPeriodEnd: getSubscriptionPeriodEnd(sub),
          cancelAtPeriodEnd: getSubscriptionCancelAtPeriodEnd(sub),
          configured: true,
          customerId,
        });
      }

      return NextResponse.json({
        plan: "free" as PlanType,
        status: "active",
        configured: true,
        customerId,
      });
    }

    const subscription = subscriptions.data[0];

    return NextResponse.json({
      plan: "pro" as PlanType,
      status: subscription.status,
      currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
      cancelAtPeriodEnd: getSubscriptionCancelAtPeriodEnd(subscription),
      configured: true,
      customerId,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}

