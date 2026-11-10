import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_ADMIN, sesionValida } from "@/lib/auth";
import { aCsv } from "@/lib/csv";
import { leerTodo, lecturaConfigurada } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Descarga los contactos de WhatsApp en CSV (protegido por middleware y verificado otra vez aquí). */
export async function GET() {
  if (!(await sesionValida(cookies().get(COOKIE_ADMIN)?.value))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!lecturaConfigurada()) return NextResponse.json({ error: "Supabase no está configurado" }, { status: 503 });
  const filas = await leerTodo<{ fecha: string; whatsapp: string }>("contactos", "fecha,whatsapp");
  const csv = aCsv(["fecha", "whatsapp"], filas.map((f) => [f.fecha, f.whatsapp]));
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contactos-futsala-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
