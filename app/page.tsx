"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button, Card } from "@/components/ui";

export default function HomePage() {
  const { t, language } = useI18n();
  const { user, isLoading, isConfigured, signInWithGoogle } = useAuth();

  const features = [
    {
      titleKey: "home.feature1.title",
      descKey: "home.feature1.desc",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      titleKey: "home.feature2.title",
      descKey: "home.feature2.desc",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      titleKey: "home.feature3.title",
      descKey: "home.feature3.desc",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  const renderCTA = () => {
    if (!isConfigured) {
      return (
        <Link href="/role">
          <Button size="lg" className="text-base px-8 py-4 rounded-2xl">
            {t("home.cta")}
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </Link>
      );
    }

    if (isLoading) {
      return (
        <Button size="lg" className="text-base px-8 py-4 rounded-2xl" disabled>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
          Loading...
        </Button>
      );
    }

    if (user) {
      return (
        <Link href="/role">
          <Button size="lg" className="text-base px-8 py-4 rounded-2xl">
            {t("home.cta")}
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </Link>
      );
    }

    return (
      <Link href="/login">
        <Button size="lg" className="text-base px-8 py-4 rounded-2xl">
          {t("home.cta.login")}
        </Button>
      </Link>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-primary-400/20 to-accent-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-gradient-to-tr from-accent-400/15 to-primary-400/15 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              {t("home.badge")}
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6 animate-fade-in animate-delay-100 tracking-tight leading-[1.2]">
              {t("home.hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 animate-fade-in animate-delay-200 leading-relaxed max-w-2xl mx-auto">
              {t("home.hero.subtitle")}
            </p>
            <div className="animate-fade-in animate-delay-300">
              {renderCTA()}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-transparent -z-10" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {t("home.features.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.titleKey}
                className="animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` } as React.CSSProperties}
              >
                <Card className="bg-white/80 backdrop-blur-sm text-center hover:shadow-lg transition-shadow h-full">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/25">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{t(feature.descKey)}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 tracking-tight">
                {t("home.steps.title")}
              </h2>
              <div className="space-y-6">
                {[
                  { step: "1", title: t("nav.role"), desc: t("role.subheading") },
                  { step: "2", title: t("nav.candidate"), desc: t("candidate.subheading") },
                  { step: "3", title: t("nav.plan"), desc: t("plan.subheading") },
                ].map((item, index) => (
                  <div key={item.step} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                      {item.step}
                    </div>
                    <div className="pt-1">
                      <h3 className="text-base font-semibold text-slate-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Card variant="default" padding="lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium text-[#697386]">
                      サンプルダッシュボード
                    </p>
                    <p className="text-sm font-semibold text-[#1A1F36]">
                      Senior Backend Engineer
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-[#E6EBF1] px-2 py-0.5 text-[11px] text-[#697386]">
                    デモ表示
                  </span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-md border border-[#E6EBF1] bg-[#F6F9FC] px-3 py-2">
                    <p className="text-[11px] text-[#697386] mb-1">
                      面接準備にかかる時間
                    </p>
                    <p className="text-lg font-semibold text-[#1A1F36]">
                      -60%
                    </p>
                  </div>
                  <div className="rounded-md border border-[#E6EBF1] bg-[#F6F9FC] px-3 py-2">
                    <p className="text-[11px] text-[#697386] mb-1">
                      今月作成したプラン
                    </p>
                    <p className="text-lg font-semibold text-[#1A1F36]">12</p>
                  </div>
                  <div className="rounded-md border border-[#E6EBF1] bg-[#F6F9FC] px-3 py-2">
                    <p className="text-[11px] text-[#697386] mb-1">
                      アクティブな候補者
                    </p>
                    <p className="text-lg font-semibold text-[#1A1F36]">5</p>
                  </div>
                </div>

                {/* Mini results table */}
                <div className="border border-[#E6EBF1] rounded-md overflow-hidden bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F6F9FC] border-b border-[#E6EBF1]">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-[#697386]">
                          候補者
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-[#697386]">
                          職種
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-[#697386]">
                          スコア
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-[#697386]">
                          判断
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EBF1]">
                      <tr>
                        <td className="px-3 py-2 text-[#1A1F36]">山田 太郎</td>
                        <td className="px-3 py-2 text-[#697386]">Backend</td>
                        <td className="px-3 py-2 text-center text-[#1A1F36]">
                          82
                        </td>
                        <td className="px-3 py-2 text-[#0070E0] text-xs">
                          Strong Yes
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-[#1A1F36]">
                          Jane Doe
                        </td>
                        <td className="px-3 py-2 text-[#697386]">
                          Full‑stack
                        </td>
                        <td className="px-3 py-2 text-center text-[#1A1F36]">
                          78
                        </td>
                        <td className="px-3 py-2 text-[#697386] text-xs">
                          Yes
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-[#1A1F36]">
                          佐藤 花子
                        </td>
                        <td className="px-3 py-2 text-[#697386]">
                          Platform
                        </td>
                        <td className="px-3 py-2 text-center text-[#1A1F36]">
                          71
                        </td>
                        <td className="px-3 py-2 text-[#697386] text-xs">
                          Maybe
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="mt-3 text-[11px] text-[#697386]">
                  {t("home.steps.aiAssistantLabel")} — 質問・スコアカード・評価一覧までを1つの画面から補助します。
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white/80 backdrop-blur-sm p-8 md:p-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {t("home.about.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {t("home.about.body")}
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} InterviewPilot AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
