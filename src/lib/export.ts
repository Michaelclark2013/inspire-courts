/**
 * Browser-native CSV export utility. No external dependencies.
 */

// CSV formula-injection guard: Excel/Sheets/Numbers evaluate any cell
// starting with =, +, -, @, or a tab/CR as a formula when the CSV is
// opened. An attacker could register a tournament team with a name like
// `=HYPERLINK("https://evil.com",...)` and phish the admin who exports
// the list. OWASP-recommended mitigation: prefix a single quote.
function csvSafePrefix(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
  return value;
}

function escapeCsvValue(value: string): string {
  const safe = csvSafePrefix(value);
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function exportCSV(
  filename: string,
  headers: string[],
  rows: string[][]
) {
  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
