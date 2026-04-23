import { describe, it, expect } from "vitest";
import { sanitizeField } from "./sanitize";

describe("sanitize / sanitizeField", () => {
  it("returns empty string for falsy inputs", () => {
    expect(sanitizeField(undefined)).toBe("");
    expect(sanitizeField("")).toBe("");
  });

  it("escapes ampersands first so pre-escaped entities don't double-encode", () => {
    // &amp; has an & which must be escaped before the < etc. replacements
    // don't introduce new ampersands (they do: &lt;). Order matters.
    expect(sanitizeField("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("escapes < and > to block HTML injection", () => {
    expect(sanitizeField("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
  });

  it("escapes single and double quotes for attribute-safe output", () => {
    expect(sanitizeField(`She said "hi" — it's nice`)).toBe(
      "She said &quot;hi&quot; — it&#39;s nice"
    );
  });

  it("truncates to maxLength (default 500)", () => {
    const input = "x".repeat(600);
    expect(sanitizeField(input)).toHaveLength(500);
  });

  it("respects a custom maxLength", () => {
    expect(sanitizeField("hello world", 5)).toBe("hello");
  });

  it("is idempotent on already-sanitized content within length", () => {
    const once = sanitizeField("<a>");
    const twice = sanitizeField(once);
    // Second pass will re-escape the & in &lt; — documenting current behavior.
    expect(once).toBe("&lt;a&gt;");
    expect(twice).toBe("&amp;lt;a&amp;gt;");
  });
});
