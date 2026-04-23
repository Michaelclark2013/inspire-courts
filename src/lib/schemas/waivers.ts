// Waiver signing schema. Kept separate from the rest of schemas.ts
// because waiver rules are legally sensitive and deserve their own audit
// surface — length caps on the base64 signature prevent DoS via oversized
// payloads.

import { z } from "zod";

export const waiverSignSchema = z.object({
  playerName: z.string().min(1).max(200),
  parentName: z.string().max(200).optional().nullable(),
  teamName: z.string().max(200).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  // data-URL signature (PNG base64). Capped at ~500KB so a rogue
  // client can't upload 10MB of trash inside the signature blob.
  signatureDataUrl: z.string().startsWith("data:image/").max(500_000),
  signedByName: z.string().min(1).max(200),
  waiverType: z.enum(["general", "program", "tournament", "rental", "other"]).optional(),
  programId: z.number().int().positive().optional().nullable(),
  memberId: z.number().int().positive().optional().nullable(),
  waiverVersion: z.string().max(40).optional(),
  // Expiration — if not provided, admin API can fill from a default.
  expiresAt: z.string().max(40).optional().nullable(),
});
