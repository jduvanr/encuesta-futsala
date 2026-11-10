"use client";

import { useState } from "react";
import { Bandera } from "@/components/Encabezado";

export default function Login() {
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave }),
    });
    if (res.ok) {
      window.location.href = "/admin";
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "No se pudo iniciar sesión.");
    setCargando(false);
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-sm items-center px-4">
      <form onSubmit={entrar} className="tarjeta w-full">
        <Bandera className="mb-6 w-16" />
        <h1 className="text-2xl font-bold">Panel de resultados</h1>
        <p className="mt-1 text-sm text-white/60">Acceso solo para el equipo de futsala.co.</p>
        <label htmlFor="clave" className="mt-6 block text-sm font-semibold">
          Contraseña
        </label>
        <input
          id="clave"
          type="password"
          autoComplete="current-password"
          required
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "error-login" : undefined}
          className="mt-2 min-h-[52px] w-full rounded-2xl border border-white/20 bg-negro px-4 text-base focus:border-amarillo focus:outline focus:outline-[3px] focus:outline-offset-2 focus:outline-amarillo"
        />
        {error && (
          <p id="error-login" role="alert" className="mt-3 rounded-xl bg-rojo px-3 py-2 text-sm font-semibold">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primario mt-5 w-full" disabled={cargando || !clave}>
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
