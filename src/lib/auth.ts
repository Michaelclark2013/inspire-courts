import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, userPermissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { saveRegistrationToDrive, appendSheetRow, sanitizeSheetRow, SHEETS } from "@/lib/google-sheets";
import { logger } from "@/lib/logger";
import { timestampAZ } from "@/lib/utils";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Check database users FIRST (includes reset-password overrides for admin)
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email.toLowerCase()))
            .limit(1);

          if (user) {
            // OAuth-only users (no real password) — skip DB auth, fall through to env admin check
            if (user.passwordHash === "google-oauth") {
              // Don't return null here — let the env admin fallback handle it
            } else {
              const isValid = await bcrypt.compare(
                credentials.password,
                user.passwordHash
              );
              if (isValid) {
                // Block unapproved staff/ref accounts
                if (user.approved === false) return null;
                return {
                  id: String(user.id),
                  email: user.email,
                  name: user.name,
                  role: user.role as "admin" | "staff" | "ref" | "front_desk" | "coach" | "parent",
                  // R780 — carry verification state into the JWT so
                  // the banner + requireVerifiedEmail() can check
                  // without an extra DB round trip.
                  emailVerifiedAt: user.emailVerifiedAt ?? null,
                };
              }
              // If DB user exists but password is wrong, don't fall through to env admin
              return null;
            }
          }
        } catch (err) {
          logger.error("DB auth error", { error: String(err) });
        }

        // 2. Fallback: check env-var admin (bootstrap login before DB user exists)
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminHash = process.env.ADMIN_PASSWORD_HASH;

        if (adminEmail && adminHash && credentials.email.toLowerCase() === adminEmail.toLowerCase()) {
          const isValid = await bcrypt.compare(
            credentials.password,
            adminHash
          );
          if (isValid) {
            return {
              id: "admin-env",
              email: adminEmail,
              name: "Admin",
              role: "admin" as const,
              // Env admin is always "verified" — no email flow exists
              // for the bootstrap account.
              emailVerifiedAt: new Date().toISOString(),
            };
          }
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Refresh permission overrides from the DB whenever:
      //   - initial login (user is defined)
      //   - an explicit `update()` call from the client
      //   - the token is missing the permissions array (first run after deploy)
      // Keeping this inside the callback means every request reuses the
      // cached set until the admin flips something, then calling
      // session().update() picks up the change without re-login.
      if (user) {
        token.email = user.email;
        token.name = user.name;

        if (account?.provider === "google") {
          // Google sign-in: look up or create DB user
          try {
            const [dbUser] = await db
              .select()
              .from(users)
              .where(eq(users.email, user.email!))
              .limit(1);

            if (dbUser) {
              token.role = dbUser.role;
              token.userId = String(dbUser.id);
              token.emailVerifiedAt = dbUser.emailVerifiedAt ?? null;
            } else {
              // Google OAuth → the provider already vouched for this
              // email address, so new OAuth users are auto-verified.
              const nowIso = new Date().toISOString();
              const [newUser] = await db
                .insert(users)
                .values({
                  email: user.email!,
                  name: user.name || "User",
                  passwordHash: "google-oauth", // placeholder — not used for OAuth
                  role: "parent",
                  emailVerifiedAt: nowIso,
                })
                .returning({
                  id: users.id,
                  role: users.role,
                  emailVerifiedAt: users.emailVerifiedAt,
                });
              token.role = newUser.role;
              token.userId = String(newUser.id);
              token.emailVerifiedAt = newUser.emailVerifiedAt ?? null;

              // Save new OAuth registration to Drive + Sheets (non-blocking)
              const timestamp = timestampAZ();
              Promise.allSettled([
                saveRegistrationToDrive(user.name || "User", user.email!, "parent"),
                appendSheetRow(SHEETS.prospectPipeline, "Sheet1!A:G", [
                  sanitizeSheetRow([
                    timestamp,
                    user.name || "User",
                    user.email!,
                    "",
                    "parent",
                    `${account.provider} OAuth`,
                    "Active",
                  ]),
                ]),
              ]).catch((err) => logger.warn("Failed to sync OAuth registration to Sheets/Drive", { error: String(err) }));
            }
          } catch (err) {
            logger.error("Google OAuth DB error", { error: String(err) });
            token.role = "parent";
            token.userId = user.id;
          }
        } else {
          // Credentials login
          token.role = user.role || "parent";
          token.userId = user.id;
          token.emailVerifiedAt = user.emailVerifiedAt ?? null;
        }
      }

      // Hydrate permission overrides on (re)login or explicit refresh.
      // Skips re-querying the DB on every request — the token is cached
      // for the session lifetime.
      if (user || trigger === "update" || !Array.isArray((token as { permissionOverrides?: unknown }).permissionOverrides)) {
        try {
          const uid = Number(token.userId);
          if (Number.isInteger(uid) && uid > 0) {
            const rows = await db
              .select({ page: userPermissions.page, granted: userPermissions.granted })
              .from(userPermissions)
              .where(eq(userPermissions.userId, uid));
            (token as { permissionOverrides: Array<{ page: string; granted: boolean }> })
              .permissionOverrides = rows;
          }
        } catch (err) {
          logger.warn("Failed to hydrate permission overrides", { error: String(err) });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role;
        session.user.id = token.userId;
        session.user.emailVerifiedAt = token.emailVerifiedAt ?? null;
        // Expose the per-user permission overrides so client code can
        // call canAccessWithOverrides() without a round-trip.
        (session.user as { permissionOverrides?: Array<{ page: string; granted: boolean }> })
          .permissionOverrides =
          (token as { permissionOverrides?: Array<{ page: string; granted: boolean }> })
            .permissionOverrides || [];
      }
      return session;
    },
  },
};
