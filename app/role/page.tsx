"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button, TextArea, Card, Input, Select } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth";
import { RoleProfile, RoleLevel } from "@/types";

const SAMPLE_JD_EN = `Senior Software Engineer (Full Stack)

We are looking for a Senior Software Engineer to help design, build, and scale our B2B SaaS platform.

Responsibilities:
- Design and implement end-to-end features across frontend (React/TypeScript) and backend (Node.js)
- Collaborate with product and design to shape requirements
- Review code and mentor mid/junior engineers
- Improve performance, reliability, and developer experience

Requirements:
- 5+ years of experience in web application development
- Strong experience with React, TypeScript, and Node.js
- Experience with relational databases (PostgreSQL or similar)
- Experience with cloud platforms (AWS, GCP, or Azure)
- Strong communication skills and ability to work with non-technical stakeholders

Nice to have:
- Experience with system design at scale
- Experience with hiring or interviewing engineers
- Experience with CI/CD and observability tools`;

const SAMPLE_JD_JA = `シニアソフトウェアエンジニア（フルスタック）

自社B2B SaaSプロダクトの設計・開発・改善をリードできるシニアエンジニアを募集します。

主な業務内容:
- フロントエンド（React/TypeScript）およびバックエンド（Node.js）の機能設計・実装
- プロダクトマネージャーやデザイナーと連携した要件定義
- コードレビューおよびメンバーへの技術的なメンタリング
- パフォーマンス、信頼性、開発体験の継続的な改善

必須スキル・経験:
- Webアプリケーション開発の実務経験5年以上
- React・TypeScript・Node.js を用いた開発経験
- PostgreSQLなどのRDBMSの利用経験
- AWS / GCP / Azure などクラウド環境での開発経験
- 非エンジニアを含むメンバーとのコミュニケーション能力

歓迎スキル・経験:
- 大規模システムのアーキテクチャ設計経験
- エンジニア採用や面接の経験
- CI/CDやモニタリング基盤の構築経験`;

