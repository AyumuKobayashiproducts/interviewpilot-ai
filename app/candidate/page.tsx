"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useI18n, Language } from "@/lib/i18n";
import { Button, TextArea, Card } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth";
import { RoleProfile, CandidateProfile } from "@/types";

const SAMPLE_CANDIDATE_EN = `Senior full-stack engineer with 7+ years of experience building B2B SaaS products.

Highlights:
- Led development of a multi-tenant dashboard used by 500+ enterprise customers
- Designed and implemented a role-based access control system
- Mentored a team of 3 engineers and improved review turnaround time by 30%

Key skills:
- React, TypeScript, Node.js, PostgreSQL, AWS
- System design, code review, technical leadership
- Working closely with product managers and designers`;

const SAMPLE_CANDIDATE_JA = `B2B SaaSプロダクトの開発経験を7年以上持つフルスタックエンジニア。

主な実績:
- 500社以上に利用される管理ダッシュボードの開発リード
- ロールベースアクセス制御（RBAC）の設計と実装を担当
- 3名のエンジニアのメンタリングとコードレビュー体制の改善を推進

主要スキル:
- React, TypeScript, Node.js, PostgreSQL, AWS
- システム設計、コードレビュー、技術的リーダーシップ
- プロダクトマネージャーやデザイナーとの協働`;

