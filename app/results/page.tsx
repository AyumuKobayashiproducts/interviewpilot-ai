"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button, Card } from "@/components/ui";
import type { InterviewPlan } from "@/types";

interface EvaluationRow {
  id: string;
  created_at: string;
  language: "en" | "ja";
  role_title: string | null;
  candidate_name: string | null;
  decision: string | null;
  total_score: number | null;
  plan: InterviewPlan;
}

type SortKey = "created_at" | "total_score";
type SortDirection = "desc" | "asc";

export default function ResultsPage() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [decisionFilter, setDecisionFilter] =
    useState<"all" | "strong_yes_yes">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isRanking, setIsRanking] = useState(false);
  const [aiRankings, setAiRankings] = useState<
    Record<string, { rank: number; reason: string }>
  >({});
  const [rankingError, setRankingError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchEvaluations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/evaluation/list?userId=${encodeURIComponent(user.id)}`
        );
        if (res.ok) {
          const data = await res.json();
          setEvaluations(data.evaluations || []);
        }
      } catch (error) {
        console.error("Failed to load evaluations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [user]);

  const roleOptions = useMemo(() => {
    const titles = new Set<string>();
    evaluations.forEach((e) => {
      if (e.role_title) titles.add(e.role_title);
    });
    return Array.from(titles).sort();
  }, [evaluations]);

  const filtered = useMemo(() => {
    let base = evaluations;
    if (selectedRole) {
      base = base.filter((e) => e.role_title === selectedRole);
    }

    if (decisionFilter === "strong_yes_yes") {
      base = base.filter((e) => {
        const d = (e.decision || "").toLowerCase();
        return d === "strong_yes" || d === "strong yes" || d === "yes";
      });
    }

    return base;
  }, [evaluations, selectedRole, decisionFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: number;
      let bv: number;
      if (sortKey === "total_score") {
        av = a.total_score ?? -Infinity;
        bv = b.total_score ?? -Infinity;
      } else {
        av = new Date(a.created_at).getTime();
        bv = new Date(b.created_at).getTime();
      }
      if (av === bv) return 0;
      const base = av < bv ? -1 : 1;
      return sortDirection === "asc" ? base : -base;
    });
    return arr;
  }, [filtered, sortKey, sortDirection]);

  const displayRows = useMemo(() => {
    if (!aiRankings || Object.keys(aiRankings).length === 0) {
      return sorted;
    }
    const arr = [...filtered];
    arr.sort((a, b) => {
      const ra = aiRankings[a.id]?.rank ?? Number.MAX_SAFE_INTEGER;
      const rb = aiRankings[b.id]?.rank ?? Number.MAX_SAFE_INTEGER;
      if (ra === rb) return 0;
      return ra < rb ? -1 : 1;
    });
    return arr;
  }, [filtered, sorted, aiRankings]);

  const aiRankingList = useMemo(() => {
    if (!aiRankings || Object.keys(aiRankings).length === 0) return [];
    const withRank = filtered
      .map((row) => {
        const info = aiRankings[row.id];
        if (!info) return null;
        return { row, rank: info.rank, reason: info.reason };
      })
      .filter(Boolean) as { row: EvaluationRow; rank: number; reason: string }[];
    withRank.sort((a, b) => a.rank - b.rank);
    return withRank;
  }, [filtered, aiRankings]);

  const getDecisionBadgeClasses = (decision: string | null) => {
    const d = (decision || "").toLowerCase();
    if (!d) return "inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-600";
    if (d === "strong yes" || d === "strong_yes") {
      return "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800";
    }
    if (d === "yes") {
      return "inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-800";
    }
    if (d === "maybe") {
      return "inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700";
    }
    if (d === "no") {
      return "inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] text-red-800";
    }
    return "inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-600";
  };

  const openPlan = (plan: InterviewPlan) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("interviewPlan", JSON.stringify(plan));
    sessionStorage.setItem("interviewPlanLanguage", plan.language);
    router.push("/plan");
  };

  const handleDelete = async (id: string) => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "この評価を削除しますか？この操作は元に戻せません。"
      );
      if (!ok) return;
    }

    setDeletingId(id);
    try {
      const res = await fetch("/api/evaluation/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        console.error("Failed to delete evaluation:", data);
        return;
      }
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete evaluation:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAiRanking = async () => {
    if (!filtered.length) return;
    setIsRanking(true);
    setRankingError(null);
    try {
      const res = await fetch("/api/evaluation/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          evaluations: filtered.map((e) => ({
            id: e.id,
            created_at: e.created_at,
            language: e.language,
            role_title: e.role_title,
            candidate_name: e.candidate_name,
            decision: e.decision,
            total_score: e.total_score,
          })),
        }),
      });
      if (!res.ok) {
        throw new Error("AI ranking request failed");
      }
      const data = await res.json();
      const next: Record<string, { rank: number; reason: string }> = {};
      (data.rankings || []).forEach(
        (item: { id: string; rank: number; reason: string }) => {
          if (!item || !item.id) return;
          next[item.id] = {
            rank: item.rank,
            reason: item.reason,
          };
        }
      );
      setAiRankings(next);
    } catch (error) {
      console.error("AI ranking error:", error);
      setRankingError(
        "AIによる順位付けに失敗しました。しばらくしてからもう一度お試しください。"
      );
    } finally {
      setIsRanking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            候補者比較
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            同じポジションの候補者を横並びで比較できます。Strong Yes / Yes / Maybe / No とスコアを見ながら、誰にオファーするかを決めるための画面です。
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push("/role")}
        >
          {t("plan.startOver")}
        </Button>
      </div>

      {/* Filters & controls */}
      <Card
        padding="md"
        className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              職種で絞り込み
            </span>
            <select
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">
                すべての職種
              </option>
              {roleOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              ソート
            </span>
            <select
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="created_at">
                作成日時
              </option>
              <option value="total_score">
                スコア
              </option>
            </select>
            <select
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
              value={sortDirection}
              onChange={(e) =>
                setSortDirection(e.target.value as SortDirection)
              }
            >
              <option value="desc">
                降順
              </option>
              <option value="asc">
                昇順
              </option>
            </select>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAiRanking}
              isLoading={isRanking}
              disabled={isLoading || !filtered.length}
            >
              AIでおすすめ順を見る
            </Button>
          </div>
          <div className="text-[11px] text-gray-500">
            件数: {filtered.length}
            {aiRankings && Object.keys(aiRankings).length > 0 && (
              <span className="ml-2 text-[11px] text-emerald-600">
                AIによるおすすめ順を表示中
              </span>
            )}
          </div>
        </div>
      </Card>

      {rankingError && (
        <div className="mb-3 text-xs text-red-600">{rankingError}</div>
      )}

      {/* Decision filter pill */}
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() =>
            setDecisionFilter((prev) =>
              prev === "strong_yes_yes" ? "all" : "strong_yes_yes"
            )
          }
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] ${
            decisionFilter === "strong_yes_yes"
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>
            Strong Yes / Yes のみ
          </span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card padding="lg" className="text-center text-sm text-gray-600">
          まだ評価が登録されていません。まずは1件、面接プランを作成して /plan 画面から評価を保存すると、ここに候補者が並び始めます。
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,2.2fr)_minmax(260px,1fr)] gap-4 items-start">
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    職種
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    候補者名
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                    スコア
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    判断
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    作成日時
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayRows.map((row) => {
                  const aiRank = aiRankings[row.id]?.rank;
                  const highlightClass =
                    aiRank === 1
                      ? "border-l-2 border-l-emerald-500"
                      : aiRank === 2
                      ? "border-l-2 border-l-blue-500"
                      : aiRank === 3
                      ? "border-l-2 border-l-slate-400"
                      : "border-l border-l-transparent";

                  return (
                  <tr key={row.id} className={`hover:bg-gray-50 ${highlightClass}`}>
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      {row.role_title || "無題の職種"}
                    </td>
                    <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                      <div>
                        {row.candidate_name || "(未入力)"}
                      </div>
                      {aiRankings[row.id] && (
                        <div className="mt-0.5 text-[11px] text-gray-500 max-w-xs">
                          AIおすすめ順位 {aiRankings[row.id].rank}位: {aiRankings[row.id].reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900">
                      {row.total_score ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                      <span className={getDecisionBadgeClasses(row.decision)}>
                        {row.decision || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPlan(row.plan)}
                        >
                          プランを開く
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          isLoading={deletingId === row.id}
                          onClick={() => handleDelete(row.id)}
                        >
                          削除
                        </Button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </Card>

        {aiRankingList.length > 0 && (
          <Card
            padding="md"
            className="border border-emerald-100 bg-emerald-50/60 lg:sticky lg:top-16"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-emerald-800">
                  AIおすすめ順位
                </p>
                <p className="text-[11px] text-emerald-800/80">
                  上位候補の理由を簡潔にまとめています。
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] text-emerald-800">
                プレビュー
              </span>
            </div>
            <ol className="space-y-2 text-xs">
              {aiRankingList.slice(0, 5).map(({ row, rank, reason }) => (
                <li
                  key={row.id}
                  className="rounded-md bg-white/90 border border-emerald-100 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-800">
                        {rank}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-900">
                          {row.candidate_name || "(名前未入力)"}
                        </p>
                        {row.role_title && (
                          <p className="truncate text-[10px] text-slate-500">
                            {row.role_title}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={getDecisionBadgeClasses(row.decision)}>
                      {row.decision || "-"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    {reason}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    スコア {row.total_score ?? "-"} · {new Date(row.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[10px] text-emerald-800/70">
              AIはあくまで判断材料の整理を行います。最終判断はチームで行ってください。
            </p>
          </Card>
        )}
        </div>
      )}
    </div>
  );
}


