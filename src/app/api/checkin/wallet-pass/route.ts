import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCheckinContext } from "@/lib/checkin";
import {
  buildPassPayload,
  generateApplePass,
  isAppleWalletConfigured,
  isGoogleWalletConfigured,
} from "@/lib/wallet-pass";
import { logger } from "@/lib/logger";

// GET /api/checkin/wallet-pass?t=<tid>&team=<teamId>&platform=apple|google
//
// Returns a signed .pkpass binary (Apple) or a Google Wallet
// "save link" JSON (Google). When the matching wallet provider isn't
// configured, returns a 503 with helpful copy so the UI can render
// "configure wallet integration" instead of a hard error.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = Number(session?.user?.id);
  if (!session?.user || !role || !Number.isFinite(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const tournamentId = Number(sp.get("t"));
  const teamId = Number(sp.get("team"));
  const platform = sp.get("platform") === "google" ? "google" : "apple";
  if (!Number.isFinite(tournamentId) || !Number.isFinite(teamId)) {
    return NextResponse.json({ error: "t + team required" }, { status: 400 });
  }

  const ctx = await resolveCheckinContext({ tournamentId, teamId, userId, role });
  if (!ctx.ok) return NextResponse.json({ error: ctx.reason }, { status: 403 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.inspirecourtsaz.com";
  const qrUrl = `${origin}/checkin?t=${tournamentId}&team=${teamId}`;
  const payload = buildPassPayload({
    team: ctx.team,
    tournament: ctx.tournament,
    qrUrl,
  });

  if (platform === "apple") {
    if (!isAppleWalletConfigured()) {
      return NextResponse.json(
        {
          error: "apple_wallet_not_configured",
          message:
            "Apple Wallet not yet enabled. Set APPLE_PASS_TYPE_IDENTIFIER, APPLE_PASS_TEAM_IDENTIFIER, APPLE_PASS_CERT_BASE64, APPLE_PASS_CERT_PASSWORD, APPLE_WWDR_BASE64.",
          payloadPreview: payload,
        },
        { status: 503 },
      );
    }
    try {
      const buf = await generateApplePass(payload);
      // Copy into a fresh Uint8Array backed by a plain ArrayBuffer
      // (Node's Buffer can be backed by SharedArrayBuffer which the
      // Blob/BodyInit type doesn't accept).
      const arr = new Uint8Array(buf.byteLength);
      arr.set(buf);
      const blob = new Blob([arr], { type: "application/vnd.apple.pkpass" });
      return new NextResponse(blob, {
        headers: {
          "Content-Type": "application/vnd.apple.pkpass",
          "Content-Disposition": `attachment; filename="${ctx.team.name.replace(/[^a-z0-9]+/gi, "-")}-${tournamentId}.pkpass"`,
          "Cache-Control": "private, no-store",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("apple pass generation failed", { err: message });
      const hint =
        message === "PASSKIT_PACKAGE_MISSING"
          ? "Install the passkit-generator npm package + drop a wallet-pass template under /public/wallet-pass/template.pass."
          : "Pass signing failed — verify cert env vars are correct.";
      return NextResponse.json(
        { error: message, message: hint, payloadPreview: payload },
        { status: 503 },
      );
    }
  }

  // Google Wallet — returns a save URL the user opens to add the
  // pass. Real impl needs a JWT signed with the Google Wallet
  // service-account key. We surface a 503 with payload preview when
  // env isn't configured; clients can still render the QR fallback.
  if (!isGoogleWalletConfigured()) {
    return NextResponse.json(
      {
        error: "google_wallet_not_configured",
        message:
          "Google Wallet not yet enabled. Set GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL, GOOGLE_WALLET_PRIVATE_KEY.",
        payloadPreview: payload,
      },
      { status: 503 },
    );
  }
  // Proper JWT signing TODO — for now emit a placeholder response
  // when configured so admin can verify env vars are detected.
  return NextResponse.json({
    saveUrl: `https://pay.google.com/gp/v/save/PLACEHOLDER`,
    payloadPreview: payload,
    note: "Google Wallet JWT signer not yet implemented; returning placeholder.",
  });
}
