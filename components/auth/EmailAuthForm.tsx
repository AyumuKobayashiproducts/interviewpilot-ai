"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { Button, Input } from "@/components/ui";

interface EmailAuthFormProps {
  onSuccess?: () => void;
}

type Mode = "signIn" | "signUp" | "reset";

export function EmailAuthForm({ onSuccess }: EmailAuthFormProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    setIsLoading(true);

    try {
      if (mode === "reset") {
        if (!email) {
          setError(t("auth.error.emptyFields"));
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage(t("auth.reset.checkEmail"));
      } else {
        if (!email || !password) {
          setError(t("auth.error.emptyFields"));
          return;
        }

        if (mode === "signUp" && password !== confirmPassword) {
          setError(t("auth.error.passwordMismatch"));
          return;
        }

        if (password.length < 6) {
          setError(t("auth.error.passwordTooShort"));
          return;
        }

        // Sign up
        if (mode === "signUp") {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;
          setMessage(t("auth.signUp.checkEmail"));
        } else {
          // Sign in
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;
          onSuccess?.();
        }
      }
    } catch (err: any) {
      if (err.message === "Invalid login credentials") {
        setError(t("auth.error.invalidCredentials"));
      } else if (err.message?.includes("already registered")) {
        setError(t("auth.error.emailExists"));
      } else {
        setError(err.message || t("auth.error.generic"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        label={t("auth.email")}
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {mode !== "reset" && (
        <Input
          type="password"
          label={t("auth.password")}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      )}

      {mode === "signUp" && (
        <Input
          type="password"
          label={t("auth.confirmPassword")}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {message}
        </div>
      )}

      <Button type="submit" isLoading={isLoading} className="w-full">
        {mode === "reset"
          ? t("auth.reset.button")
          : mode === "signUp"
          ? t("auth.signUp.button")
          : t("auth.signIn.button")}
      </Button>

      {mode !== "reset" && (
        <div className="flex justify-between items-center text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("reset");
              setError("");
              setMessage("");
            }}
            className="text-slate-500 hover:text-slate-700 hover:underline"
          >
            {t("auth.reset.link")}
          </button>
        </div>
      )}

      <div className="text-center mt-2">
        <button
          type="button"
          onClick={() => {
            setMode((prev) =>
              prev === "signUp" ? "signIn" : "signUp"
            );
            setError("");
            setMessage("");
          }}
          className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
        >
          {mode === "signUp"
            ? t("auth.signIn.switchTo")
            : t("auth.signUp.switchTo")}
        </button>
      </div>
    </form>
  );
}

