import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { publicEnv, serverEnv, supabaseConfig } from "@/lib/env";
import { sendPendingDigests } from "@/server/notifications";

// GET /api/cron/digest: the hourly round of "Nova atualização" e-mails, for the news that came
// inside a project's 2-hour window. Called by .github/workflows/digest.yml (any Vercel plan) or
// by Vercel Cron, both with "Authorization: Bearer $CRON_SECRET".

function authorized(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  const { CRON_SECRET } = serverEnv();
  if (!CRON_SECRET || !supabaseConfig) {
    return NextResponse.json(
      { error: { code: "unavailable", message: "Configure CRON_SECRET e o Supabase." } },
      { status: 503 },
    );
  }
  if (!authorized(request.headers.get("authorization"), CRON_SECRET)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Envie Authorization: Bearer CRON_SECRET." } },
      { status: 401 },
    );
  }
  const origin = publicEnv.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const sent = await sendPendingDigests(origin);
  return NextResponse.json({ sent });
}
