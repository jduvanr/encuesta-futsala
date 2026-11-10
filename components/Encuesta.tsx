"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SITIO } from "@/lib/config";
import { guardarEstado, leerEstado, nuevoId } from "@/lib/estado";
import { PREGUNTAS, RESPUESTAS_INICIALES, validar, type Pregunta, type Respuestas } from "@/lib/encuesta";
import { insertarPublico } from "@/lib/supabase";
import { Bandera } from "./Encabezado";
import { Cierre } from "./Cierre";

type Fase = "inicio" | "preguntas" | "fin";
function origenUtm(): string {
  const p = new URLSearchParams(window.location.search);
  return (p.get("utm_source") || p.get("utm_medium") || p.get("utm_campaign") || "directo").slice(0, 100);
}

export function Encuesta({ qrYoutube }: { qrYoutube: string }) {
  const [fase, setFase] = useState<Fase>("inicio");
  const [paso, setPaso] = useState(0);
  const [direccion, setDireccion] = useState<"adelante" | "atras">("adelante");
  const [r, setR] = useState<Respuestas>(RESPUESTAS_INICIALES);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [yaRespondio, setYaRespondio] = useState(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const cambioDePaso = useRef(false);

  // Si ya respondió desde este navegador, va directo al cierre.
  useEffect(() => {
    if (leerEstado()?.enviado) {
      setYaRespondio(true);
      setFase("fin");
    }
  }, []);

  // Accesibilidad: al cambiar de pregunta, el foco va al título.
  useEffect(() => {
    if (cambioDePaso.current) tituloRef.current?.focus();
    cambioDePaso.current = false;
  }, [paso, fase]);

  const pregunta = PREGUNTAS[paso];
  const total = PREGUNTAS.length;
  const esUltima = paso === total - 1;

  function irA(nuevo: number, dir: "adelante" | "atras") {
    setError(null);
    setDireccion(dir);
    cambioDePaso.current = true;
    setPaso(nuevo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function empezar() {
    if (!leerEstado()) guardarEstado({ id: nuevoId(), enviado: false });
    cambioDePaso.current = true;
    setFase("preguntas");
  }

  async function siguiente() {
    const msg = validar(pregunta, r);
    if (msg) {
      setError(msg);
      return;
    }
    if (!esUltima) return irA(paso + 1, "adelante");

    setEnviando(true);
    setError(null);
    const estado = leerEstado() ?? { id: nuevoId(), enviado: false };
    guardarEstado(estado);
    const resultado = await insertarPublico("respuestas", { id: estado.id, ...r, origen: origenUtm() });
    setEnviando(false);
    if (resultado === "error") {
      setError("No pudimos guardar tu respuesta. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    guardarEstado({ ...estado, enviado: true });
    setYaRespondio(resultado === "duplicado");
    cambioDePaso.current = true;
    setFase("fin");
    window.scrollTo({ top: 0 });
  }

  function atras() {
    if (paso === 0) {
      setError(null);
      setFase("inicio");
    } else irA(paso - 1, "atras");
  }

  if (fase === "fin") return <Cierre qrYoutube={qrYoutube} yaRespondio={yaRespondio} />;

  if (fase === "inicio") {
    return (
      <section className="tarjeta animate-aparece" aria-labelledby="titulo-encuesta">
        <Bandera className="mb-6 w-20" />
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amarillo">Estudio 2026</p>
        <h1 id="titulo-encuesta" className="text-[28px] font-bold leading-tight sm:text-4xl">
          {SITIO.titulo}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/80">{SITIO.descripcion}</p>
        <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <span className="block text-white/60">Tiempo estimado</span>
            <span className="font-semibold">{SITIO.tiempoEstimado}</span>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <span className="block text-white/60">Preguntas</span>
            <span className="font-semibold">8, una por pantalla</span>
          </li>
        </ul>
        <button type="button" onClick={empezar} className="btn-primario mt-7 w-full text-lg">
          Empezar
        </button>
        <p className="mt-4 text-center text-xs text-white/55">
          Tus respuestas son anónimas. Lee la{" "}
          <Link href="/politica-de-datos" className="underline underline-offset-2 hover:text-white">
            política de tratamiento de datos
          </Link>
          .
        </p>
      </section>
    );
  }

  const progreso = Math.round(((paso + 1) / total) * 100);

  return (
    <section className="tarjeta" aria-label="Encuesta">
      {/* Progreso */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-xs font-semibold text-white/70">
          <span>
            Pregunta {paso + 1} de {total}
          </span>
          <span>{progreso}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="Progreso de la encuesta"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={paso + 1}
          aria-valuetext={`Pregunta ${paso + 1} de ${total}`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amarillo to-rojo transition-[width] duration-500 ease-out"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          siguiente();
        }}
        noValidate
      >
        <div key={paso} className={direccion === "adelante" ? "animate-entra-derecha" : "animate-entra-izquierda"}>
          <h2
            ref={tituloRef}
            tabIndex={-1}
            id={`p-${pregunta.id}`}
            className="text-[22px] font-bold leading-snug outline-none sm:text-2xl"
          >
            {pregunta.titulo}
            {pregunta.obligatoria ? (
              <span className="text-amarillo" aria-label="(obligatoria)"> *</span>
            ) : (
              <span className="ml-2 align-middle text-xs font-normal text-white/50">(opcional)</span>
            )}
          </h2>
          {pregunta.ayuda && <p className="mt-1 text-sm text-white/65">{pregunta.ayuda}</p>}

          <div className="mt-5">
            <Campo pregunta={pregunta} r={r} setR={(nr) => (setR(nr), setError(null))} errorId={error ? "error-paso" : undefined} />
          </div>
        </div>

        <div aria-live="assertive" className="min-h-[1px]">
          {error && (
            <p id="error-paso" role="alert" className="mt-4 rounded-xl bg-rojo px-4 py-3 text-sm font-semibold text-blanco">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
          <button type="button" onClick={atras} className="btn-secundario" disabled={enviando}>
            <span aria-hidden="true">←</span> Atrás
          </button>
          <button type="submit" className="btn-primario" disabled={enviando}>
            {enviando ? "Enviando…" : esUltima ? "Enviar respuestas" : "Siguiente"}
            {!enviando && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </form>
    </section>
  );
}

function Campo({
  pregunta: p,
  r,
  setR,
  errorId,
}: {
  pregunta: Pregunta;
  r: Respuestas;
  setR: (r: Respuestas) => void;
  errorId?: string;
}) {
  const etiqueta = `p-${p.id}`;

  switch (p.tipo) {
    case "casilla":
      return (
        <label className="opcion items-start">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={r.autorizacion}
            onChange={(e) => setR({ ...r, autorizacion: e.target.checked })}
            aria-describedby={errorId}
            aria-required="true"
          />
          <span className="marca mt-0.5 rounded-md peer-checked:border-amarillo peer-checked:bg-amarillo [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
            <Chulo />
          </span>
          <span className="text-[15px]">
            {p.texto}{" "}
            <Link href="/politica-de-datos" target="_blank" className="text-amarillo underline underline-offset-2">
              Ver política
            </Link>
          </span>
        </label>
      );

    case "unica":
      return (
        <div role="radiogroup" aria-labelledby={etiqueta} aria-required={p.obligatoria} aria-describedby={errorId} className="grid gap-2.5">
          {p.opciones.map((op) => (
            <label key={op} className="opcion">
              <input
                type="radio"
                name={p.campo}
                value={op}
                className="peer sr-only"
                checked={r[p.campo] === op}
                onChange={() => setR({ ...r, [p.campo]: op })}
              />
              <span className="marca rounded-full peer-checked:border-[7px] peer-checked:border-amarillo" />
              <span>{op}</span>
            </label>
          ))}
        </div>
      );

    case "desplegable":
      return (
        <div>
          <label htmlFor="localidad" className="sr-only">
            {p.titulo}
          </label>
          <select
            id="localidad"
            value={r.localidad ?? ""}
            onChange={(e) => setR({ ...r, localidad: e.target.value || null })}
            aria-describedby={errorId}
            aria-required="true"
            style={{ backgroundImage: FLECHA }}
            className="min-h-[56px] w-full appearance-none rounded-2xl border border-white/20 bg-negro bg-[length:28px] bg-[right_12px_center] bg-no-repeat px-4 pr-12 text-base text-blanco focus:border-amarillo focus:outline focus:outline-[3px] focus:outline-offset-2 focus:outline-amarillo"
          >
            <option value="">Selecciona tu localidad</option>
            {p.opciones.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>
      );

    case "multiple":
      return (
        <div role="group" aria-labelledby={etiqueta} aria-describedby={errorId} className="grid grid-cols-2 gap-2.5">
          {p.opciones.map((op) => {
            const marcado = r.canales.includes(op);
            return (
              <label key={op} className="opcion">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={marcado}
                  onChange={() =>
                    setR({ ...r, canales: marcado ? r.canales.filter((c) => c !== op) : [...r.canales, op] })
                  }
                />
                <span className="marca rounded-md peer-checked:border-amarillo peer-checked:bg-amarillo [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
                  <Chulo />
                </span>
                <span>{op}</span>
              </label>
            );
          })}
        </div>
      );

    case "cuadricula":
      return (
        <div className="grid gap-3" aria-describedby={errorId}>
          {p.filas.map((f) => (
            <div key={f.id} className="rounded-2xl border border-white/15 bg-white/[0.04] p-4">
              <p id={`fila-${f.id}`} className="mb-3 font-semibold">
                {f.etiqueta}
              </p>
              <div role="radiogroup" aria-labelledby={`fila-${f.id}`} className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label
                    key={n}
                    className="grid h-12 cursor-pointer place-items-center rounded-xl border border-white/20 text-lg font-semibold transition hover:border-white/40 has-[:checked]:border-amarillo has-[:checked]:bg-amarillo has-[:checked]:text-negro has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amarillo"
                  >
                    <input
                      type="radio"
                      name={f.id}
                      value={n}
                      className="sr-only"
                      checked={r[f.id] === n}
                      onChange={() => setR({ ...r, [f.id]: n })}
                      aria-label={`${f.etiqueta}: ${n} de 5`}
                    />
                    {n}
                  </label>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-white/50" aria-hidden="true">
                <span>Muy mala</span>
                <span>Excelente</span>
              </div>
            </div>
          ))}
        </div>
      );
  }
}

const FLECHA = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FCD116'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`;

function Chulo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-negro" fill="none" stroke="currentColor" strokeWidth={3.5} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
