import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listInterviewPlans } from "@/lib/demo-store";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    // Supabase が設定されていればDBから取得、なければインメモリから取得
    if (!isSupabaseConfigured()) {
      const plans = listInterviewPlans(userIdParam);
      return NextResponse.json({ plans, reason: "not_configured" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { plans: [], error: "Server not configured" },
        { status: 501 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const bearer =
      authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : "";

    // 本人確認（token優先）。なければ userId クエリにフォールバック（デモ/互換用）。
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userId: string | null = null;
    if (bearer) {
      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.getUser(bearer);
      if (userError || !user) {
        return NextResponse.json({ plans: [], error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
    } else {
      userId = userIdParam;
    }

    if (!userId) {
      return NextResponse.json({ plans: [], error: "Missing user" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("interview_plans")
      .select("id, created_at, language, role_title, plan")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase interview_plans list error:", error);
      return NextResponse.json({ plans: [], error: "Failed to load interview plans" }, { status: 500 });
    }

    return NextResponse.json({ plans: data ?? [] });
  } catch (error) {
    console.error("interview/list error:", error);
    return NextResponse.json(
      { error: "Failed to load interview plans" },
      { status: 500 }
    );
  }
}


