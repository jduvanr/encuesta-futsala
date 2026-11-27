import { NextResponse } from "next/server";
import { claveCorrecta, COOKIE_ADMIN, DURACION_SESION, tokenAdmin } from "@/lib/auth";

// Límite de intentos fallidos por IP (en memoria: frena la fuerza bruta básica;
// en Vercel cada instancia lleva su propia cuenta).
const MAX_FALLOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const fallos = new Map<string, { n: number; desde: number }>();

function ipDe(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "desconocida";
}

export async function POST(req: Request) {
  const ip = ipDe(req);
  const reg = fallos.get(ip);
  if (reg && Date.now() - reg.desde > VENTANA_MS) fallos.delete(ip);
  if ((fallos.get(ip)?.n ?? 0) >= MAX_FALLOS) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 500 });
  }
  const { clave } = (await req.json().catch(() => ({}))) as { clave?: string };
  if (typeof clave !== "string" || clave.length > 200 || !(await claveCorrecta(clave))) {
    const previo = fallos.get(ip);
    fallos.set(ip, { n: (previo?.n ?? 0) + 1, desde: previo?.desde ?? Date.now() });
    await new Promise((r) => setTimeout(r, 800)); // frena intentos por fuerza bruta
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  fallos.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ADMIN, (await tokenAdmin())!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURACION_SESION,
  });
  return res;
}
