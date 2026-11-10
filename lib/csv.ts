/**
 * CSV compatible con Excel en español: separador ";" y BOM UTF-8 para que las tildes se vean bien.
 * Google Sheets también lo detecta automáticamente.
 */
export function aCsv(encabezados: string[], filas: (string | number | boolean | null | undefined)[][]): string {
  const celda = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // Evita inyección de fórmulas al abrir en Excel
    const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[";\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
  };
  return "﻿" + [encabezados, ...filas].map((f) => f.map(celda).join(";")).join("\r\n");
}
