import "next-auth";

export type UserRole = "admin" | "staff" | "ref" | "front_desk" | "coach" | "parent";

// Matches lib/permissions.ts AdminPage. Duplicated (not imported) so
// the type module stays side-effect-free.
export type PermissionOverride = { page: string; granted: boolean };

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
      // Per-user permission overrides hydrated from user_permissions
      // at login. Merged with role-based defaults via
      // canAccessWithOverrides() in lib/permissions.ts.
      permissionOverrides?: PermissionOverride[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    userId?: string;
    emailVerifiedAt?: string | null;
    permissionOverrides?: PermissionOverride[];
  }
}
