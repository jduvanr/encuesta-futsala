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

/**
 * Modo encuestador: para una tablet o celular con el que una persona aplica la encuesta a muchas otras.
 * Se activa abriendo la encuesta con ?modo=encuestador y se queda activo en ese dispositivo
 * (aunque se recargue) hasta abrirla con ?modo=publico.
 */
const CLAVE_MODO = "futsala-modo-encuestador";

export function leerModoEncuestador(): boolean {
  try {
    const modo = new URLSearchParams(window.location.search).get("modo");
    if (modo === "encuestador") localStorage.setItem(CLAVE_MODO, "1");
    if (modo === "publico") localStorage.removeItem(CLAVE_MODO);
    return localStorage.getItem(CLAVE_MODO) === "1";
  } catch {
    return new URLSearchParams(window.location.search).get("modo") === "encuestador";
  }
}

