/**
 * Environment variable validation.
 * Imported in layout.tsx so missing required vars are caught at startup.
 */

const REQUIRED_VARS = ["NEXTAUTH_SECRET", "ADMIN_EMAIL"] as const;

const OPTIONAL_VARS = [
  // Database
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  // Auth
  "ADMIN_PASSWORD_HASH",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_URL",
  // Notion
  "NOTION_API_KEY",
  "CHAT_LEADS_DB_ID",
  // Google Sheets / Drive
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  // Square payments
  "SQUARE_ACCESS_TOKEN",
  "SQUARE_LOCATION_ID",
  "SQUARE_ENVIRONMENT",
  "SQUARE_WEBHOOK_SIGNATURE_KEY",
  // Email
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  // Mailchimp
  "MAILCHIMP_API_KEY",
  "MAILCHIMP_LIST_ID",
  // AI chat
  "ANTHROPIC_API_KEY",
  // Analytics
  "NEXT_PUBLIC_GA_ID",
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "NEXT_PUBLIC_META_PIXEL_ID",
  "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
  // Push notifications (VAPID)
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
] as const;

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const msg = `[env] Missing required environment variables: ${missing.join(", ")}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg);
    } else {
      console.warn(msg);
    }
  }

  const unset = OPTIONAL_VARS.filter((key) => !process.env[key]);
  if (unset.length > 0) {
    console.info(
      `[env] Optional env vars not set (some features may be limited): ${unset.join(", ")}`
    );
  }
}

let validated = false;

/** Explicitly trigger env validation (idempotent). */
export function ensureEnv() {
  if (!validated) {
    validated = true;
    validateEnv();
  }
}

// Auto-validate on import in server context
if (typeof window === "undefined") {
  ensureEnv();
}
