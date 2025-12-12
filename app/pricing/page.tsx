"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Card, Button } from "@/components/ui";
import Link from "next/link";

type SubscriptionStatus = {
  plan: "free" | "pro" | "team";
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  configured: boolean;
  customerId?: string;
};

const CheckIcon = () => (
  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function PricingPage() {
  const { t, language } = useI18n();
  const { user, session } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<"success" | "cancelled" | null>(null);

  // Check for checkout status in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setCheckoutStatus("success");
    } else if (params.get("checkout") === "cancelled") {
      setCheckoutStatus("cancelled");
    }
  }, []);

  // Fetch subscription status
  useEffect(() => {
    async function fetchSubscription() {
      if (!user?.email) return;
      
      try {
        const res = await fetch(`/api/stripe/subscription?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          setSubscription(data);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      }
    }

    fetchSubscription();
  }, [user?.email]);

  const handleCheckout = async (planKey: string) => {
    if (!user || !session) {
      // Redirect to login
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    setLoading(planKey);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          billingPeriod,
        }),
      });

      const data = await res.json();

      if (data.error) {
        if (data.error === "Stripe is not configured") {
          alert(t("pricing.stripeNotConfigured"));
        } else {
          alert(data.error);
        }
        setLoading(null);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(t("error.apiError"));
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    if (!user?.email) return;

    setLoading("portal");

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          customerId: subscription?.customerId,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      key: "free",
      price: "¥0",
      period: "/ 月",
      highlight: false,
      cta: subscription?.plan === "free" ? "current" : "free",
    },
    {
      key: "pro",
      price: billingPeriod === "yearly" ? "¥39,000" : "¥3,900",
      period: billingPeriod === "yearly" ? "/ 年" : "/ 月",
      highlight: true,
      savings: billingPeriod === "yearly" ? "2ヶ月分お得" : null,
      cta: subscription?.plan === "pro" ? "current" : "upgrade",
    },
    {
      key: "team",
      price: "お問い合わせ",
      period: "",
      highlight: false,
      cta: "contact",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-50 to-white pt-16 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            {t("pricing.hero.title")}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            {t("pricing.hero.subtitle")}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t("pricing.monthly")}
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingPeriod === "yearly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t("pricing.yearly")}
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {t("pricing.yearlyDiscount")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Status Messages */}
      {checkoutStatus && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-6">
          <div className={`p-4 rounded-lg ${
            checkoutStatus === "success" 
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-amber-50 border border-amber-200 text-amber-800"
          }`}>
            {checkoutStatus === "success" 
              ? t("pricing.checkoutSuccess")
              : t("pricing.checkoutCancelled")
            }
          </div>
        </div>
      )}

      {/* Current Subscription Banner */}
      {subscription?.plan === "pro" && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-6">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-primary-900">{t("pricing.currentPlan")}: Pro</p>
              {subscription.currentPeriodEnd && (
                <p className="text-sm text-primary-700">
                  {t("pricing.renewsOn")}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePortal}
              disabled={loading === "portal"}
            >
              {loading === "portal" ? "..." : t("pricing.manageSubscription")}
            </Button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl p-6 lg:p-8 transition-all ${
                plan.highlight
                  ? "bg-slate-900 text-white ring-4 ring-primary-500/20 scale-[1.02]"
                  : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  <StarIcon />
                  {t("pricing.mostPopular")}
                </div>
              )}

              <div className="mb-6">
                <h2 className={`text-xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                  {t(`pricing.${plan.key}.name`)}
                </h2>
                <p className={`text-sm ${plan.highlight ? "text-slate-300" : "text-slate-500"}`}>
                  {t(`pricing.${plan.key}.badge`)}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.highlight ? "text-slate-400" : "text-slate-500"}>
                      {plan.period}
                    </span>
                  )}
                </div>
                {plan.savings && (
                  <p className="text-emerald-400 text-sm mt-1 font-medium">{plan.savings}</p>
                )}
              </div>

              <p className={`text-sm mb-6 ${plan.highlight ? "text-slate-300" : "text-slate-600"}`}>
                {t(`pricing.${plan.key}.description`)}
              </p>

              <ul className="space-y-3 mb-8">
                {[1, 2, 3, 4].map((i) => {
                  const key = `pricing.${plan.key}.feature${i}`;
                  const text = t(key);
                  if (text === key) return null; // Key doesn't exist
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className={`text-sm ${plan.highlight ? "text-slate-200" : "text-slate-700"}`}>
                        {text}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {plan.cta === "current" ? (
                <Button
                  variant={plan.highlight ? "secondary" : "outline"}
                  size="lg"
                  className="w-full"
                  disabled
                >
                  {t("pricing.currentPlanButton")}
                </Button>
              ) : plan.cta === "free" ? (
                <Link href="/role">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    {t("pricing.getStartedFree")}
                  </Button>
                </Link>
              ) : plan.cta === "contact" ? (
                <a href="mailto:contact@interviewpilot.ai">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    {t("pricing.contactSales")}
                  </Button>
                </a>
              ) : (
                <Button
                  variant={plan.highlight ? "outline" : "primary"}
                  size="lg"
                  className={`w-full ${
                    plan.highlight
                      ? "!bg-white !text-slate-900 hover:!bg-slate-100"
                      : ""
                  }`}
                  onClick={() => handleCheckout(plan.key)}
                  disabled={loading === plan.key}
                >
                  {loading === plan.key ? "..." : t("pricing.upgradeNow")}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges / FAQ Section */}
      <div className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            {t("pricing.faq.title")}
          </h2>
          
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <details key={i} className="group bg-white rounded-lg border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50">
                  <span className="font-medium text-slate-900">
                    {t(`pricing.faq.q${i}`)}
                  </span>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-600">
                  {t(`pricing.faq.a${i}`)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t("pricing.enterprise.title")}
          </h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            {t("pricing.enterprise.description")}
          </p>
          <a href="mailto:contact@interviewpilot.ai">
            <Button variant="outline" size="lg">
              {t("pricing.enterprise.cta")}
            </Button>
          </a>
        </div>
      </div>

      {/* Security Note */}
      <div className="border-t border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t("pricing.secure")}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Stripe
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t("pricing.cancelAnytime")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
