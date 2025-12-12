import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/utils";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { addInterviewPlan } from "@/lib/demo-store";
import type { InterviewPlan } from "@/types";

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
      addInterviewPlan({
        id: generateId(),
        user_id: userId,
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
