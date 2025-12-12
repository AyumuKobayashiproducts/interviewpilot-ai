import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listEvaluations } from "@/lib/demo-store";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get("userId");
      return NextResponse.json({
        evaluations: listEvaluations(userId),
        reason: "not_configured",
      });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ evaluations: [], reason: "missing_user_id" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("interview_evaluations")
      .select(
        "id, created_at, language, role_title, candidate_name, decision, total_score, plan"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch interview evaluations:", error);
      return NextResponse.json({ evaluations: [], reason: "db_error" });
    }

    return NextResponse.json({ evaluations: data || [] });
  } catch (error) {
    console.error("Interview evaluations list error:", error);
    return NextResponse.json({ evaluations: [], reason: "unexpected_error" });
  }
}