function CandidatePageContent() {
  const { t, language } = useI18n();
  const router = useRouter();

  const [candidateText, setCandidateText] = useState("");
  const [roleProfile, setRoleProfile] = useState<RoleProfile | null>(null);
  const [roleProfileLanguage, setRoleProfileLanguage] = useState<Language | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSampleLoading, setIsSampleLoading] = useState(false);
  const [isTranslatingRole, setIsTranslatingRole] = useState(false);
  const [error, setError] = useState("");
  
  // 初期化完了フラグ
  const isInitialized = useRef(false);
  // 前回の言語をトラック
  const prevLanguageRef = useRef<Language>(language);

  // 初回ロード：roleProfile を sessionStorage から取得
  useEffect(() => {
    const stored = sessionStorage.getItem("roleProfile");
    const storedLang = sessionStorage.getItem("roleProfileLanguage") as Language | null;
    if (stored) {
      const parsedProfile = JSON.parse(stored);
      setRoleProfile(parsedProfile);
      // 言語が保存されていない場合は、現在の言語をデフォルトとして使用（翻訳しない）
      setRoleProfileLanguage(storedLang || language);
      isInitialized.current = true;
    } else {
      router.push("/role");
    }
  }, [router]); // language を依存配列から外す

  // 言語トグルが切り替わったら、roleProfile を再生成して翻訳する
  useEffect(() => {
    // 初期化前は何もしない
    if (!isInitialized.current) return;
    if (!roleProfile || !roleProfileLanguage) return;
    if (!roleProfile.rawText) return;
    
    // 言語が実際に変わった場合のみ翻訳
    if (language === prevLanguageRef.current) return;
    prevLanguageRef.current = language;
    
    // 保存されている言語と現在の言語が同じなら翻訳不要
    if (language === roleProfileLanguage) return;

    let cancelled = false;

    const regenerateRoleProfile = async () => {
      setIsTranslatingRole(true);
      try {
        const response = await fetch("/api/role/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobDescription: roleProfile.rawText,
            language,
          }),
        });

        if (!response.ok) {
          throw new Error("Role profile regeneration failed");
        }

        const data = await response.json();
        if (cancelled) return;

        const newRoleProfile: RoleProfile = {
          ...data.roleProfile,
          title: data.roleProfile.title,
          level: roleProfile.level, // 元のレベルを維持
          rawText: roleProfile.rawText, // 元のテキストを維持
        };

        setRoleProfile(newRoleProfile);
        setRoleProfileLanguage(language);
        sessionStorage.setItem("roleProfile", JSON.stringify(newRoleProfile));
        sessionStorage.setItem("roleProfileLanguage", language);
      } catch (error) {
        console.error("Failed to regenerate role profile:", error);
      } finally {
        if (!cancelled) {
          setIsTranslatingRole(false);
        }
      }
    };

    regenerateRoleProfile();

    return () => {
      cancelled = true;
    };
  }, [language]); // roleProfile と roleProfileLanguage を依存配列から外す

  const handleUseSample = () => {
    if (candidateText.trim()) {
      const confirm = window.confirm(
        t("candidate.sample.confirmOverwrite")
      );
      if (!confirm) return;
    }
    const isJa = language === "ja";
    setIsSampleLoading(true);
    setError("");

    fetch("/api/candidate/sample", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch sample");
        }
        return res.json();
      })
      .then((data) => {
        const sampleText: string =
          data.candidateText ||
          (isJa ? SAMPLE_CANDIDATE_JA : SAMPLE_CANDIDATE_EN);
        setCandidateText(sampleText);
      })
      .catch(() => {
        // フォールバックとしてローカルのサンプルを使用
        setCandidateText(isJa ? SAMPLE_CANDIDATE_JA : SAMPLE_CANDIDATE_EN);
      })
      .finally(() => {
        setIsSampleLoading(false);
      });
  };

  const generatePlan = async (withCandidate: boolean) => {
    if (!roleProfile) return;

    setIsLoading(true);
    setError("");

    try {
      let candidateProfile: CandidateProfile | undefined;

      if (withCandidate && candidateText.trim()) {
        // First analyze the candidate
        const candidateResponse = await fetch("/api/candidate/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateText,
            language,
          }),
        });

        if (!candidateResponse.ok) {
          throw new Error("Candidate analysis failed");
        }

        const candidateData = await candidateResponse.json();
        candidateProfile = {
          ...candidateData.candidateProfile,
          rawText: candidateText,
        };
      }

      // Generate the interview plan
      const planResponse = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleProfile,
          candidateProfile,
          language,
        }),
      });

      if (!planResponse.ok) {
        throw new Error("Interview plan generation failed");
      }

      const planData = await planResponse.json();
      // 保存時に、どの言語で生成したプランかも一緒に記録しておく
      sessionStorage.setItem(
        "interviewPlan",
        JSON.stringify(planData.interviewPlan)
      );
      sessionStorage.setItem("interviewPlanLanguage", language);
      router.push("/plan");
    } catch (err) {
      setError(t("error.apiError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!roleProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {isTranslatingRole && (
        <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">
          {t("button.analyzing")}
        </div>
      )}
      <div className="mb-4 text-sm font-medium text-primary-700">
        {t("steps.candidate")}
      </div>
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          {t("candidate.heading")}
        </h1>
        <p className="text-lg text-slate-600">{t("candidate.subheading")}</p>
      </div>

      {/* Role Summary */}
      <Card variant="bordered" padding="md" className="mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
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
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {roleProfile.title || "Role"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {roleProfile.requiredSkills.slice(0, 4).join(", ")}
              {roleProfile.requiredSkills.length > 4 && "..."}
            </p>
          </div>
        </div>
      </Card>

      <Card variant="glass" padding="lg" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-slate-500">
            {t("candidate.tips.leadingText")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseSample}
            isLoading={isSampleLoading}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t("candidate.sample.button")}
          </Button>
        </div>

        <TextArea
          placeholder={t("candidate.placeholder")}
          value={candidateText}
          onChange={(e) => setCandidateText(e.target.value)}
          rows={10}
        />

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">
            {t("candidate.tips.title")}
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>{t("candidate.tips.point1")}</li>
            <li>{t("candidate.tips.point2")}</li>
            <li>{t("candidate.tips.point3")}</li>
          </ul>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => generatePlan(false)}
            isLoading={isLoading && !candidateText.trim()}
            disabled={isLoading || isTranslatingRole}
          >
            {t("candidate.skip")}
          </Button>
          <Button
            onClick={() => generatePlan(true)}
            isLoading={isLoading && candidateText.trim().length > 0}
            disabled={isLoading || !candidateText.trim() || isTranslatingRole}
          >
            {isLoading ? t("button.generating") : t("candidate.use")}
            {!isLoading && (
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            )}
          </Button>
        </div>
      </Card>

      {/* Progress indicator */}
      <div className="flex justify-center mt-8 gap-2">
        <div className="w-3 h-3 rounded-full bg-primary-500" />
        <div className="w-3 h-3 rounded-full bg-primary-500" />
        <div className="w-3 h-3 rounded-full bg-slate-300" />
      </div>
    </div>
  );
}

export default function CandidatePage() {
  return (
    <ProtectedRoute>
      <CandidatePageContent />
    </ProtectedRoute>
  );
}
