import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/utils";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { addEvaluation } from "@/lib/demo-store";
import type { InterviewPlan } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId: string | null = body.userId ?? null;
    const language: "en" | "ja" = body.language === "ja" ? "ja" : "en";
    const roleTitle: string | null = body.roleTitle ?? null;
    const candidateName: string | null = body.candidateName ?? null;
    const decision: string | null = body.decision ?? null;
    const totalScore: number | null =
      typeof body.totalScore === "number" ? body.totalScore : null;
    const plan: InterviewPlan | undefined = body.plan;

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Missing plan in evaluation" },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error("Supabase client not available");
      }

      const { error } = await client.from("interview_evaluations").insert({
        id: generateId(),
        user_id: userId,
        language,
        role_title: roleTitle,
        candidate_name: candidateName,
        decision,
        total_score: totalScore,
        plan,
      });

      if (error) {
        console.error("Supabase evaluations insert error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to save evaluation" },
          { status: 500 }
        );
      }
    } else {
      addEvaluation({
        id: generateId(),
        user_id: userId,
        language,
        role_title: roleTitle,
        candidate_name: candidateName,
        decision,
        total_score: totalScore,
        created_at: new Date().toISOString(),
        plan,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("evaluation/save error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save evaluation" },
      { status: 500 }
    );
  }
}
