import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ADMIN, sesionValida } from "@/lib/auth";
import { datosDemo } from "@/lib/demo";
import { leerTodo, lecturaConfigurada } from "@/lib/supabase";
import type { FilaRespuesta } from "@/lib/tipos";
import { Panel } from "./Panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel de resultados", robots: { index: false, follow: false } };

export default async function Admin() {
  // Doble verificación (además del middleware).
  if (!(await sesionValida(cookies().get(COOKIE_ADMIN)?.value))) redirect("/admin/login");

  let filas: FilaRespuesta[] = [];
  let totalContactos = 0;
  let aviso: string | null = null;

  if (lecturaConfigurada()) {
    try {
      const [r, c] = await Promise.all([
        leerTodo<FilaRespuesta>("respuestas"),
        leerTodo<{ id: string }>("contactos", "id,fecha"),
      ]);
      filas = r;
      totalContactos = c.length;
    } catch (e) {
      aviso = `No se pudieron leer los datos de Supabase: ${(e as Error).message}`;
    }
  } else if (process.env.NODE_ENV !== "production") {
    filas = datosDemo();
    totalContactos = 23;
    aviso = "Modo demostración: Supabase no está configurado, estos datos son ficticios.";
  } else {
    aviso = "Falta configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel.";
  }

  return <Panel filas={filas} totalContactos={totalContactos} aviso={aviso} />;
}
