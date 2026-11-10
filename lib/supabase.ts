/**
 * Cliente mínimo para la API REST de Supabase (PostgREST) usando fetch.
 * Se evita @supabase/supabase-js para que la encuesta cargue más rápido en celular.
 */

function encabezados(llave: string): Record<string, string> {
  const h: Record<string, string> = { apikey: llave, "Content-Type": "application/json" };
  // Las llaves antiguas (JWT "eyJ...") también van en Authorization.
  // Las nuevas (sb_publishable_ / sb_secret_) solo van en apikey.
  if (llave.startsWith("eyJ")) h.Authorization = `Bearer ${llave}`;
  return h;
}

export type ResultadoInsercion = "ok" | "duplicado" | "error";

/** Inserta una fila con la llave pública. RLS solo permite insertar, nunca leer. */
export async function insertarPublico(tabla: "respuestas_roles" | "contactos", fila: object): Promise<ResultadoInsercion> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !llave) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[modo demo] Supabase no está configurado. Fila de "${tabla}" no guardada:`, fila);
      return "ok";
    }
    return "error";
  }
  try {
    const res = await fetch(`${url}/rest/v1/${tabla}`, {
      method: "POST",
      headers: { ...encabezados(llave), Prefer: "return=minimal" },
      body: JSON.stringify(fila),
      keepalive: true,
    });
    if (res.ok) return "ok";
    if (res.status === 409) return "duplicado";
    console.error("Supabase respondió", res.status, await res.text());
    return "error";
  } catch (e) {
    console.error(e);
    return "error";
  }
}

export const lecturaConfigurada = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Lee todas las filas de una tabla con la llave secreta (solo servidor). */
export async function leerTodo<T>(tabla: string, columnas = "*"): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  const tam = 1000;
  const filas: T[] = [];
  for (let desde = 0; ; desde += tam) {
    const res = await fetch(`${url}/rest/v1/${tabla}?select=${columnas}&order=fecha.desc`, {
      headers: { ...encabezados(llave), Range: `${desde}-${desde + tam - 1}`, "Range-Unit": "items" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    const lote = (await res.json()) as T[];
    filas.push(...lote);
    if (lote.length < tam) break;
  }
  return filas;
}
