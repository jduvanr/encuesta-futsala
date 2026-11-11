"use client";

import { useEffect, useRef, useState } from "react";
import { REDES, SITIO } from "@/lib/config";
import { normalizarWhatsapp } from "@/lib/encuesta";
import { insertarPublico } from "@/lib/supabase";
import { guardarEstado, leerEstado } from "@/lib/estado";
import { Bandera } from "./Encabezado";
import { Icono, type NombreIcono } from "./Iconos";

const REDES_BOTONES: { nombre: NombreIcono; red: string; usuario: string; href: string }[] = [
  { nombre: "instagram", red: "Instagram", usuario: "@futsala.tv", href: REDES.instagram },
  { nombre: "tiktok", red: "TikTok", usuario: "@futsala.co", href: REDES.tiktok },
  { nombre: "facebook", red: "Facebook", usuario: "futsala.co", href: REDES.facebook },
];

export function Cierre({
  qrYoutube,
  yaRespondio,
  onNuevaPersona,
}: {
  qrYoutube: string;
  yaRespondio: boolean;
  onNuevaPersona: () => void;
}) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [tel, setTel] = useState("");
  const [estadoTel, setEstadoTel] = useState<"inicial" | "enviando" | "ok" | "error">("inicial");
  const [errorTel, setErrorTel] = useState<string | null>(null);

  useEffect(() => {
    tituloRef.current?.focus();
    if (leerEstado()?.contacto) setEstadoTel("ok");
  }, []);

  const textoCompartir = `${SITIO.titulo}. Responde la encuesta distrital del fútbol de salón y el microfútbol en Bogotá (${SITIO.tiempoEstimado}): ${SITIO.url}/?utm_source=whatsapp`;

  async function guardarTel(e: React.FormEvent) {
    e.preventDefault();
    const numero = normalizarWhatsapp(tel);
    if (!numero) {
      setErrorTel("Escribe un celular colombiano de 10 dígitos que empiece por 3. Ejemplo: 300 123 4567.");
      return;
    }
    setErrorTel(null);
    setEstadoTel("enviando");
    const res = await insertarPublico("contactos", { whatsapp: numero });
    if (res === "error") {
      setEstadoTel("error");
      setErrorTel("No pudimos guardar tu número. Inténtalo de nuevo.");
      return;
    }
    const est = leerEstado();
    if (est) guardarEstado({ ...est, contacto: true });
    setEstadoTel("ok");
  }

  return (
    <section className="tarjeta animate-aparece" aria-labelledby="titulo-cierre">
      <Bandera className="mb-6 w-20" />
      <h1 id="titulo-cierre" ref={tituloRef} tabIndex={-1} className="text-[28px] font-bold leading-tight outline-none">
        {yaRespondio ? "¡Ya habías participado!" : "¡Tu respuesta quedó enviada!"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-white/80">
        {yaRespondio && "Tu respuesta ya quedó registrada desde este dispositivo. "}
        Gracias por responder. Tus respuestas ayudan a mejorar el fútbol de salón en Bogotá. Síguenos en Instagram como{" "}
        <a href={REDES.instagram} target="_blank" rel="noopener noreferrer" className="font-semibold text-amarillo underline-offset-2 hover:underline">
          @futsala.tv
        </a>
        .
      </p>

      {/* WhatsApp opcional */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        {estadoTel === "ok" ? (
          <p className="text-sm font-semibold text-amarillo" role="status">
            ✓ Listo, te avisaremos por WhatsApp cuando salgan los resultados.
          </p>
        ) : (
          <form onSubmit={guardarTel} noValidate>
            <label htmlFor="whatsapp" className="block text-sm font-semibold">
              Si quieres recibir los resultados del estudio, déjanos tu WhatsApp <span className="font-normal text-white/55">(opcional)</span>
            </label>
            <p id="ayuda-whatsapp" className="mt-1 text-xs text-white/55">
              Tu número se guarda aparte de tus respuestas, que siguen siendo anónimas.
            </p>
            <div className="mt-3 flex gap-2">
              <div className="flex min-h-[52px] flex-1 items-center rounded-2xl border border-white/20 bg-negro focus-within:border-amarillo focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-amarillo">
                <span className="pl-4 pr-1 text-white/60" aria-hidden="true">
                  +57
                </span>
                <input
                  id="whatsapp"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="300 123 4567"
                  maxLength={16}
                  value={tel}
                  onChange={(e) => {
                    setTel(e.target.value);
                    setErrorTel(null);
                  }}
                  aria-invalid={Boolean(errorTel)}
                  aria-describedby={errorTel ? "ayuda-whatsapp error-whatsapp" : "ayuda-whatsapp"}
                  className="w-full min-w-0 bg-transparent py-3 pr-4 text-base text-blanco placeholder:text-white/35 focus:outline-none"
                />
              </div>
              <button type="submit" className="btn-primario px-5" disabled={estadoTel === "enviando"}>
                {estadoTel === "enviando" ? "…" : "Guardar"}
              </button>
            </div>
            {errorTel && (
              <p id="error-whatsapp" role="alert" className="mt-3 rounded-xl bg-rojo px-3 py-2 text-sm font-semibold">
                {errorTel}
              </p>
            )}
          </form>
        )}
      </div>

      {/* YouTube */}
      <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center sm:flex-row sm:text-left">
        <a
          href={REDES.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="block shrink-0 rounded-xl bg-blanco p-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amarillo"
          aria-label="Código QR del canal de YouTube de futsala.co"
        >
          <span className="block h-36 w-36 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrYoutube }} />
        </a>
        <div className="flex-1">
          <p className="font-semibold">Mira los partidos en YouTube</p>
          <p className="mt-1 text-sm text-white/65">Escanea el código o toca el botón para suscribirte.</p>
          <a href={REDES.youtubeSuscribir} target="_blank" rel="noopener noreferrer" className="btn-rojo mt-3 w-full sm:w-auto">
            <Icono nombre="youtube" /> Suscríbete
          </a>
        </div>
      </div>

      {/* Redes */}
      <p className="mt-6 text-sm font-semibold text-white/80">Síguenos</p>
      <ul className="mt-2 grid gap-2.5">
        {REDES_BOTONES.map((b) => (
          <li key={b.nombre}>
            <a href={b.href} target="_blank" rel="noopener noreferrer" className="btn-secundario w-full justify-start">
              <Icono nombre={b.nombre} />
              <span>
                {b.red} <span className="font-normal text-white/65">{b.usuario}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* Compartir */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(textoCompartir)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primario mt-6 w-full"
      >
        <Icono nombre="whatsapp" /> Compartir por WhatsApp
      </a>

      {/* Varias personas en el mismo dispositivo (p. ej. un celular o tablet en el escenario) */}
      <div className="mt-6 border-t border-white/10 pt-6 text-center">
        <p className="text-sm text-white/70">¿Alguien más quiere responder en este dispositivo?</p>
        <button type="button" onClick={onNuevaPersona} className="btn-secundario mt-3 w-full">
          Responder otra encuesta
        </button>
      </div>
    </section>
  );
}
