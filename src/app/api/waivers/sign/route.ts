import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waivers } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { waiverSignSchema } from "@/lib/schemas";
import { parseJsonBody, apiError } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

// Public waiver signing endpoint (no auth). Stamped with IP + UA
// from the request, which is the whole point for liability evidence.
// Rate-limited aggressively so a scripted abuser can't flood the
// waivers table with junk signatures.
export const POST = withTiming("public.waivers.sign", async (request: NextRequest) => {
  const ip = getClientIp(request);
  if (isRateLimited(`public-waiver:${ip}`, 10, 60 * 60_000)) {
    return apiError("Too many signature submissions. Try again in an hour.", 429, {
      headers: { "Retry-After": "3600" },
    });
  }

  const parsed = await parseJsonBody(request, waiverSignSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const ua = request.headers.get("user-agent")?.slice(0, 500) ?? null;
    const expiresAt =
      b.expiresAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const [created] = await db
      .insert(waivers)
      .values({
        playerName: b.playerName,
        parentName: b.parentName ?? null,
        teamName: b.teamName ?? null,
        email: b.email ? b.email.toLowerCase() : null,
        phone: b.phone ?? null,
        signatureDataUrl: b.signatureDataUrl,
        signedByName: b.signedByName,
        waiverType: b.waiverType ?? "general",
        programId: b.programId ?? null,
        memberId: b.memberId ?? null,
        waiverVersion: b.waiverVersion ?? "v1",
        expiresAt,
        signedUserAgent: ua,
        signedIp: ip,
      })
      .returning({
        id: waivers.id,
        playerName: waivers.playerName,
        signedAt: waivers.signedAt,
        expiresAt: waivers.expiresAt,
      });
    // Flip players.waiver_on_file for matching roster rows.
    const { syncWaiverToPlayers } = await import("@/lib/waiver-sync");
    syncWaiverToPlayers(created.playerName).catch(() => {});
    return NextResponse.json(
      { ok: true, waiverId: created.id, signedAt: created.signedAt, expiresAt: created.expiresAt },
      { status: 201 }
    );
  } catch (err) {
    logger.error("Public waiver sign failed", { error: String(err) });
    return apiError("Failed to save waiver", 500);
  }
});
