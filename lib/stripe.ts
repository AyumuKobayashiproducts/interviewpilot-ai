import Stripe from "stripe";

// Server-side Stripe instance
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    })
  : null;

// Price IDs - set these in your Stripe dashboard and add to environment variables
export const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
} as const;

// Plan limits
export const PLAN_LIMITS = {
  free: {
    interviewPlansPerMonth: 3,
    features: ["basic_questions", "basic_scorecard"],
  },
  pro: {
    interviewPlansPerMonth: 50,
    features: ["advanced_questions", "advanced_scorecard", "export", "team_sharing"],
  },
  team: {
    interviewPlansPerMonth: -1, // unlimited
    features: ["everything", "templates", "support"],
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

// Helper to check if Stripe is configured
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_PRO_MONTHLY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

