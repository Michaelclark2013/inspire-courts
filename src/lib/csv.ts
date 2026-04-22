/**
 * Tiny RFC-4180 CSV parser. Handles quoted fields, escaped double-
 * quotes inside quoted fields, and \r\n or \n line endings.
 *
 * No external dependency — keeps the bundle lean for a capability
 * (CSV import) that only runs in a handful of admin workflows.
 *
 * Returns { header: string[], rows: Record<string, string>[] }.
 * Empty rows are skipped. Unknown columns are ignored by callers.
 */
export function parseCsv(input: string): {
  header: string[];
  rows: Record<string, string>[];
} {
  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const src = input.replace(/^\uFEFF/, ""); // strip BOM

  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      current.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      if (src[i + 1] === "\n") i++;
      current.push(field);
      if (current.some((c) => c !== "")) lines.push(current);
      current = [];
      field = "";
      i++;
      continue;
    }
    if (ch === "\n") {
      current.push(field);
      if (current.some((c) => c !== "")) lines.push(current);
      current = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // Flush trailing field + line.
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    if (current.some((c) => c !== "")) lines.push(current);
  }

  if (lines.length === 0) return { header: [], rows: [] };
  const header = lines[0].map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const rec: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      rec[header[c]] = (lines[r][c] ?? "").trim();
    }
    rows.push(rec);
  }
  return { header, rows };
}
