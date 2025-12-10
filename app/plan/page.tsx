"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n, Language } from "@/lib/i18n";
import { Button, Card, Section } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth";
import { InterviewPlan, InterviewQuestion, QuestionCategory } from "@/types";

// テキストが日本語を含むかどうかを判定
function containsJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

// InterviewPlan の言語を推測
function detectPlanLanguage(plan: InterviewPlan): Language {
  const textToCheck = [
    plan.roleProfile?.title || "",
    ...(plan.roleProfile?.requiredSkills || []),
    ...(plan.questions?.map(q => q.question) || []),
  ].join(" ");
  return containsJapanese(textToCheck) ? "ja" : "en";
}

function PlanPageContent() {
  const { t, language } = useI18n();
  const router = useRouter();

  const [plan, setPlan] = useState<InterviewPlan | null>(null);
  const [openSections, setOpenSections] = useState<
    Record<QuestionCategory, boolean>
  >({
    technical: true,
    behavioral: true,
    culture: true,
  });
  const [planLanguage, setPlanLanguage] = useState<Language | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // 初期化完了フラグと前回の言語をトラック
  const isInitialized = useRef(false);
  const prevLanguageRef = useRef<Language>(language);

  useEffect(() => {
    const stored = sessionStorage.getItem("interviewPlan");
    const storedLang = sessionStorage.getItem(
      "interviewPlanLanguage"
    ) as Language | null;

    if (stored) {
      const parsedPlan = JSON.parse(stored) as InterviewPlan;
      setPlan(parsedPlan);
      
      // 言語が保存されていない場合は、テキストから推測する
      if (storedLang) {
        setPlanLanguage(storedLang);
      } else {
        // テキストから言語を推測
        const detectedLang = detectPlanLanguage(parsedPlan);
        setPlanLanguage(detectedLang);
        // 推測した言語を保存
        sessionStorage.setItem("interviewPlanLanguage", detectedLang);
      }
      
      isInitialized.current = true;
    } else {
      router.push("/role");
    }
  }, [router]);

  // 言語トグルが切り替わったら、自動的にプランを再生成して翻訳する
  useEffect(() => {
    // 初期化前は何もしない
    if (!isInitialized.current) return;
    if (!plan || !planLanguage) return;
    
    // 言語が実際に変わった場合のみ翻訳
    if (language === prevLanguageRef.current) return;
    prevLanguageRef.current = language;
    
    // 保存されている言語と現在の言語が同じなら翻訳不要
    if (language === planLanguage) return;

    let cancelled = false;

    const regenerateForLanguage = async () => {
      setIsTranslating(true);
      try {
        const response = await fetch("/api/interview/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleProfile: plan.roleProfile,
            candidateProfile: plan.candidateProfile,
            language,
          }),
        });

        if (!response.ok) {
          throw new Error("Interview plan regeneration failed");
        }

        const data = await response.json();
        if (cancelled) return;

        setPlan(data.interviewPlan);
        setPlanLanguage(language);
        sessionStorage.setItem(
          "interviewPlan",
          JSON.stringify(data.interviewPlan)
        );
        sessionStorage.setItem("interviewPlanLanguage", language);
      } catch (error) {
        console.error("Failed to regenerate interview plan:", error);
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    };

    regenerateForLanguage();

    return () => {
      cancelled = true;
    };
  }, [language]);

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const groupedQuestions = plan.questions.reduce((acc, q) => {
    if (!acc[q.category]) {
      acc[q.category] = [];
    }
    acc[q.category].push(q);
    return acc;
  }, {} as Record<QuestionCategory, InterviewQuestion[]>);

  const categoryConfig: Record<
    QuestionCategory,
    { titleKey: string; icon: React.ReactNode; color: string }
  > = {
    technical: {
      titleKey: "plan.questions.technical",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
      color: "from-blue-500 to-blue-600",
    },
    behavioral: {
      titleKey: "plan.questions.behavioral",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "from-green-500 to-green-600",
    },
    culture: {
      titleKey: "plan.questions.culture",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "from-purple-500 to-purple-600",
    },
  };

  const totalQuestions = plan.questions.length;
  const technicalCount = groupedQuestions.technical?.length || 0;
  const behavioralCount = groupedQuestions.behavioral?.length || 0;
  const cultureCount = groupedQuestions.culture?.length || 0;

  const startOver = () => {
    sessionStorage.removeItem("roleProfile");
    sessionStorage.removeItem("interviewPlan");
    router.push("/role");
  };

  const toggleSection = (category: QuestionCategory) => {
    setOpenSections((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {isTranslating && (
        <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">
          {t("button.generating")}
        </div>
      )}
      {/* Header */}
      <div className="mb-4 text-sm font-medium text-primary-700">
        {t("steps.plan")}
      </div>
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          {t("plan.heading")}
        </h1>
        <p className="text-lg text-slate-600">{t("plan.subheading")}</p>
      </div>

      {/* Summary Card */}
      <Card
        variant="elevated"
        padding="lg"
        className="mb-8 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-100"
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          {t("plan.summary.title")}
        </h2>
        <p className="text-sm text-slate-700 mb-3">
          {t("plan.summary.subtitle")}
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-700 mt-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-semibold">
              {totalQuestions}
            </span>
            <span>{t("plan.summary.questionsLabel")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs">
              {t("plan.questions.technical")}: {technicalCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs">
              {t("plan.questions.behavioral")}: {behavioralCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs">
              {t("plan.questions.culture")}: {cultureCount}
            </span>
          </div>
        </div>
      </Card>

      {/* Role & Candidate Summary */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </span>
            {t("plan.role.title")}
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-slate-700">
                {plan.roleProfile.title}
              </span>
              {plan.roleProfile.level && (
                <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded text-slate-600 text-xs">
                  {plan.roleProfile.level}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {plan.roleProfile.requiredSkills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {plan.candidateProfile && (
          <Card variant="bordered" padding="md">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-accent-100 text-accent-600 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </span>
              {t("plan.candidate.title")}
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">
                {plan.candidateProfile.experienceSummary}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {plan.candidateProfile.keySkills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-accent-50 text-accent-700 rounded-lg text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Interview Questions */}
      <Section>
        {(["technical", "behavioral", "culture"] as QuestionCategory[]).map(
          (category) => {
            const questions = groupedQuestions[category];
            if (!questions || questions.length === 0) return null;

            const config = categoryConfig[category];
            const isOpen = openSections[category];

            return (
              <div key={category} className="mb-6 border-b border-slate-100 pb-4">
                <button
                  type="button"
                  onClick={() => toggleSection(category)}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} text-white flex items-center justify-center shadow-lg`}
                    >
                      {config.icon}
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {t(config.titleKey)}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {questions.length}{" "}
                        {t("plan.summary.questionsLabel").toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-500">
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        isOpen ? "rotate-0" : "-rotate-90"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-4">
                    {questions.map((question, index) => (
                      <Card
                        key={question.id}
                        variant="elevated"
                        padding="md"
                        className="hover:shadow-xl transition-shadow"
                      >
                        <div className="flex gap-4">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-semibold text-sm flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-slate-900 font-medium mb-4">
                              {question.question}
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                              {/* Good Signs */}
                              <div className="bg-green-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  {t("plan.goodSigns")}
                                </h4>
                                <ul className="space-y-1.5">
                                  {question.goodSigns.map((sign, i) => (
                                    <li
                                      key={i}
                                      className="text-sm text-green-700 flex items-start gap-2"
                                    >
                                      <span className="text-green-500 mt-1">
                                        •
                                      </span>
                                      {sign}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Red Flags */}
                              <div className="bg-red-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                  </svg>
                                  {t("plan.redFlags")}
                                </h4>
                                <ul className="space-y-1.5">
                                  {question.redFlags.map((flag, i) => (
                                    <li
                                      key={i}
                                      className="text-sm text-red-700 flex items-start gap-2"
                                    >
                                      <span className="text-red-500 mt-1">
                                        •
                                      </span>
                                      {flag}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          }
        )}
      </Section>

      {/* Scorecard */}
      <Section title={t("plan.scorecard.title")} className="mb-10">
        <Card variant="elevated" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    {t("plan.scorecard.category")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    {t("plan.scorecard.description")}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 w-32">
                    {t("plan.scorecard.maxScore")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plan.scorecard.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {item.label}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold">
                        {item.maxScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* Interviewer Notes */}
      <Section title={t("plan.notes.title")} className="mb-10">
        <Card variant="bordered" padding="lg" className="bg-amber-50 border-amber-200">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-amber-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-amber-800">{plan.interviewerNotesHint}</p>
          </div>
        </Card>
      </Section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 no-print">
        <Button variant="outline" onClick={startOver}>
          {t("plan.startOver")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.print();
            }
          }}
        >
          {t("plan.export")}
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mt-8 gap-2 no-print">
        <div className="w-3 h-3 rounded-full bg-primary-500" />
        <div className="w-3 h-3 rounded-full bg-primary-500" />
        <div className="w-3 h-3 rounded-full bg-primary-500" />
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <ProtectedRoute>
      <PlanPageContent />
    </ProtectedRoute>
  );
}



