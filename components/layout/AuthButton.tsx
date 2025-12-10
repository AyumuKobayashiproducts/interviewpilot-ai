"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export function AuthButton() {
  const { user, isLoading, isConfigured, signOut } = useAuth();
  const { t } = useI18n();
  const [isSigningIn] = useState(false);

  // Don't show auth button if Supabase is not configured
  if (!isConfigured) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata?.full_name || "User"}
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            />
          )}
          <span className="text-sm font-medium text-slate-700 hidden sm:block">
            {user.user_metadata?.full_name || user.email?.split("@")[0]}
          </span>
        </div>
        <Link
          href="/settings"
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
        >
          {t("settings.link")}
        </Link>
        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
        >
          {t("auth.logout")}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white/80 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200"
    >
      {t("auth.signIn.button")}
    </Link>
  );
}

