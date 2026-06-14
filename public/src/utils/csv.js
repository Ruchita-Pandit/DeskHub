/**
 * Minimal CSV helpers — RFC-style escaping for Excel / Sheets.
 */

export function escapeCsvCell(value) {
  if (value == null || value === "") return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}


export function toCsvLine(values) {
  return values.map(escapeCsvCell).join(",");
}


export function downloadCsvLines(filename, lines) {
  const body = `\uFEFF${lines.join("\r\n")}`;
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
