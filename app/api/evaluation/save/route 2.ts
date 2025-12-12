import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("Supabase not configured for saving interview evaluations");
      return NextResponse.json({ success: false, reason: "not_configured" });
    }

    const body = await request.json();
    const {
      userId,
      language,
      roleTitle,
      candidateName,
      decision,
      totalScore,
      notes,
      plan,
    } = body;

    if (!userId || !plan) {
      return NextResponse.json({ success: false, reason: "missing_data" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.from("interview_evaluations").insert({
      user_id: userId,
      language: language || "en",
      role_title: roleTitle ?? null,
      candidate_name: candidateName ?? null,
      decision: decision ?? null,
      total_score: typeof totalScore === "number" ? totalScore : null,
      notes: notes ?? null,
      plan,
    });

    if (error) {
      console.error("Failed to save interview evaluation:", error);
      return NextResponse.json({
        success: false,
        reason: "db_error",
        error: error.message,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Interview evaluation save error:", error);
    return NextResponse.json({ success: false, reason: "unexpected_error" });
  }
}
