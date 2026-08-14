import "server-only";

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  // Comillas dobles alrededor de cualquier valor con coma, comilla o salto
  // de línea — regla estándar de CSV (RFC 4180), evita que un nombre o
  // descripción con coma rompa las columnas.
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/** BOM (U+FEFF) al principio: sin esto, Excel abre el CSV interpretando UTF-8 mal y los acentos/ñ salen corruptos. */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))];
  return "﻿" + lines.join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
