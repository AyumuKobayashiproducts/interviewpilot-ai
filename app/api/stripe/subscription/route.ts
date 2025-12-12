import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured, PlanType } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
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

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function upsertSubscriptionCache(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  userId: string;
  userEmail: string;
  customerId: string | null;
  subscriptionId: string | null;
  plan: PlanType;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}) {
  const { supabase } = params;
  if (!supabase) return;
  if (!params.userId) return;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: params.userId,
      user_email: params.userEmail,
      stripe_customer_id: params.customerId,
      stripe_subscription_id: params.subscriptionId,
      plan: params.plan,
      status: params.status,
      current_period_end: params.currentPeriodEnd ?? null,
      cancel_at_period_end: params.cancelAtPeriodEnd ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("Failed to upsert subscription cache:", error);
  }
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

    // Prefer DB cache (webhook persisted) to avoid hitting Stripe on every request.
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .select(
          "plan, status, current_period_end, cancel_at_period_end, stripe_customer_id"
        )
        .eq("user_email", userEmail)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Failed to fetch subscription from DB:", error);
      } else if (data && data.length > 0) {
        const row = data[0] as {
          plan: PlanType;
          status: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean | null;
          stripe_customer_id: string | null;
        };

        return NextResponse.json({
          plan: (row.plan || "free") as PlanType,
          status: row.status || "active",
          currentPeriodEnd: row.current_period_end || undefined,
          cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
          configured: true,
          customerId: row.stripe_customer_id || undefined,
          source: "db",
        });
      }
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

    const customer = customers.data[0];
    const customerId = customer.id;
    const userIdFromStripe = customer.metadata?.supabase_user_id || "";

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
        if (supabaseAdmin && userIdFromStripe) {
          await upsertSubscriptionCache({
            supabase: supabaseAdmin,
            userId: userIdFromStripe,
            userEmail,
            customerId,
            subscriptionId: sub.id,
            plan: "pro",
            status: sub.status,
            currentPeriodEnd: getSubscriptionPeriodEnd(sub),
            cancelAtPeriodEnd: getSubscriptionCancelAtPeriodEnd(sub),
          });
        }
        return NextResponse.json({
          plan: "pro" as PlanType,
          status: sub.status,
          currentPeriodEnd: getSubscriptionPeriodEnd(sub),
          cancelAtPeriodEnd: getSubscriptionCancelAtPeriodEnd(sub),
          configured: true,
          customerId,
        });
      }

      if (supabaseAdmin && userIdFromStripe) {
        await upsertSubscriptionCache({
          supabase: supabaseAdmin,
          userId: userIdFromStripe,
          userEmail,
          customerId,
          subscriptionId: null,
          plan: "free",
          status: "active",
          currentPeriodEnd: undefined,
          cancelAtPeriodEnd: false,
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
    if (supabaseAdmin && userIdFromStripe) {
      await upsertSubscriptionCache({
        supabase: supabaseAdmin,
        userId: userIdFromStripe,
        userEmail,
        customerId,
        subscriptionId: subscription.id,
        plan: "pro",
        status: subscription.status,
        currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
        cancelAtPeriodEnd: getSubscriptionCancelAtPeriodEnd(subscription),
      });
    }

    return NextResponse.json({
      plan: "pro" as PlanType,
      status: subscription.status,
      currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
      cancelAtPeriodEnd: getSubscriptionCancelAtPeriodEnd(subscription),
      configured: true,
      customerId,
      source: "stripe",
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}

