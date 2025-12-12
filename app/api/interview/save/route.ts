import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/utils";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { InterviewPlan } from "@/types";

type StoredInterviewPlan = {
  id: string;
  userId: string | null;
  language: "en" | "ja";
  role_title: string | null;
  created_at: string;
  plan: InterviewPlan;
};

// 簡易的なインメモリ保存（Supabase未設定時のデモ用）。サーバー再起動で消えます。
const INTERVIEW_PLANS: StoredInterviewPlan[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId: string | null = body.userId ?? null;
    const language: "en" | "ja" = body.language === "ja" ? "ja" : "en";
    const roleTitle: string | null = body.roleTitle ?? null;
    const plan: InterviewPlan | undefined = body.plan;

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Missing interview plan" },
        { status: 400 }
      );
    }

    // Supabase が設定されていればDBに保存、なければメモリに保存
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error("Supabase client not available");
      }

      const { error } = await client.from("interview_plans").insert({
        id: generateId(),
        user_id: userId,
        language,
        role_title: roleTitle,
        plan,
      });

      if (error) {
        console.error("Supabase interview_plans insert error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to save interview plan" },
          { status: 500 }
        );
      }
    } else {
      const row: StoredInterviewPlan = {
        id: generateId(),
        userId,
        language,
        role_title: roleTitle,
        created_at: new Date().toISOString(),
        plan,
      };

      INTERVIEW_PLANS.push(row);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("interview/save error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save interview plan" },
      { status: 500 }
    );
  }
}

// 内部から参照できるようにエクスポート
export function listInterviewPlans(userId?: string | null) {
  if (isSupabaseConfigured()) {
    // Supabase利用時はAPIルート内からのみ直接クエリする想定なので、
    // ここではインメモリ分のみを返す（フォールバック専用）。
    if (!userId) return INTERVIEW_PLANS;
    return INTERVIEW_PLANS.filter((row) => row.userId === userId);
  }

  if (!userId) return INTERVIEW_PLANS;
  return INTERVIEW_PLANS.filter((row) => row.userId === userId);
}


