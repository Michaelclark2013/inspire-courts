import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  apiError,
  apiValidationError,
  apiNotFound,
  parseJsonBody,
  safeJsonParse,
  azMonthStartIso,
  csvCell,
  csvBody,
  UTF8_BOM,
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

describe("api-helpers / safeJsonParse", () => {
  it("returns the fallback for null / undefined / empty string", () => {
    expect(safeJsonParse(null, [])).toEqual([]);
    expect(safeJsonParse(undefined, [])).toEqual([]);
    expect(safeJsonParse("", [])).toEqual([]);
  });

  it("returns the parsed value for valid JSON", () => {
    expect(safeJsonParse<string[]>('["a","b"]', [])).toEqual(["a", "b"]);
    expect(safeJsonParse<{ x: number }>('{"x":1}', { x: 0 })).toEqual({ x: 1 });
  });

  it("returns the fallback for malformed JSON without throwing", () => {
    // The whole point — a single bad DB row should never crash a list view.
    expect(safeJsonParse("not json", [])).toEqual([]);
    expect(safeJsonParse("{unclosed", ["default"])).toEqual(["default"]);
    expect(safeJsonParse('{"a":}', null)).toBeNull();
  });

  it("honors the typed fallback (not just any[])", () => {
    const fallback: string[] = ["Court 1"];
    expect(safeJsonParse<string[]>(null, fallback)).toEqual(["Court 1"]);
  });
});

describe("api-helpers / azMonthStartIso", () => {
  it("returns midnight Arizona on the 1st of the current AZ month", () => {
    // Mid-month UTC → same AZ month. 2026-06-15 18:00 UTC = 11 AM AZ.
    const result = azMonthStartIso(new Date("2026-06-15T18:00:00Z"));
    expect(result).toBe(new Date("2026-06-01T00:00:00-07:00").toISOString());
  });

  it("handles the UTC-vs-AZ rollover that motivated the helper", () => {
    // 2026-07-01 02:00 UTC = 2026-06-30 19:00 AZ.
    // A naive UTC-month-start would already return July 1; correct
    // answer is June 1 because Arizona hasn't rolled over yet.
    const result = azMonthStartIso(new Date("2026-07-01T02:00:00Z"));
    expect(result).toBe(new Date("2026-06-01T00:00:00-07:00").toISOString());
  });

  it("rolls over to the next AZ month exactly at 07:00 UTC on the 1st", () => {
    // 2026-07-01 07:00 UTC = 2026-07-01 00:00 AZ — new month.
    const result = azMonthStartIso(new Date("2026-07-01T07:00:00Z"));
    expect(result).toBe(new Date("2026-07-01T00:00:00-07:00").toISOString());
  });

  it("handles year boundary (Dec → Jan)", () => {
    // 2027-01-01 06:59 UTC = 2026-12-31 23:59 AZ — still Dec 2026.
    const result = azMonthStartIso(new Date("2027-01-01T06:59:00Z"));
    expect(result).toBe(new Date("2026-12-01T00:00:00-07:00").toISOString());
  });
});

describe("api-helpers / csvCell — formula-injection guard", () => {
  it("wraps benign values in quotes and escapes embedded quotes", () => {
    expect(csvCell("Alice")).toBe('"Alice"');
    expect(csvCell('She said "hi"')).toBe('"She said ""hi"""');
    expect(csvCell("one, two")).toBe('"one, two"');
  });

  it("quotes null and undefined as empty strings", () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });

  it("coerces non-strings via String()", () => {
    expect(csvCell(42)).toBe('"42"');
    expect(csvCell(true)).toBe('"true"');
  });

  it("prefixes a single quote on =, +, -, @, tab, CR — the formula chars", () => {
    // Attacker team name: =HYPERLINK("evil.com","Click")
    expect(csvCell('=HYPERLINK("https://evil.com","Click me")')).toBe(
      '"\'=HYPERLINK(""https://evil.com"",""Click me"")"'
    );
    // Accounting/SUM-style injection
    expect(csvCell("+cmd|'/c calc'")).toBe('"\'+cmd|\'/c calc\'"');
    expect(csvCell("-2+3")).toBe('"\'-2+3"');
    expect(csvCell("@SUM(A1:A10)")).toBe('"\'@SUM(A1:A10)"');
    expect(csvCell("\tleading tab")).toBe('"\'\tleading tab"');
  });

  it("leaves safe starting characters alone", () => {
    // Emails + dates + regular data should NOT get a quote prefix
    expect(csvCell("alice@example.com")).toBe('"alice@example.com"');
    expect(csvCell("2026-01-01")).toBe('"2026-01-01"');
    expect(csvCell("10 wins")).toBe('"10 wins"');
  });
});

describe("api-helpers / csvBody — Excel-compat envelope", () => {
  it("prepends UTF-8 BOM and joins rows with CRLF", () => {
    const out = csvBody(['"a","b"', '"1","2"']);
    expect(out).toBe(`${UTF8_BOM}"a","b"\r\n"1","2"`);
  });

  it("renders a single row without a trailing terminator", () => {
    const out = csvBody(['"only"']);
    expect(out).toBe(`${UTF8_BOM}"only"`);
  });

  it("UTF8_BOM is the literal U+FEFF code point", () => {
    expect(UTF8_BOM).toBe("﻿");
    expect(UTF8_BOM.length).toBe(1);
  });
});
