import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { listInterviewPlans } from "@/lib/demo-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Supabase が設定されていればDBから取得、なければインメモリから取得
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error("Supabase client not available");
      }

      let query = client
        .from("interview_plans")
        .select("id, created_at, language, role_title, plan")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Supabase interview_plans list error:", error);
        return NextResponse.json(
          { error: "Failed to load interview plans" },
          { status: 500 }
        );
      }

      return NextResponse.json({ plans: data ?? [] });
    }

    const plans = listInterviewPlans(userId);
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("interview/list error:", error);
    return NextResponse.json(
      { error: "Failed to load interview plans" },
      { status: 500 }
    );
  }
}


