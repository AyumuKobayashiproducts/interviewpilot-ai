"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isConfigured } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    // If Supabase is configured and user is not logged in, redirect to login
    if (!isLoading && isConfigured && !user) {
      router.push("/login");
    }
  }, [user, isLoading, isConfigured, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If Supabase is not configured, show warning but allow access (for development)
  if (!isConfigured) {
    return (
      <div>
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
          ⚠️ {t("auth.supabaseNotConfigured")}
        </div>
        {children}
      </div>
    );
  }

  // If not logged in, show nothing (will redirect)
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-600">{t("auth.redirecting")}</p>
        </div>
      </div>
    );
  }

  // User is logged in, render children
  return <>{children}</>;
}

