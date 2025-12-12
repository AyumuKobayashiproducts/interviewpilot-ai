import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GRACE_PERIOD_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function sendAccountDeletionScheduledEmail(params: {
  to: string;
  scheduledForISO: string;
  requestedAtISO: string;
}): Promise<{ configured: boolean; sent: boolean }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.ACCOUNT_DELETION_FROM_EMAIL;
  const appName = process.env.ACCOUNT_DELETION_APP_NAME || "InterviewPilot AI";

  if (!resendApiKey || !from) return { configured: false, sent: false };

  const subject = `${appName}：アカウント削除の受付（${GRACE_PERIOD_DAYS}日後に削除）`;
  const html = `
<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.6; color: #1A1F36;">
  <p>${appName} のアカウント削除を受け付けました。</p>
  <p style="margin-top: 8px; color: #697386;">受付日時: ${params.requestedAtISO}</p>
  <p style="margin-top: 8px; color: #697386;">削除予定日時: ${params.scheduledForISO}</p>
  <p style="margin-top: 16px;">削除予定日までは、アカウント設定から削除予約を取り消すことができます。</p>
  <p style="margin-top: 16px;">この操作に心当たりがない場合は、至急サポートまでご連絡ください。</p>
</div>
  `.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend API error: ${res.status} ${text}`);
  }

  return { configured: true, sent: true };
}

async function sendAccountDeletedEmail(params: {
  to: string;
  deletedAtISO: string;
}): Promise<{ configured: boolean; sent: boolean }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.ACCOUNT_DELETION_FROM_EMAIL;
  const appName = process.env.ACCOUNT_DELETION_APP_NAME || "InterviewPilot AI";

  // Optional: only send if configured
  if (!resendApiKey || !from) return { configured: false, sent: false };

  const subject = `${appName}：アカウント削除が完了しました`;
  const html = `
<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.6; color: #1A1F36;">
  <p>${appName} のアカウント削除が完了しました。</p>
  <p style="margin-top: 8px; color: #697386;">削除日時: ${params.deletedAtISO}</p>
  <p style="margin-top: 16px;">この操作に心当たりがない場合は、至急サポートまでご連絡ください。</p>
</div>
  `.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend API error: ${res.status} ${text}`);
  }

  return { configured: true, sent: true };
}

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
      return NextResponse.json(
        { error: "Missing access token" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Schedule deletion instead of immediate hard delete (grace period).
    const requestedAtISO = new Date().toISOString();
    const scheduledForISO = addDays(new Date(), GRACE_PERIOD_DAYS).toISOString();

    const currentMetadata = (user.user_metadata || {}) as Record<string, unknown>;
    const nextMetadata = {
      ...currentMetadata,
      deletion_requested_at: requestedAtISO,
      deletion_scheduled_for: scheduledForISO,
    };

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: nextMetadata }
    );

    if (updateError) {
      console.error("Schedule deletion error:", updateError);
      return NextResponse.json(
        { error: "Failed to schedule account deletion" },
        { status: 500 }
      );
    }

    const emailResult = {
      configured: Boolean(process.env.RESEND_API_KEY && process.env.ACCOUNT_DELETION_FROM_EMAIL),
      sent: false,
    };

    // Send scheduling email (optional)
    if (user.email) {
      try {
        const r = await sendAccountDeletionScheduledEmail({
          to: user.email,
          requestedAtISO,
          scheduledForISO,
        });
        emailResult.configured = r.configured;
        emailResult.sent = r.sent;
      } catch (emailError) {
        // Scheduling is already recorded. Don't fail the request for email issues.
        console.error("Account deletion scheduling email failed:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      scheduledFor: scheduledForISO,
      gracePeriodDays: GRACE_PERIOD_DAYS,
      email: emailResult,
    });
  } catch (error) {
    console.error("Account delete API error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}













