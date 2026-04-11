import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const OVERRIDE_PATH = path.join(process.cwd(), "data", "auth-override.json");

function getPasswordHash(): string | null {
  // Check for password override file first (set by password reset flow)
  try {
    if (fs.existsSync(OVERRIDE_PATH)) {
      const data = JSON.parse(fs.readFileSync(OVERRIDE_PATH, "utf-8"));
      if (data.passwordHash) return data.passwordHash;
    }
  } catch {
    // Fall through to env var
  }

  // Fall back to environment variable
  return process.env.ADMIN_PASSWORD_HASH || null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Check env-var admin (bootstrap login)
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminHash = getPasswordHash();

        if (adminEmail && adminHash && credentials.email === adminEmail) {
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
            };
          }
        }

        // 2. Check database users
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          if (user) {
            const isValid = await bcrypt.compare(
              credentials.password,
              user.passwordHash
            );
            if (isValid) {
              return {
                id: String(user.id),
                email: user.email,
                name: user.name,
                role: user.role as "admin" | "staff" | "ref" | "front_desk" | "coach" | "parent",
              };
            }
          }
        } catch {
          // DB not configured yet — fall through silently
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.role = user.role || "admin";
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role;
        session.user.id = token.userId;
      }
      return session;
    },
  },
};
