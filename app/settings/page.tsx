"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card, Button } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth";
import Link from "next/link";

type SubscriptionStatus = {
  plan: "free" | "pro" | "team";
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  configured: boolean;
  customerId?: string;
};

function SettingsPageContent() {
  const { t } = useI18n();
  const { user, session } = useAuth();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Check for checkout success
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      setCheckoutSuccess(true);
      // Remove the query param from URL
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

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

  const handleScheduleDeletion = async () => {
    if (!user || !session) return;

    if (deleteConfirmText.trim() !== "DELETE") {
      alert("削除を確定するには、確認欄に DELETE と入力してください。");
      return;
    }

    const confirmed = window.confirm(t("settings.delete.confirm"));
    if (!confirmed) return;

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.access_token }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 501) {
          alert(t("settings.delete.notConfigured"));
          return;
        }
        throw new Error(data.error || "Delete failed");
      }

      const data = await response.json().catch(() => ({}));
      if (data?.email?.configured && data?.email?.sent) {
        alert(t("settings.delete.scheduledEmailSent"));
      } else if (data?.email?.configured && !data?.email?.sent) {
        alert(t("settings.delete.scheduledEmailFailed"));
      } else {
        alert(t("settings.delete.scheduledEmailNotConfigured"));
      }
      window.location.reload();
    } catch (error) {
      console.error("Delete account error:", error);
      alert(t("settings.delete.error"));
    }
  };

  const handleCancelDeletion = async () => {
    if (!user || !session) return;

    const confirmed = window.confirm(t("settings.delete.cancelConfirm"));
    if (!confirmed) return;

    try {
      const response = await fetch("/api/account/delete/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.access_token }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 501) {
          alert(t("settings.delete.notConfigured"));
          return;
        }
        throw new Error(data.error || "Cancel failed");
      }

      alert(t("settings.delete.cancelled"));
      window.location.reload();
    } catch (error) {
      console.error("Cancel deletion error:", error);
      alert(t("settings.delete.error"));
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.email) return;

    setLoadingPortal(true);

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
        if (data.error === "No subscription found for this account") {
          alert(t("settings.subscription.noSubscription"));
        } else {
          alert(data.error);
        }
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setLoadingPortal(false);
    }
  };

  if (!user) return null;

  const planLabel = subscription?.plan === "pro" 
    ? "Pro" 
    : subscription?.plan === "team" 
      ? "Team" 
      : "Free";

  const statusLabel = subscription?.status === "active"
    ? "有効"
    : subscription?.status === "trialing"
      ? "トライアル中"
      : subscription?.status === "past_due"
        ? "支払い遅延"
        : subscription?.status === "cancelled"
          ? "解約済み"
          : "有効";

  const deletionScheduledFor = (user.user_metadata as any)?.deletion_scheduled_for as
    | string
    | undefined;
  const deletionRequestedAt = (user.user_metadata as any)?.deletion_requested_at as
    | string
    | undefined;
  const deletionScheduledTs = deletionScheduledFor ? Date.parse(deletionScheduledFor) : NaN;
  const hasDeletionSchedule = Number.isFinite(deletionScheduledTs);
  const isDeletionScheduled = hasDeletionSchedule && deletionScheduledTs > Date.now();
  const isDeletionDue = hasDeletionSchedule && deletionScheduledTs <= Date.now();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
        {t("settings.title")}
      </h1>

      {/* Checkout Success Banner */}
      {checkoutSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t("settings.subscription.activated")}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {hasDeletionSchedule && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-medium">
              {t("settings.delete.scheduledNoticeTitle")}
              {isDeletionDue ? "（期限到来）" : ""}
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {t("settings.delete.scheduledNoticeBody")}{" "}
              <span className="font-medium">
                {new Date(deletionScheduledFor as string).toLocaleString()}
              </span>
            </p>
            {isDeletionDue && (
              <p className="mt-1 text-xs text-amber-800">
                ※ 削除処理が実行され次第、完全削除されます。
              </p>
            )}
            {deletionRequestedAt && (
              <p className="mt-1 text-xs text-amber-700">
                {t("settings.delete.requestedAt")}:{" "}
                {new Date(deletionRequestedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Account Info */}
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            {t("settings.account.heading")}
          </h2>
          <p className="text-sm text-slate-600 mb-1">
            {t("settings.account.email")}
          </p>
          <p className="text-sm font-mono text-slate-800">
            {user.email || "-"}
          </p>
        </Card>

        {/* Subscription Info */}
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t("settings.subscription.title")}
          </h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-slate-900">{planLabel}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  subscription?.plan === "pro" 
                    ? "bg-primary-100 text-primary-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {statusLabel}
                </span>
              </div>
              {subscription?.currentPeriodEnd && subscription.plan !== "free" && (
                <p className="text-sm text-slate-600">
                  {subscription.cancelAtPeriodEnd 
                    ? t("settings.subscription.expiresOn")
                    : t("settings.subscription.renewsOn")
                  }: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            
            {subscription?.plan === "free" ? (
              <Link href="/pricing">
                <Button variant="primary" size="sm">
                  {t("settings.subscription.upgrade")}
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
              >
                {loadingPortal ? "..." : t("settings.subscription.manage")}
              </Button>
            )}
          </div>

          {subscription?.plan === "free" && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-2">
                {t("settings.subscription.freeDescription")}
              </p>
              <Link href="/pricing" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                {t("settings.subscription.viewPlans")} →
              </Link>
            </div>
          )}

          {subscription?.cancelAtPeriodEnd && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-sm text-amber-800">
                {t("settings.subscription.cancelledNotice")}
              </p>
            </div>
          )}
        </Card>

        {/* Danger Zone */}
        <Card padding="lg" className="border border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            {t("settings.danger.title")}
          </h2>
          <p className="text-sm text-red-700 mb-4">
            {t("settings.danger.description")}
          </p>
          <div className="mb-4">
            <label className="block text-xs font-medium text-red-800 mb-1">
              確認のため「DELETE」と入力してください
            </label>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={handleScheduleDeletion}
              disabled={deleteConfirmText.trim() !== "DELETE" || hasDeletionSchedule}
            >
              {hasDeletionSchedule ? t("settings.delete.scheduled") : t("settings.delete.button")}
            </Button>
            {hasDeletionSchedule && (
              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-white"
                onClick={handleCancelDeletion}
              >
                {t("settings.delete.cancelButton")}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
