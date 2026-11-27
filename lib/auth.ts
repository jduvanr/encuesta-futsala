/** Sesión del panel /admin: cookie httpOnly con un HMAC derivado de ADMIN_PASSWORD. */
export const COOKIE_ADMIN = "fs_admin";
export const DURACION_SESION = 60 * 60 * 8; // 8 horas

async function hmac(clave: string, mensaje: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(clave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firma = await crypto.subtle.sign("HMAC", key, enc.encode(mensaje));
  return Array.from(new Uint8Array(firma), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Token de sesión: "<vencimiento>.<firma>". La firma depende de ADMIN_PASSWORD, así que
 * al cambiar la contraseña se cierran todas las sesiones, y cada token vence solo.
 */
export async function tokenAdmin(): Promise<string | null> {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return null;
  const exp = Math.floor(Date.now() / 1000) + DURACION_SESION;
  return `${exp}.${await hmac(pass, `futsala-admin-sesion-v2|${exp}`)}`;
}

function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

/** Comparación en tiempo constante de la contraseña ingresada. */
export async function claveCorrecta(intento: string): Promise<boolean> {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return false;
  const [a, b] = await Promise.all([hmac("comparar", intento), hmac("comparar", pass)]);
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function sesionValida(valorCookie: string | undefined): Promise<boolean> {
  const pass = process.env.ADMIN_PASSWORD;
  if (!valorCookie || !pass) return false;
  const [expTxt, firma] = valorCookie.split(".");
  const exp = Number(expTxt);
  if (!firma || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return iguales(firma, await hmac(pass, `futsala-admin-sesion-v2|${exp}`));
}
