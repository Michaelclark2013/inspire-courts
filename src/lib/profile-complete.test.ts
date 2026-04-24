import { describe, it, expect } from "vitest";
import {
  isProfileComplete,
  ageFromBirthDate,
  fitsAgeDivision,
} from "./profile-complete";

describe("profile-complete / isProfileComplete", () => {
  it("returns false for null/undefined", () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete(undefined)).toBe(false);
  });

  it("returns true for admins regardless of fields", () => {
    expect(isProfileComplete({ role: "admin" })).toBe(true);
  });

  it("returns false when any required field is missing", () => {
    expect(
      isProfileComplete({
        role: "coach",
        birthDate: "1990-01-01",
        emergencyContactName: "",
        emergencyContactPhone: "602-555-1234",
      })
    ).toBe(false);
  });

  it("returns true when all three fields are present", () => {
    expect(
      isProfileComplete({
        role: "coach",
        birthDate: "1990-01-01",
        emergencyContactName: "Alice",
        emergencyContactPhone: "602-555-1234",
      })
    ).toBe(true);
  });
});

describe("profile-complete / ageFromBirthDate", () => {
  const today = new Date("2026-04-23T12:00:00Z");

  it("returns null for missing or malformed input", () => {
    expect(ageFromBirthDate(null, today)).toBeNull();
    expect(ageFromBirthDate(undefined, today)).toBeNull();
    expect(ageFromBirthDate("", today)).toBeNull();
    expect(ageFromBirthDate("not-a-date", today)).toBeNull();
  });

  it("counts age correctly when birthday already passed this year", () => {
    expect(ageFromBirthDate("2010-01-15", today)).toBe(16);
  });

  it("counts age correctly when birthday hasn't passed yet this year", () => {
    // 2010-12-25 is still 15 on 2026-04-23 — they turn 16 later in 2026.
    expect(ageFromBirthDate("2010-12-25", today)).toBe(15);
  });

  it("handles same-day birthday (inclusive)", () => {
    // 2010-04-23 turning 16 today.
    expect(ageFromBirthDate("2010-04-23", today)).toBe(16);
  });

  it("rejects birth dates that yield impossible ages", () => {
    expect(ageFromBirthDate("1800-01-01", today)).toBeNull();
  });
});

describe("profile-complete / fitsAgeDivision", () => {
  const today = new Date("2026-04-23T12:00:00Z");

  it("returns null when division is missing", () => {
    expect(fitsAgeDivision("2010-01-01", null, today)).toBeNull();
    expect(fitsAgeDivision("2010-01-01", undefined, today)).toBeNull();
  });

  it("returns null for unknown division strings", () => {
    expect(fitsAgeDivision("2010-01-01", "Something", today)).toBeNull();
  });

  it("Open always passes", () => {
    expect(fitsAgeDivision("1970-01-01", "Open", today)).toBe(true);
  });

  it("8U requires age <= 8", () => {
    // born 2018-01-01 → age 8 in April 2026 (birthday passed)
    expect(fitsAgeDivision("2018-01-01", "8U", today)).toBe(true);
    expect(fitsAgeDivision("2016-01-01", "8U", today)).toBe(false);
  });

  it("boundary case: kid who just turned 13 cannot play 12U", () => {
    // born 2013-04-01 → age 13 on 2026-04-23
    expect(fitsAgeDivision("2013-04-01", "12U", today)).toBe(false);
  });

  it("returns null when birthDate is missing (don't block, prompt)", () => {
    expect(fitsAgeDivision(null, "12U", today)).toBeNull();
  });
});
