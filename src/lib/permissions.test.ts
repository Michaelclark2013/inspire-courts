import { describe, it, expect } from "vitest";
import {
  canAccess,
  isAdminRole,
  isPortalRole,
  getLoginRedirect,
  ADMIN_ROLES,
  PORTAL_ROLES,
  ALL_ROLES,
} from "./permissions";

describe("permissions / canAccess", () => {
  it("returns false when role is undefined", () => {
    expect(canAccess(undefined, "overview")).toBe(false);
  });

  it("admin has access to every declared page", () => {
    // Spot-check a handful of sensitive pages — all should return true.
    const sensitivePages = [
      "overview",
      "teams",
      "revenue",
      "users",
      "audit_log",
      "payroll",
      "members",
      "certifications",
    ] as const;
    for (const p of sensitivePages) {
      expect(canAccess("admin", p)).toBe(true);
    }
  });

  it("coach/parent cannot reach any admin page", () => {
    const pages = ["overview", "revenue", "payroll", "audit_log", "users"] as const;
    for (const role of ["coach", "parent"] as const) {
      for (const p of pages) {
        expect(canAccess(role, p)).toBe(false);
      }
    }
  });

  it("front_desk can check people in but cannot see payroll or revenue", () => {
    expect(canAccess("front_desk", "checkin")).toBe(true);
    expect(canAccess("front_desk", "members")).toBe(true);
    expect(canAccess("front_desk", "payroll")).toBe(false);
    expect(canAccess("front_desk", "revenue")).toBe(false);
    expect(canAccess("front_desk", "audit_log")).toBe(false);
  });

  it("ref only sees my_schedule + my_history", () => {
    expect(canAccess("ref", "my_schedule")).toBe(true);
    expect(canAccess("ref", "my_history")).toBe(true);
    expect(canAccess("ref", "revenue")).toBe(false);
    expect(canAccess("ref", "payroll")).toBe(false);
    expect(canAccess("ref", "users")).toBe(false);
  });

  it("staff can use the admin surface but not admin-only pages", () => {
    expect(canAccess("staff", "overview")).toBe(true);
    expect(canAccess("staff", "score_entry")).toBe(true);
    expect(canAccess("staff", "users")).toBe(false);
    expect(canAccess("staff", "revenue")).toBe(false);
  });
});

describe("permissions / role groupings", () => {
  it("ADMIN_ROLES and PORTAL_ROLES are disjoint", () => {
    for (const r of ADMIN_ROLES) {
      expect(PORTAL_ROLES).not.toContain(r);
    }
  });

  it("ALL_ROLES covers both ADMIN_ROLES and PORTAL_ROLES", () => {
    for (const r of [...ADMIN_ROLES, ...PORTAL_ROLES]) {
      expect(ALL_ROLES).toContain(r);
    }
  });

  it("isAdminRole matches ADMIN_ROLES exactly", () => {
    for (const r of ADMIN_ROLES) expect(isAdminRole(r)).toBe(true);
    for (const r of PORTAL_ROLES) expect(isAdminRole(r)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
    expect(isAdminRole("ninja")).toBe(false);
  });

  it("isPortalRole matches PORTAL_ROLES exactly", () => {
    for (const r of PORTAL_ROLES) expect(isPortalRole(r)).toBe(true);
    for (const r of ADMIN_ROLES) expect(isPortalRole(r)).toBe(false);
    expect(isPortalRole(undefined)).toBe(false);
  });
});

describe("permissions / getLoginRedirect", () => {
  it("sends admin + admin-surface roles to /admin", () => {
    expect(getLoginRedirect("admin")).toBe("/admin");
    expect(getLoginRedirect("staff")).toBe("/admin");
    expect(getLoginRedirect("ref")).toBe("/admin");
    expect(getLoginRedirect("front_desk")).toBe("/admin");
  });

  it("sends portal roles to /portal", () => {
    expect(getLoginRedirect("coach")).toBe("/portal");
    expect(getLoginRedirect("parent")).toBe("/portal");
  });

  it("falls back to /login for unknown or missing roles", () => {
    expect(getLoginRedirect(undefined)).toBe("/login");
    expect(getLoginRedirect("hacker")).toBe("/login");
    expect(getLoginRedirect("")).toBe("/login");
  });
});
