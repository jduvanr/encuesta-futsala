import { NextResponse } from "next/server";
import { claveEncuestadorCorrecta, COOKIE_ENC, DURACION_ENC, opcionesCookie, tokenEncuestador } from "@/lib/dispositivo";

/** Activa el modo encuestador en este navegador con la clave ENCUESTADOR_CLAVE. */
export async function POST(req: Request) {
  if (!process.env.ENCUESTADOR_CLAVE) {
    return NextResponse.json({ error: "El modo encuestador no está configurado (falta ENCUESTADOR_CLAVE)." }, { status: 503 });
  }
  const { clave } = (await req.json().catch(() => ({}))) as { clave?: string };
  if (typeof clave !== "string" || !(await claveEncuestadorCorrecta(clave))) {
    await new Promise((r) => setTimeout(r, 800)); // frena intentos por fuerza bruta
    return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ENC, (await tokenEncuestador())!, opcionesCookie(DURACION_ENC));
  return res;
}

/** Desactiva el modo encuestador en este navegador. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ENC, "", opcionesCookie(0));
  return res;
}
