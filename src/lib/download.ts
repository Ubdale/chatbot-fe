// Save answers as files, entirely in the browser.

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const text = String(v);
  // Neutralise spreadsheet formulas (=, +, -, @) in text cells, then quote when needed.
  const safe = typeof v === "string" && /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function downloadCsv(columns: string[], rows: unknown[][], filename: string) {
  const lines = [columns, ...rows].map((r) => r.map(csvCell).join(","));
  // BOM so Excel opens UTF-8 text (e.g. Zürich, café) correctly.
  save(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), filename);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "answer"
  );
}

/** A styled Excel workbook or PDF report of an answer, built by the backend. */
export async function downloadExport(messageId: string, filename: string, format: "xlsx" | "pdf") {
  const res = await fetch(`/api/chat/messages/${messageId}/export.${format}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  save(await res.blob(), `${filename}.${format}`);
}
