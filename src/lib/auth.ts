import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

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

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminHash = getPasswordHash();

        if (!adminEmail || !adminHash) return null;

        if (credentials.email !== adminEmail) return null;

        const isValid = await bcrypt.compare(credentials.password, adminHash);
        if (!isValid) return null;

        return {
          id: "1",
          email: adminEmail,
          name: "Admin",
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.email = token.email as string;
      return session;
    },
  },
};
