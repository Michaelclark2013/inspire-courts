import "next-auth";

export type UserRole = "admin" | "staff" | "ref" | "front_desk" | "coach" | "parent";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    // R780 email verification — null = unverified; ISO string = verified
    // at that moment. Carried through to the session so UnverifiedEmailBanner
    // + requireVerifiedEmail() can check without an extra DB trip.
    emailVerifiedAt?: string | null;
  }
  interface Session {
    user: {
      email?: string | null;
      name?: string | null;
      role?: UserRole;
      id?: string;
      emailVerifiedAt?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    userId?: string;
    emailVerifiedAt?: string | null;
  }
}
