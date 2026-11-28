/**
 * Una respuesta por dispositivo (solo servidor).
 *  - fs_disp: cookie httpOnly con un identificador aleatorio del dispositivo (dura 400 días).
 *    En la base se guarda solo su huella (HMAC), nunca el valor real, y un índice único impide
 *    que el mismo dispositivo deje dos respuestas.
 *  - fs_enc: cookie httpOnly del modo encuestador. Solo se obtiene con ENCUESTADOR_CLAVE
 *    (o con la sesión del panel /admin) y permite registrar varias encuestas en una tablet.
 */
import { sesionValida, COOKIE_ADMIN } from "./auth";

export const COOKIE_DISP = "fs_disp";
export const COOKIE_ENC = "fs_enc";
export const DURACION_DISP = 60 * 60 * 24 * 400; // máximo que permiten los navegadores
export const DURACION_ENC = 60 * 60 * 12; // una jornada de trabajo

async function hmac(clave: string, mensaje: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(clave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firma = await crypto.subtle.sign("HMAC", key, enc.encode(mensaje));
  return Array.from(new Uint8Array(firma), (b) => b.toString(16).padStart(2, "0")).join("");
}

const pimienta = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_PASSWORD || "futsala-dev";

/** Huella del dispositivo que se guarda en la base (no permite recuperar la cookie). */
export const huellaDispositivo = (idCookie: string) => hmac(pimienta(), `dispositivo:${idCookie}`);

export const idDispositivoValido = (v: string | undefined): v is string => !!v && /^[0-9a-f-]{36}$/.test(v);

/** Token del modo encuestador. Cambia si cambia la clave (desactiva todas las tablets). */
export async function tokenEncuestador(): Promise<string | null> {
  const clave = process.env.ENCUESTADOR_CLAVE;
  return clave ? hmac(clave, "futsala-encuestador-v1") : null;
}

export async function claveEncuestadorCorrecta(intento: string): Promise<boolean> {
  const clave = process.env.ENCUESTADOR_CLAVE;
  if (!clave) return false;
  const [a, b] = await Promise.all([hmac("comparar", intento), hmac("comparar", clave)]);
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

/** ¿Este navegador está autorizado como encuestador? (cookie del modo o sesión del panel). */
export async function esEncuestador(cookies: { get(n: string): { value: string } | undefined }): Promise<boolean> {
  const enc = cookies.get(COOKIE_ENC)?.value;
  const esperado = await tokenEncuestador();
  if (enc && esperado && enc === esperado) return true;
  return sesionValida(cookies.get(COOKIE_ADMIN)?.value);
}

export const opcionesCookie = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
