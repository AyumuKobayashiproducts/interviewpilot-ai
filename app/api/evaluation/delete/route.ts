import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteEvaluation } from "@/lib/demo-store";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, reason: "missing_id" },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      const ok = deleteEvaluation(id);
      return NextResponse.json({ success: ok, reason: "not_configured" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("interview_evaluations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete interview evaluation:", error);
      return NextResponse.json(
        { success: false, reason: "db_error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Interview evaluation delete error:", error);
    return NextResponse.json(
      { success: false, reason: "unexpected_error" },
      { status: 500 }
    );
  }
}


