import type { InterviewPlan } from "@/types";

// デモ用のインメモリストア（Supabase未設定時のみ使用）
// ※ サーバー再起動で消えます。サーバレス環境ではインスタンス跨ぎで共有されません。

export type DemoInterviewPlanRow = {
  id: string;
  user_id: string | null;
  language: "en" | "ja";
  role_title: string | null;
  created_at: string;
  plan: InterviewPlan;
};

export type DemoEvaluationRow = {
  id: string;
  user_id: string | null;
  language: "en" | "ja";
  role_title: string | null;
  candidate_name: string | null;
  decision: string | null;
  total_score: number | null;
  created_at: string;
  plan: InterviewPlan;
};

const INTERVIEW_PLANS: DemoInterviewPlanRow[] = [];
const EVALUATIONS: DemoEvaluationRow[] = [];

export function addInterviewPlan(row: DemoInterviewPlanRow) {
  INTERVIEW_PLANS.push(row);
}

export function listInterviewPlans(userId?: string | null) {
  if (!userId) return INTERVIEW_PLANS;
  return INTERVIEW_PLANS.filter((row) => row.user_id === userId);
}

export function addEvaluation(row: DemoEvaluationRow) {
  EVALUATIONS.push(row);
}

export function listEvaluations(userId?: string | null) {
  if (!userId) return EVALUATIONS;
  return EVALUATIONS.filter((row) => row.user_id === userId);
}

export function deleteEvaluation(id: string) {
  const idx = EVALUATIONS.findIndex((row) => row.id === id);
  if (idx === -1) return false;
  EVALUATIONS.splice(idx, 1);
  return true;
}