function RolePageContent() {
  const { t, language } = useI18n();
  const router = useRouter();

  const [jobDescription, setJobDescription] = useState("");
  const [hiringPreferences, setHiringPreferences] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [level, setLevel] = useState<RoleLevel>("unspecified");
  const [isLoading, setIsLoading] = useState(false);
  const [isSampleLoading, setIsSampleLoading] = useState(false);
  const [error, setError] = useState("");

  const levelOptions = [
    { value: "unspecified", label: t("role.level.unspecified") },
    { value: "junior", label: t("role.level.junior") },
    { value: "mid", label: t("role.level.mid") },
    { value: "senior", label: t("role.level.senior") },
    { value: "lead", label: t("role.level.lead") },
  ];

  const handleUseSample = () => {
    if (jobDescription.trim()) {
      const shouldOverwrite = window.confirm(t("role.sample.confirmOverwrite"));
      if (!shouldOverwrite) return;
    }

    const isJa = language === "ja";
    setIsSampleLoading(true);
    setError("");

    fetch("/api/role/sample", {
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
          data.jobDescription || (isJa ? SAMPLE_JD_JA : SAMPLE_JD_EN);
        const sampleTitle: string =
          data.title ||
          (isJa ? "シニアソフトウェアエンジニア" : "Senior Software Engineer");
        const sampleLevel: RoleLevel =
          data.level && ["junior", "mid", "senior", "lead", "unspecified"].includes(data.level)
            ? data.level
            : "senior";

        setJobDescription(sampleText);
        setHiringPreferences(
          isJa
            ? `【採用したい人物像 / 重視する点】\n- スピードよりも品質と保守性を優先できる\n- 要件の曖昧さを言語化し、関係者と合意形成できる\n- 既存コードを読み解いて段階的に改善できる\n\n【NG】\n- レビューで指摘されると反発する\n- 仕様の背景を理解せずに実装だけを急ぐ`
            : `Ideal candidate / priorities:\n- Prioritizes maintainability and quality over speed\n- Can clarify ambiguous requirements and align stakeholders\n- Improves legacy code incrementally\n\nRed flags:\n- Defensive during reviews\n- Ships without understanding the rationale`
        );
        setRoleTitle(sampleTitle);
        setLevel(sampleLevel);
      })
      .catch(() => {
        // フォールバックとしてローカルのサンプルを使用
        setJobDescription(isJa ? SAMPLE_JD_JA : SAMPLE_JD_EN);
        setHiringPreferences(
          isJa
            ? `【採用したい人物像 / 重視する点】\n- スピードよりも品質と保守性を優先できる\n- 要件の曖昧さを言語化し、関係者と合意形成できる\n\n【NG】\n- レビューで指摘されると反発する`
            : `Ideal candidate / priorities:\n- Prioritizes maintainability and quality over speed\n- Can clarify ambiguous requirements and align stakeholders`
        );
        setRoleTitle(
          isJa ? "シニアソフトウェアエンジニア" : "Senior Software Engineer"
        );
        setLevel("senior");
      })
      .finally(() => {
        setIsSampleLoading(false);
      });
  };

  const handleSubmit = async () => {
    if (!jobDescription.trim()) {
      setError(t("error.emptyJobDescription"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const combinedText = [
        jobDescription.trim(),
        hiringPreferences.trim()
          ? `\n\n# 採用したい人物像・重視する点（任意）\n${hiringPreferences.trim()}`
          : "",
      ].join("");

      const response = await fetch("/api/role/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          hiringPreferences: hiringPreferences.trim() || undefined,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("API error");
      }

      const data = await response.json();
      const roleProfile: RoleProfile = {
        ...data.roleProfile,
        title: roleTitle || data.roleProfile.title,
        level: level !== "unspecified" ? level : data.roleProfile.level,
        hiringPreferences: hiringPreferences.trim() ? hiringPreferences.trim() : undefined,
        rawText: combinedText,
      };

      // Store in sessionStorage for the next page
      sessionStorage.setItem("roleProfile", JSON.stringify(roleProfile));
      sessionStorage.setItem("roleProfileLanguage", language);
      router.push("/candidate");
    } catch (err) {
      setError(t("error.apiError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-4 text-sm font-medium text-primary-700">
        {t("steps.role")}
      </div>
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          {t("role.heading")}
        </h1>
        <p className="text-lg text-slate-600">{t("role.subheading")}</p>
      </div>

      <Card padding="lg" className="bg-white/80 backdrop-blur-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-slate-500">
            {t("role.tips.leadingText")}
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
            {t("role.sample.button")}
          </Button>
        </div>

        <TextArea
          label={t("role.jobDescription.label")}
          placeholder={t("role.placeholder")}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={12}
          error={error && !jobDescription.trim() ? error : undefined}
        />

        <TextArea
          label={t("role.preferences.label")}
          placeholder={t("role.preferences.placeholder")}
          value={hiringPreferences}
          onChange={(e) => setHiringPreferences(e.target.value)}
          rows={6}
        />
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setHiringPreferences((prev) => {
                if (prev.trim()) return prev;
                return `【採用したい人物像 / 重視する点】\n- 入社後90日で期待する成果\n- 重要視する経験（例：リファクタリング、移行、運用改善）\n- 仕事の進め方（例：合意形成、ドキュメント、レビュー文化）\n\n【NG】\n- レビューで指摘されると反発する\n- 仕様の背景を理解せずに実装だけを急ぐ`;
              });
            }}
          >
            テンプレを挿入
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHiringPreferences("")}
            disabled={!hiringPreferences.trim()}
          >
            クリア
          </Button>
          <span className="text-xs text-slate-500">
            ここに書いた内容が、評価観点と質問設計に反映されます。
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label={t("role.title.label")}
            placeholder={t("role.title.placeholder")}
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
          />
          <Select
            label={t("role.level.label")}
            options={levelOptions}
            value={level}
            onChange={(e) => setLevel(e.target.value as RoleLevel)}
          />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">
            {t("role.tips.title")}
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>{t("role.tips.point1")}</li>
            <li>{t("role.tips.point2")}</li>
            <li>{t("role.tips.point3")}</li>
          </ul>
        </div>

        {error && jobDescription.trim() && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!jobDescription.trim()}
            size="lg"
          >
            {isLoading ? t("button.analyzing") : t("button.next")}
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
        <div className="w-3 h-3 rounded-full bg-slate-300" />
        <div className="w-3 h-3 rounded-full bg-slate-300" />
      </div>
    </div>
  );
}

export default function RolePage() {
  return (
    <ProtectedRoute>
      <RolePageContent />
    </ProtectedRoute>
  );
}
