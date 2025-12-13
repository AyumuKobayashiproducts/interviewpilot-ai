import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/utils";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { addInterviewPlan } from "@/lib/demo-store";
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
    const plan: InterviewPlan | undefined = body.plan;

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Missing interview plan" },
        { status: 400 }
      );
    }

    // Supabase が設定されていればDBに保存、なければメモリに保存
    if (isSupabaseConfigured()) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

      // RLS を回避するため admin で insert するが、accessToken で本人確認は行う
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

      let userId: string | null = null;
      if (accessToken) {
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
        userId = user.id;
      } else {
        // Supabase未設定デモ時の互換用。実運用では accessToken を送る。
        userId = userIdFromBody;
      }

      const { error } = await supabaseAdmin.from("interview_plans").insert({
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
      addInterviewPlan({
        id: generateId(),
        user_id: userIdFromBody,
        language,
        role_title: roleTitle,
        created_at: new Date().toISOString(),
        plan,
      });
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
