import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Helper to safely access subscription properties across different Stripe API versions
function getSubscriptionPeriodEnd(sub: Stripe.Subscription): number | undefined {
  return (sub as unknown as { current_period_end?: number }).current_period_end;
}

function getSubscriptionCancelAtPeriodEnd(sub: Stripe.Subscription): boolean {
  return (sub as unknown as { cancel_at_period_end?: boolean })
    .cancel_at_period_end ?? false;
}

type SubscriptionRow = {
  user_id: string;
  user_email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "free" | "pro" | "team";
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// This endpoint must receive the raw body for signature verification
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        let userId = session.metadata?.supabase_user_id || "";
        let userEmail =
          session.metadata?.user_email || session.customer_details?.email || null;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        console.log(`Checkout completed for user ${userId}, subscription ${subscriptionId}`);

        if (supabase && userId) {
          const sub = subscriptionId
            ? await stripe.subscriptions.retrieve(subscriptionId)
            : null;
          const periodEnd = sub ? getSubscriptionPeriodEnd(sub) : undefined;
          const row: SubscriptionRow = {
            user_id: userId,
            user_email: userEmail,
            stripe_customer_id: customerId || null,
            stripe_subscription_id: subscriptionId || null,
            plan: "pro",
            status: sub?.status || "active",
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            cancel_at_period_end: sub ? getSubscriptionCancelAtPeriodEnd(sub) : false,
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from("subscriptions")
            .upsert(row, { onConflict: "user_id" });
          if (error) {
            console.error("Failed to upsert subscription:", error);
            return NextResponse.json(
              { error: "Failed to persist subscription" },
              { status: 500 }
            );
          }
        }
        // If session metadata is missing (e.g., test fixtures), try to infer from customer metadata
        if (supabase && !userId && customerId) {
          try {
            const customer = (await stripe.customers.retrieve(
              customerId
            )) as Stripe.Customer;
            userId = customer.metadata?.supabase_user_id || "";
            if (!userEmail) userEmail = customer.email || null;
          } catch (e) {
            console.warn("Failed to retrieve customer for inference:", e);
          }
        }

        if (supabase && userId) {
          const sub = subscriptionId
            ? await stripe.subscriptions.retrieve(subscriptionId)
            : null;
          const periodEnd = sub ? getSubscriptionPeriodEnd(sub) : undefined;
          const row: SubscriptionRow = {
            user_id: userId,
            user_email: userEmail,
            stripe_customer_id: customerId || null,
            stripe_subscription_id: subscriptionId || null,
            plan: "pro",
            status: sub?.status || "active",
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            cancel_at_period_end: sub ? getSubscriptionCancelAtPeriodEnd(sub) : false,
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from("subscriptions")
            .upsert(row, { onConflict: "user_id" });
          if (error) {
            console.error("Failed to upsert subscription:", error);
            return NextResponse.json(
              { error: "Failed to persist subscription" },
              { status: 500 }
            );
          }
        } else if (!userId) {
          console.warn(
            "Skipping subscription upsert: supabase_user_id was not found on session/customer metadata."
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        console.log(`Subscription ${subscription.id} updated to status: ${status}`);

        if (supabase) {
          let userId = subscription.metadata?.supabase_user_id || "";
          const userEmail =
            subscription.metadata?.user_email || null;

          if (!userId && customerId) {
            const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
            userId = customer.metadata?.supabase_user_id || "";
          }

          if (userId) {
            const periodEnd = getSubscriptionPeriodEnd(subscription);
            const row: SubscriptionRow = {
              user_id: userId,
              user_email: userEmail,
              stripe_customer_id: customerId || null,
              stripe_subscription_id: subscription.id || null,
              plan: "pro",
              status,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              cancel_at_period_end: getSubscriptionCancelAtPeriodEnd(subscription),
              updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
              .from("subscriptions")
              .upsert(row, { onConflict: "user_id" });
            if (error) {
              console.error("Failed to upsert subscription:", error);
              return NextResponse.json(
                { error: "Failed to persist subscription" },
                { status: 500 }
              );
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${subscription.id} cancelled`);

        if (supabase) {
          const customerId = subscription.customer as string;
          let userId = subscription.metadata?.supabase_user_id || "";
          const userEmail = subscription.metadata?.user_email || null;

          if (!userId && customerId) {
            const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
            userId = customer.metadata?.supabase_user_id || "";
          }

          if (userId) {
            // Cancellation completed: treat as free for gating.
            const row: SubscriptionRow = {
              user_id: userId,
              user_email: userEmail,
              stripe_customer_id: customerId || null,
              stripe_subscription_id: subscription.id || null,
              plan: "free",
              status: "active",
              current_period_end: null,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
              .from("subscriptions")
              .upsert(row, { onConflict: "user_id" });
            if (error) {
              console.error("Failed to upsert subscription:", error);
              return NextResponse.json(
                { error: "Failed to persist subscription" },
                { status: 500 }
              );
            }
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for invoice ${invoice.id}`);
        // You might want to notify the user or update their status
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Disable body parsing for this route (required for Stripe webhook signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
};

