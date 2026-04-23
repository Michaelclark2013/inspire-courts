import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  apiError,
  apiValidationError,
  apiNotFound,
  parseJsonBody,
} from "./api-helpers";

describe("api-helpers / apiError", () => {
  it("returns the given message + status with default shape", async () => {
    const res = apiError("Unauthorized", 401);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("merges extras into the body", async () => {
    const res = apiError("Out of date", 412, {
      extras: { currentUpdatedAt: "2026-06-01T00:00:00Z" },
    });
    const body = await res.json();
    expect(body).toEqual({
      error: "Out of date",
      currentUpdatedAt: "2026-06-01T00:00:00Z",
    });
  });

  it("applies custom headers (e.g. Retry-After)", async () => {
    const res = apiError("Slow down", 429, {
      headers: { "Retry-After": "60" },
    });
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});

describe("api-helpers / apiValidationError", () => {
  it("returns 422 with both top-level error and per-field map", async () => {
    const res = apiValidationError({
      email: "Required",
      name: "Must be at least 1 character",
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body.errors).toEqual({
      email: "Required",
      name: "Must be at least 1 character",
    });
  });

  it("accepts a custom summary message", async () => {
    const res = apiValidationError({ email: "Bad" }, "Check your input");
    const body = await res.json();
    expect(body.error).toBe("Check your input");
  });
});

describe("api-helpers / apiNotFound", () => {
  it("returns 404 with the canonical 'Not found' shape", async () => {
    const res = apiNotFound();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Not found" });
  });

  it("adds a detail field when provided", async () => {
    const res = apiNotFound("Tournament not found");
    const body = await res.json();
    expect(body).toEqual({
      error: "Not found",
      detail: "Tournament not found",
    });
  });
});

describe("api-helpers / parseJsonBody", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().nonnegative(),
  });

  function mkRequest(body: string): Request {
    return new Request("https://example.com", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });
  }

  it("returns ok:true + narrowed data on valid payload", async () => {
    const req = mkRequest(JSON.stringify({ name: "Alice", age: 30 }));
    const parsed = await parseJsonBody(req, schema);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data).toEqual({ name: "Alice", age: 30 });
    }
  });

  it("returns ok:false + 400 response on malformed JSON", async () => {
    const req = mkRequest("{ not valid json");
    const parsed = await parseJsonBody(req, schema);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.response.status).toBe(400);
      const body = await parsed.response.json();
      expect(body.error).toBe("Invalid JSON body");
    }
  });

  it("returns ok:false + 422 with per-field error map on schema fail", async () => {
    const req = mkRequest(JSON.stringify({ name: "", age: -1 }));
    const parsed = await parseJsonBody(req, schema);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.response.status).toBe(422);
      const body = await parsed.response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.errors).toHaveProperty("name");
      expect(body.errors).toHaveProperty("age");
    }
  });

  it("keeps only the first message per field (earliest wins)", async () => {
    const restrictive = z.object({
      password: z
        .string()
        .min(8, "too short")
        .regex(/[0-9]/, "needs number"),
    });
    const req = mkRequest(JSON.stringify({ password: "abc" })); // too short AND no number
    const parsed = await parseJsonBody(req, restrictive);
    if (parsed.ok) throw new Error("expected validation failure");
    const body = await parsed.response.json();
    // Multiple issues on the same path → helper only keeps the first.
    expect(body.errors.password).toBe("too short");
  });

  it("uses '_root' as the field key for top-level errors", async () => {
    const arrSchema = z.array(z.string());
    const req = mkRequest(JSON.stringify({ not: "an array" }));
    const parsed = await parseJsonBody(req, arrSchema);
    if (parsed.ok) throw new Error("expected validation failure");
    const body = await parsed.response.json();
    expect(body.errors).toHaveProperty("_root");
  });
});
