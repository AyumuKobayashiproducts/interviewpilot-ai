import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PER_PAGE = 1000;
const GRACE_PERIOD_DAYS = 30;

async function sendAccountDeletedEmail(params: {
  to: string;
  deletedAtISO: string;
}): Promise<{ configured: boolean; sent: boolean }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.ACCOUNT_DELETION_FROM_EMAIL;
  const appName = process.env.ACCOUNT_DELETION_APP_NAME || "InterviewPilot AI";

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

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.ACCOUNT_DELETION_CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("x-cron-secret") || "";
  const urlSecret = new URL(request.url).searchParams.get("secret") || "";
  return header === expected || urlSecret === expected;
}

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const cronSecret = process.env.ACCOUNT_DELETION_CRON_SECRET;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Account deletion is not configured" },
        { status: 501 }
      );
    }
    if (!cronSecret) {
      return NextResponse.json(
        { error: "Finalize endpoint is not configured" },
        { status: 501 }
      );
    }
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = Date.now();
    let page = 1;
    let scannedUsers = 0;
    let dueUsers = 0;
    let deletedUsers = 0;
    let emailSent = 0;
    const errors: Array<{ userId?: string; step: string; error: string }> = [];

    // NOTE: Supabase Auth does not provide server-side filtering by user_metadata,
    // so we page through users and select due accounts in code.
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: PER_PAGE,
      });

      if (error) {
        console.error("listUsers error:", error);
        return NextResponse.json(
          { error: "Failed to list users" },
          { status: 500 }
        );
      }

      const users = data?.users || [];
      scannedUsers += users.length;

      for (const u of users) {
        const scheduledFor = u.user_metadata?.deletion_scheduled_for;
        const requestedAt = u.user_metadata?.deletion_requested_at;
        if (typeof scheduledFor !== "string" || typeof requestedAt !== "string") continue;

        const scheduledTs = Date.parse(scheduledFor);
        if (!Number.isFinite(scheduledTs) || scheduledTs > now) continue;

        dueUsers += 1;
        const email = u.email || undefined;
        const userId = u.id;

        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (delErr) {
          console.error("deleteUser error:", delErr);
          errors.push({ userId, step: "deleteUser", error: String(delErr?.message || delErr) });
          continue;
        }

        deletedUsers += 1;

        if (email) {
          try {
            const r = await sendAccountDeletedEmail({
              to: email,
              deletedAtISO: new Date().toISOString(),
            });
            if (r.configured && r.sent) emailSent += 1;
          } catch (e) {
            console.error("finalize email failed:", e);
            errors.push({ userId, step: "sendEmail", error: String(e) });
          }
        }
      }

      if (users.length < PER_PAGE) break;
      page += 1;
    }

    return NextResponse.json({
      success: true,
      gracePeriodDays: GRACE_PERIOD_DAYS,
      scannedUsers,
      dueUsers,
      deletedUsers,
      emailSent,
      errors,
    });
  } catch (error) {
    console.error("Finalize deletion API error:", error);
    return NextResponse.json(
      { error: "Failed to finalize account deletions" },
      { status: 500 }
    );
  }
}

