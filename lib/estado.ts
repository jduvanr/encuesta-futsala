import { CLAVE_LOCAL } from "./config";

export type Estado = { id: string; enviado: boolean; contacto?: boolean };

export function nuevoId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Respaldo para navegadores sin randomUUID (p. ej. http en red local)
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function leerEstado(): Estado | null {
  try {
    const v = localStorage.getItem(CLAVE_LOCAL);
    return v ? (JSON.parse(v) as Estado) : null;
  } catch {
    return null;
  }
}

export function guardarEstado(e: Estado) {
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(e));
  } catch {
    /* modo privado: se ignora */
  }
}

