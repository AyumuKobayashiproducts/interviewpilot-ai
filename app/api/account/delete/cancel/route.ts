import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Account deletion is not configured" },
        { status: 501 }
      );
    }

    const { accessToken } = await request.json();
    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 });
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentMetadata = (user.user_metadata || {}) as Record<string, unknown>;
    const nextMetadata = { ...currentMetadata };
    delete nextMetadata.deletion_requested_at;
    delete nextMetadata.deletion_scheduled_for;

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: nextMetadata }
    );

    if (updateError) {
      console.error("Cancel deletion error:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel account deletion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel deletion API error:", error);
    return NextResponse.json(
      { error: "Failed to cancel account deletion" },
      { status: 500 }
    );
  }
}

