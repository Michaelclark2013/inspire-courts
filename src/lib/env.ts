/**
 * Environment variable validation.
 * Imported in layout.tsx so missing required vars are caught at startup.
 */

const REQUIRED_VARS = ["NEXTAUTH_SECRET", "ADMIN_EMAIL"] as const;

const OPTIONAL_VARS = [
  "NOTION_API_KEY",
  "ADMIN_PASSWORD_HASH",
  "ANTHROPIC_API_KEY",
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  "MAILCHIMP_API_KEY",
  "MAILCHIMP_LIST_ID",
  "NEXT_PUBLIC_GA_ID",
  "CHAT_LEADS_DB_ID",
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
