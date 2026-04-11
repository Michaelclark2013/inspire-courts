import "next-auth";

export type UserRole = "admin" | "staff" | "ref" | "front_desk" | "coach" | "parent";

declare module "next-auth" {
  interface User {
    role?: UserRole;
  }
  interface Session {
    user: {
      email?: string | null;
      name?: string | null;
      role?: UserRole;
      id?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    userId?: string;
  }
}
