"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { AuthButton } from "./AuthButton";
import { classNames } from "@/lib/utils";

const navItems = [
  { key: "nav.home", href: "/" },
  { key: "nav.role", href: "/role" },
  { key: "nav.candidate", href: "/candidate" },
  { key: "nav.plan", href: "/plan" },
  { key: "nav.results", href: "/results" },
  { key: "nav.pricing", href: "/pricing" },
];

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label={t("app.title")}
          >
            <div className="relative h-9 w-9 rounded-xl overflow-hidden shadow-soft group-hover:shadow-glow transition-shadow duration-300">
              <Image
                src="/logo.svg"
                alt="InterviewPilot AI logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="font-semibold text-lg text-slate-800 hidden sm:inline-block tracking-tight">
              InterviewPilot
              <span className="text-primary-600 ml-0.5">AI</span>
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center bg-slate-100/60 rounded-full p-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={classNames(
                      "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
                      isActive
                        ? "bg-white text-slate-900 shadow-soft"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right side: Auth */}
          <div className="flex items-center gap-2">
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-slate-100/60 bg-white/80 backdrop-blur-xl">
        <div className="flex justify-center gap-1 px-4 py-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  "px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
