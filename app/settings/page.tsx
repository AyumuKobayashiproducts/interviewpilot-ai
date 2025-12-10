"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card, Button } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth";

function SettingsPageContent() {
  const { t } = useI18n();
  const { user, session, signOut } = useAuth();
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (!user || !session) return;

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

      alert(t("settings.delete.success"));
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Delete account error:", error);
      alert(t("settings.delete.error"));
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
        {t("settings.title")}
      </h1>

      <div className="space-y-6">
        <Card variant="glass" padding="lg">
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

        <Card variant="bordered" padding="lg" className="border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            {t("settings.danger.title")}
          </h2>
          <p className="text-sm text-red-700 mb-4">
            {t("settings.danger.description")}
          </p>
          <Button
            variant="outline"
            className="border-red-500 text-red-600 hover:bg-red-50"
            onClick={handleDeleteAccount}
          >
            {t("settings.delete.button")}
          </Button>
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


