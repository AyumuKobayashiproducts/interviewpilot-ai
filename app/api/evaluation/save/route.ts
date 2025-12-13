import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/utils";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { addEvaluation } from "@/lib/demo-store";
import type { InterviewPlan } from "@/types";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const authHeader = request.headers.get("authorization") || "";
    const bearer =
      authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : "";
    const accessToken: string | null = bearer || body.accessToken ?? null;
    const userIdFromBody: string | null = body.userId ?? null;
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
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

      if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json(
          {
            success: false,
            error:
              "サーバー側の保存設定（SUPABASE_SERVICE_ROLE_KEY）が未設定です。",
          },
          { status: 501 }
        );
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      if (!accessToken) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (userError || !user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const userId = user.id;
      if (userIdFromBody && userIdFromBody !== userId) {
        return NextResponse.json(
          { success: false, error: "User mismatch" },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin.from("interview_evaluations").insert({
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
        user_id: userIdFromBody,
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
