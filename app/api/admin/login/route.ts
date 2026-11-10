import { NextResponse } from "next/server";
import { claveCorrecta, COOKIE_ADMIN, DURACION_SESION, tokenAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 500 });
  }
  const { clave } = (await req.json().catch(() => ({}))) as { clave?: string };
  if (typeof clave !== "string" || !(await claveCorrecta(clave))) {
    await new Promise((r) => setTimeout(r, 800)); // frena intentos por fuerza bruta
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
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
