import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv";

describe("csv / parseCsv", () => {
  it("parses a simple header + rows", () => {
    const { header, rows } = parseCsv("name,age\nAlice,30\nBob,40");
    expect(header).toEqual(["name", "age"]);
    expect(rows).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "40" },
    ]);
  });

  it("handles \\r\\n line endings", () => {
    const { rows } = parseCsv("a,b\r\n1,2\r\n3,4\r\n");
    expect(rows).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ]);
  });

  it("strips a leading BOM", () => {
    const input = "\uFEFFname,age\nAlice,30";
    const { header, rows } = parseCsv(input);
    expect(header).toEqual(["name", "age"]);
    expect(rows).toHaveLength(1);
  });

  it("unquotes double-quoted fields", () => {
    const { rows } = parseCsv('name,note\n"Alice","Hello, world"');
    expect(rows[0]).toEqual({ name: "Alice", note: "Hello, world" });
  });

  it('handles escaped "" inside quoted fields', () => {
    const { rows } = parseCsv('x\n"She said ""hi"""');
    expect(rows[0].x).toBe('She said "hi"');
  });

  it("preserves newlines inside quoted fields", () => {
    const { rows } = parseCsv('notes\n"line1\nline2"');
    expect(rows[0].notes).toBe("line1\nline2");
  });

  it("skips fully blank rows", () => {
    const { rows } = parseCsv("a,b\n1,2\n\n3,4\n");
    expect(rows).toHaveLength(2);
  });

  it("trims header whitespace", () => {
    const { header } = parseCsv("  name  ,  age  \nAlice,30");
    expect(header).toEqual(["name", "age"]);
  });

  it("returns empty result for empty input", () => {
    expect(parseCsv("")).toEqual({ header: [], rows: [] });
  });

  it("fills missing trailing columns with empty string", () => {
    const { rows } = parseCsv("a,b,c\n1,2");
    expect(rows[0]).toEqual({ a: "1", b: "2", c: "" });
  });
});
