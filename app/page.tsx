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
            
            {language === "ja" ? (
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6 animate-fade-in animate-delay-100 tracking-tight leading-[1.2]">
                {t("home.hero.title")}
              </h1>
            ) : (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6 animate-fade-in animate-delay-100 tracking-tight leading-[1.1]">
                Conduct Better{" "}
                <span className="gradient-text">Interviews</span>
                <br className="hidden sm:block" />
                {" "}
                with AI
              </h1>
            )}
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
              <Card
                key={feature.titleKey}
                variant="glass"
                hover
                className={`text-center animate-fade-in-up`}
                style={{ animationDelay: `${(index + 1) * 100}ms` } as React.CSSProperties}
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/25">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{t(feature.descKey)}</p>
              </Card>
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
              <Card variant="elevated" className="p-6 lg:p-8">
                <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center border border-slate-200/50">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm">
                      {t("home.steps.aiAssistantLabel")}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="glass" className="p-8 md:p-10">
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
