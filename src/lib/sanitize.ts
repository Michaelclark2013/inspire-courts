/**
 * Sanitize a string value to prevent XSS in emails, Notion, and Google Sheets.
 * Escapes HTML special characters and optionally caps field length.
 */
export function sanitizeField(value: string | undefined, maxLength = 500): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .slice(0, maxLength);
}
