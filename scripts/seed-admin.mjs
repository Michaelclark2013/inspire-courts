// One-off admin seeder. Usage:
//   npm run seed:admin -- me@example.com "Some Name"
// Or:
//   node --env-file=.env.local scripts/seed-admin.mjs me@example.com "Some Name"
//
// Generates a random 16-char password, bcrypts it, and writes an
// admin row. Prints the password ONCE — it's not stored anywhere
// recoverable, so copy it immediately.
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("TURSO_DATABASE_URL missing — run with `node --env-file=.env.local`");
  process.exit(1);
}

const email = (process.argv[2] || "admin@inspirecourtsaz.com").toLowerCase().trim();
const name = process.argv[3] || "Owner";

// Strong random password: alphanumeric only (~120 bits over 20 chars).
// Avoids base64's +/-_ which confuse password managers + tricky
// to type. Accept override via 4th arg for deterministic resets.
const password =
  process.argv[4] ||
  randomBytes(24)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);
const passwordHash = await bcrypt.hash(password, 12);

const client = createClient({ url, authToken });

// Existing row? Update password + elevate to admin. Otherwise insert.
const existing = await client.execute({
  sql: "SELECT id, role, approved FROM users WHERE email = ? LIMIT 1",
  args: [email],
});
const now = new Date().toISOString();

if (existing.rows.length > 0) {
  const row = existing.rows[0];
  await client.execute({
    sql: `UPDATE users SET password_hash = ?, role = 'admin', approved = 1,
          name = COALESCE(NULLIF(name, ''), ?), updated_at = ? WHERE id = ?`,
    args: [passwordHash, name, now, row.id],
  });
  console.log("\n✓ Existing user elevated to admin:");
} else {
  await client.execute({
    sql: `INSERT INTO users (email, name, password_hash, role, approved, created_at, updated_at)
          VALUES (?, ?, ?, 'admin', 1, ?, ?)`,
    args: [email, name, passwordHash, now, now],
  });
  console.log("\n✓ Admin user created:");
}

console.log("  Email:    " + email);
console.log("  Password: " + password);
console.log("  Role:     admin");
console.log("\nLog in at https://inspirecourtsaz.com/login\n");
