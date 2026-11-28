import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  COOKIE_DISP,
  DURACION_DISP,
  esEncuestador,
  huellaDispositivo,
  idDispositivoValido,
  opcionesCookie,
} from "@/lib/dispositivo";
import { AUTORIZA, EDADES, LOCALIDADES, ROLES_ETIQUETAS, detalleDe, preguntasVisibles, validar, type Respuestas } from "@/lib/encuesta";
import { dispositivoYaRespondio, insertarRespuestaServidor } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Identificador del dispositivo: el de la cookie o uno nuevo. */
function dispositivo(): { id: string; nuevo: boolean } {
  const actual = cookies().get(COOKIE_DISP)?.value;
  if (idDispositivoValido(actual)) return { id: actual, nuevo: false };
  return { id: crypto.randomUUID(), nuevo: true };
}

function conCookie(res: NextResponse, d: { id: string; nuevo: boolean }) {
  // Se renueva siempre para que dure 400 días desde la última visita.
  res.cookies.set(COOKIE_DISP, d.id, opcionesCookie(DURACION_DISP));
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/** Estado del dispositivo al abrir la encuesta: ¿ya respondió? ¿es encuestador? */
export async function GET() {
  const d = dispositivo();
  const encuestador = await esEncuestador(cookies());
  let respondio = false;
  if (!d.nuevo && !encuestador) {
    try {
      respondio = await dispositivoYaRespondio(await huellaDispositivo(d.id));
    } catch (e) {
      console.error(e);
    }
  }
  return conCookie(NextResponse.json({ respondio, encuestador }), d);
}

const esTexto = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;

/** Guarda una respuesta. Fuera del modo encuestador, solo una por dispositivo. */
export async function POST(req: Request) {
  const cuerpo = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!cuerpo || typeof cuerpo !== "object") return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  const { id, rol, localidad, edad, detalle, origen } = cuerpo;
  if (
    !esTexto(id, 36) ||
    !/^[0-9a-f-]{36}$/.test(id) ||
    !(ROLES_ETIQUETAS as readonly string[]).includes(rol as string) ||
    !(LOCALIDADES as readonly string[]).includes(localidad as string) ||
    !(EDADES as readonly string[]).includes(edad as string) ||
    !detalle ||
    typeof detalle !== "object" ||
    Array.isArray(detalle) ||
    JSON.stringify(detalle).length > 8000
  ) {
    return NextResponse.json({ error: "Respuesta incompleta o inválida" }, { status: 400 });
  }

  // Se vuelve a validar en el servidor con las mismas reglas de la encuesta (saltos y obligatorias)
  // y solo se guardan las claves de las preguntas que le tocaban a esa persona.
  const r: Respuestas = { ...(detalle as Respuestas), autorizacion: AUTORIZA, rol: rol as string, localidad: localidad as string, edad: edad as string };
  if (preguntasVisibles(r).some((p) => validar(p, r))) {
    return NextResponse.json({ error: "Faltan respuestas obligatorias" }, { status: 400 });
  }

  const d = dispositivo();
  const encuestador = await esEncuestador(cookies());
  const resultado = await insertarRespuestaServidor({
    id,
    autorizacion: true,
    rol,
    localidad,
    edad,
    detalle: detalleDe(r),
    origen: encuestador ? "encuestador" : esTexto(origen, 100) && origen ? origen : "directo",
    // En modo encuestador no se marca el dispositivo: la tablet puede registrar muchas personas.
    dispositivo: encuestador ? null : await huellaDispositivo(d.id),
  });

  if (resultado === "error") return conCookie(NextResponse.json({ error: "No se pudo guardar" }, { status: 500 }), d);
  return conCookie(NextResponse.json({ resultado }), d);
}
