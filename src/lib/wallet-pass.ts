// Apple Wallet (.pkpass) + Google Wallet pass generator.
//
// Both wallets need signed assets that come from a paid developer
// account. This module exposes:
//   - isAppleWalletConfigured() / isGoogleWalletConfigured()
//   - buildPassPayload()  — JSON the certs would sign
//   - generateApplePass() — only callable when env vars are set;
//     throws a clear "configure" error otherwise. Real signing
//     uses dynamic import of `passkit-generator` so the package
//     becomes a runtime no-op if it isn't installed yet.
//
// We ship the route + UI today; flipping the env vars later turns
// real pass generation on with no further code changes.

export type PassPayload = {
  serialNumber: string;
  description: string;
  organizationName: string;
  teamIdentifier: string;
  passTypeIdentifier: string;
  logoText: string;
  // Pass-specific fields rendered on the front of the card.
  primaryFields: { label: string; value: string }[];
  secondaryFields: { label: string; value: string }[];
  auxiliaryFields: { label: string; value: string }[];
  backFields: { label: string; value: string }[];
  // Deep link the user lands on when they tap the pass.
  authenticationToken: string;
  webServiceURL: string;
  qrPayload: string;
};

export function isAppleWalletConfigured(): boolean {
  return !!(
    process.env.APPLE_PASS_TYPE_IDENTIFIER &&
    process.env.APPLE_PASS_TEAM_IDENTIFIER &&
    process.env.APPLE_PASS_CERT_BASE64 &&
    process.env.APPLE_PASS_CERT_PASSWORD &&
    process.env.APPLE_WWDR_BASE64
  );
}

export function isGoogleWalletConfigured(): boolean {
  return !!(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_WALLET_PRIVATE_KEY
  );
}

export function buildPassPayload(opts: {
  team: { id: number; name: string; division: string | null };
  tournament: { id: number; name: string; startDate: string };
  qrUrl: string;
}): PassPayload {
  const startDate = new Date(opts.tournament.startDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return {
    serialNumber: `team-${opts.team.id}-tournament-${opts.tournament.id}`,
    description: `${opts.team.name} — Inspire Courts check-in pass`,
    organizationName: "Inspire Courts AZ",
    teamIdentifier: process.env.APPLE_PASS_TEAM_IDENTIFIER || "DEV",
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER || "pass.com.inspirecourts.checkin",
    logoText: "INSPIRE COURTS",
    primaryFields: [{ label: "TEAM", value: opts.team.name }],
    secondaryFields: [
      { label: "DIVISION", value: opts.team.division || "—" },
      { label: "DATE", value: startDate },
    ],
    auxiliaryFields: [{ label: "EVENT", value: opts.tournament.name }],
    backFields: [
      { label: "Check-in URL", value: opts.qrUrl },
      { label: "Help", value: "Show this pass at the front desk to scan in." },
    ],
    authenticationToken: `team-${opts.team.id}-${opts.tournament.id}`,
    webServiceURL: process.env.NEXT_PUBLIC_SITE_URL || "https://www.inspirecourtsaz.com",
    qrPayload: opts.qrUrl,
  };
}

/**
 * Returns the signed .pkpass bytes. Throws when env vars are missing
 * or when the optional `passkit-generator` package isn't installed.
 * The route handler renders a friendly 503 in either case.
 */
export async function generateApplePass(payload: PassPayload): Promise<Buffer> {
  if (!isAppleWalletConfigured()) {
    throw new Error("APPLE_WALLET_NOT_CONFIGURED");
  }
  // Dynamic import — package may not be installed in this env yet.
  type PKPassClass = {
    new (opts: Record<string, unknown>): {
      setBarcodes(b: Record<string, unknown>): void;
      getAsBuffer(): Buffer | Promise<Buffer>;
    };
  };
  type PassKitMod = { PKPass: PKPassClass };
  let mod: PassKitMod;
  try {
    // Optional peer dep — package isn't in package.json yet. The
    // route handler turns this into a 503 with setup instructions
    // when missing.
    // @ts-expect-error optional runtime import; not yet a project dep
    mod = (await import("passkit-generator")) as PassKitMod;
  } catch {
    throw new Error("PASSKIT_PACKAGE_MISSING");
  }
  const PKPassCtor = mod.PKPass;
  // Construct the pass with secret material from env. The actual
  // template directory + icon assets need to ship under
  // /public/wallet-pass/ — we treat that as a deploy-time concern
  // for now since it varies by org.
  const pass = new PKPassCtor({
    model: "./public/wallet-pass/template.pass",
    certificates: {
      wwdr: Buffer.from(process.env.APPLE_WWDR_BASE64 || "", "base64").toString("utf8"),
      signerCert: Buffer.from(process.env.APPLE_PASS_CERT_BASE64 || "", "base64").toString("utf8"),
      signerKey: Buffer.from(process.env.APPLE_PASS_CERT_BASE64 || "", "base64").toString("utf8"),
      signerKeyPassphrase: process.env.APPLE_PASS_CERT_PASSWORD,
    },
    overrides: {
      serialNumber: payload.serialNumber,
      description: payload.description,
      organizationName: payload.organizationName,
      logoText: payload.logoText,
    },
  });
  pass.setBarcodes({
    message: payload.qrPayload,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
  });
  return pass.getAsBuffer();
}
