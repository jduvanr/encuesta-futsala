"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SITIO } from "@/lib/config";
import { guardarEstado, leerEstado, nuevoId } from "@/lib/estado";
import {
  BLOQUE_INICIAL,
  NO_AUTORIZA,
  ROLES,
  detalleDe,
  preguntasVisibles,
  rolDe,
  validar,
  type Pregunta,
  type Respuestas,
  type Valor,
} from "@/lib/encuesta";
import { insertarPublico } from "@/lib/supabase";
import { Bandera } from "./Encabezado";
import { Cierre } from "./Cierre";

type Fase = "inicio" | "preguntas" | "sin-autorizacion" | "fin";

function origenUtm(): string {
  const p = new URLSearchParams(window.location.search);
  return (p.get("utm_source") || p.get("utm_medium") || p.get("utm_campaign") || "directo").slice(0, 100);
}

const PRIMERA = BLOQUE_INICIAL[0].id;
const MAS_LARGA = Math.max(...ROLES.map((r) => r.preguntas.length));

export function Encuesta({ qrYoutube }: { qrYoutube: string }) {
  const [fase, setFase] = useState<Fase>("inicio");
  const [pasoId, setPasoId] = useState(PRIMERA);
  const [direccion, setDireccion] = useState<"adelante" | "atras">("adelante");
  const [r, setR] = useState<Respuestas>({});
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
  }, [pasoId, fase]);

  const visibles = useMemo(() => preguntasVisibles(r), [r]);
  const idx = Math.max(0, visibles.findIndex((p) => p.id === pasoId));
  const pregunta = visibles[idx];
  const rol = rolDe(r.rol);
  const esUltima = Boolean(rol) && idx === visibles.length - 1;

  function poner(clave: string, valor: Valor | undefined) {
    setR((prev) => ({ ...prev, [clave]: valor }));
    setError(null);
  }

  function irA(nuevo: number, dir: "adelante" | "atras") {
    setError(null);
    setDireccion(dir);
    cambioDePaso.current = true;
    setPasoId(visibles[nuevo].id);
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
    if (pregunta.tipo === "autorizacion" && r.autorizacion === NO_AUTORIZA) {
      cambioDePaso.current = true;
      setFase("sin-autorizacion");
      return;
    }
    if (!esUltima) return irA(idx + 1, "adelante");

    setEnviando(true);
    setError(null);
    const estado = leerEstado() ?? { id: nuevoId(), enviado: false };
    guardarEstado(estado);
    const resultado = await insertarPublico("respuestas_roles", {
      id: estado.id,
      autorizacion: true,
      rol: r.rol,
      localidad: r.localidad,
      edad: r.edad,
      detalle: detalleDe(r),
      origen: origenUtm(),
    });
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
    if (idx === 0) {
      setError(null);
      setFase("inicio");
    } else irA(idx - 1, "atras");
  }

  // Otra persona va a responder en este mismo dispositivo: identificador nuevo y encuesta en blanco.
  function nuevaPersona() {
    guardarEstado({ id: nuevoId(), enviado: false });
    setR({});
    setPasoId(PRIMERA);
    setYaRespondio(false);
    setError(null);
    setDireccion("adelante");
    setFase("inicio");
    window.scrollTo({ top: 0 });
  }

  if (fase === "fin") return <Cierre qrYoutube={qrYoutube} yaRespondio={yaRespondio} onNuevaPersona={nuevaPersona} />;

  if (fase === "sin-autorizacion") {
    return (
      <section className="tarjeta animate-aparece" aria-labelledby="titulo-sin">
        <Bandera className="mb-6 w-20" />
        <h1 id="titulo-sin" ref={tituloRef} tabIndex={-1} className="text-[26px] font-bold leading-tight outline-none">
          Entendido, no guardamos nada
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/80">
          Sin tu autorización no podemos registrar respuestas. Gracias por tu tiempo. Si cambias de opinión, puedes volver a
          empezar.
        </p>
        <button
          type="button"
          className="btn-secundario mt-6 w-full"
          onClick={() => {
            cambioDePaso.current = true;
            setPasoId(PRIMERA);
            setFase("preguntas");
          }}
        >
          <span aria-hidden="true">←</span> Volver a la autorización
        </button>
      </section>
    );
  }

  if (fase === "inicio") {
    return (
      <section className="tarjeta animate-aparece" aria-labelledby="titulo-encuesta">
        <Bandera className="mb-6 w-20" />
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-amarillo">Encuesta distrital · Bogotá 2026</p>
        <h1 id="titulo-encuesta" className="text-[44px] font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl">
          Tu <span className="text-amarillo">voz</span> también cuenta, <span className="text-rojo">micrero</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-white/80">
          La gran encuesta del fútbol de salón y el microfútbol en las 20 localidades de Bogotá. Elige tu rol y responde las
          preguntas pensadas para ti.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Encuestas disponibles">
          {ROLES.map((x) => (
            <li key={x.corto} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-sm">
              {x.corto}
            </li>
          ))}
        </ul>
        <ul className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <span className="block text-white/60">Tiempo estimado</span>
            <span className="font-semibold">{SITIO.tiempoEstimado}</span>
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <span className="block text-white/60">Formato</span>
            <span className="font-semibold">Una pregunta por pantalla</span>
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

  // Progreso: por sección (datos iniciales / encuesta del rol) y barra general.
  const nBloque = BLOQUE_INICIAL.length;
  const enBloque = idx < nBloque;
  const totalGeneral = rol ? visibles.length : nBloque + MAS_LARGA;
  const seccion = enBloque ? "Datos iniciales" : rol!.seccion;
  const numSeccion = enBloque ? idx + 1 : idx - nBloque + 1;
  const totalSeccion = enBloque ? nBloque : visibles.length - nBloque;
  const progreso = Math.round(((idx + 1) / totalGeneral) * 100);

  return (
    <section className="tarjeta" aria-label="Encuesta">
      <div className="mb-6">
        <div className="mb-2 flex justify-between gap-3 text-xs font-semibold text-white/70">
          <span>{seccion}</span>
          <span className="shrink-0">
            {numSeccion} de {totalSeccion}
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="Progreso de la encuesta"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progreso}
          aria-valuetext={`${seccion}: pregunta ${numSeccion} de ${totalSeccion}`}
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
        <div key={pregunta.id} className={direccion === "adelante" ? "animate-entra-derecha" : "animate-entra-izquierda"}>
          <h2
            ref={tituloRef}
            tabIndex={-1}
            id={`p-${pregunta.id}`}
            className="text-[22px] font-bold leading-snug outline-none sm:text-2xl"
          >
            {pregunta.titulo}
            {pregunta.opcional ? (
              <span className="ml-2 align-middle text-xs font-normal text-white/50">(opcional)</span>
            ) : (
              <span className="text-amarillo" aria-label="(obligatoria)"> *</span>
            )}
          </h2>
          <Ayuda pregunta={pregunta} />

          <div className="mt-5">
            <Campo pregunta={pregunta} r={r} poner={poner} errorId={error ? "error-paso" : undefined} />
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

function Ayuda({ pregunta: p }: { pregunta: Pregunta }) {
  let texto = p.ayuda;
  if (!texto && p.tipo === "multiple") texto = p.max ? `Elige máximo ${p.max} opciones.` : "Puedes marcar varias opciones.";
  if (!texto && (p.tipo === "escala" || p.tipo === "cuadricula")) texto = `1 = ${p.extremos[0]} · 5 = ${p.extremos[1]}`;
  return texto ? <p className="mt-1 text-sm text-white/65">{texto}</p> : null;
}

/** Dos columnas solo si todas las opciones son cortas. */
const columnas = (opciones: readonly string[]) =>
  opciones.length > 3 && opciones.every((o) => o.length <= 16) ? "grid-cols-2" : "grid-cols-1";

function Radios({
  nombre,
  opciones,
  valor,
  alElegir,
  etiquetaId,
  errorId,
}: {
  nombre: string;
  opciones: readonly string[];
  valor: Valor | undefined;
  alElegir: (op: string) => void;
  etiquetaId: string;
  errorId?: string;
}) {
  return (
    <div role="radiogroup" aria-labelledby={etiquetaId} aria-describedby={errorId} className={`grid gap-2.5 ${columnas(opciones)}`}>
      {opciones.map((op) => (
        <label key={op} className="opcion">
          <input type="radio" name={nombre} value={op} className="peer sr-only" checked={valor === op} onChange={() => alElegir(op)} />
          <span className="marca rounded-full peer-checked:border-[7px] peer-checked:border-amarillo" />
          <span>{op}</span>
        </label>
      ))}
    </div>
  );
}

function Campo({
  pregunta: p,
  r,
  poner,
  errorId,
}: {
  pregunta: Pregunta;
  r: Respuestas;
  poner: (clave: string, valor: Valor | undefined) => void;
  errorId?: string;
}) {
  const etiqueta = `p-${p.id}`;
  const valor = r[p.id];

  switch (p.tipo) {
    case "autorizacion":
      return (
        <div className="grid gap-3">
          <p id={`texto-${p.id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[15px] leading-relaxed text-white/85">
            {p.texto}{" "}
            <Link href="/politica-de-datos" target="_blank" className="text-amarillo underline underline-offset-2">
              Ver política
            </Link>
          </p>
          <Radios nombre={p.id} opciones={p.opciones} valor={valor} alElegir={(op) => poner(p.id, op)} etiquetaId={`${etiqueta} texto-${p.id}`} errorId={errorId} />
        </div>
      );

    case "unica":
      if (p.desplegable) {
        return (
          <div>
            <label htmlFor={`sel-${p.id}`} className="sr-only">
              {p.titulo}
            </label>
            <select
              id={`sel-${p.id}`}
              value={typeof valor === "string" ? valor : ""}
              onChange={(e) => poner(p.id, e.target.value || undefined)}
              aria-describedby={errorId}
              aria-required={!p.opcional}
              style={{ backgroundImage: FLECHA }}
              className="min-h-[56px] w-full appearance-none rounded-2xl border border-white/20 bg-negro bg-[length:28px] bg-[right_12px_center] bg-no-repeat px-4 pr-12 text-base text-blanco focus:border-amarillo focus:outline focus:outline-[3px] focus:outline-offset-2 focus:outline-amarillo"
            >
              <option value="">Selecciona una opción</option>
              {p.opciones.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
        );
      }
      return <Radios nombre={p.id} opciones={p.opciones} valor={valor} alElegir={(op) => poner(p.id, op)} etiquetaId={etiqueta} errorId={errorId} />;

    case "multiple": {
      const marcadas = Array.isArray(valor) ? valor : [];
      const lleno = p.max != null && marcadas.length >= p.max;
      function alternar(op: string) {
        if (marcadas.includes(op)) return poner(p.id, marcadas.filter((m) => m !== op));
        // Las opciones como "Ninguna" o "Prefiero no responder" no se combinan con otras.
        if (p.tipo === "multiple" && p.exclusivas?.includes(op)) return poner(p.id, [op]);
        const resto = marcadas.filter((m) => !(p.tipo === "multiple" && p.exclusivas?.includes(m)));
        if (p.tipo === "multiple" && p.max && resto.length >= p.max) return;
        poner(p.id, [...resto, op]);
      }
      return (
        <div role="group" aria-labelledby={etiqueta} aria-describedby={errorId} className={`grid gap-2.5 ${columnas(p.opciones)}`}>
          {p.opciones.map((op) => {
            const marcado = marcadas.includes(op);
            const bloqueado = lleno && !marcado && !p.exclusivas?.includes(op);
            return (
              <label key={op} className={`opcion ${bloqueado ? "opacity-45" : ""}`}>
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={marcado}
                  onChange={() => alternar(op)}
                  aria-disabled={bloqueado || undefined}
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
    }

    case "escala":
      return (
        <div>
          <div role="radiogroup" aria-labelledby={etiqueta} aria-describedby={errorId} className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className="grid h-14 cursor-pointer place-items-center rounded-xl border border-white/20 text-lg font-semibold transition hover:border-white/40 has-[:checked]:border-amarillo has-[:checked]:bg-amarillo has-[:checked]:text-negro has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amarillo"
              >
                <input
                  type="radio"
                  name={p.id}
                  value={n}
                  className="sr-only"
                  checked={valor === n}
                  onChange={() => poner(p.id, n)}
                  aria-label={`${n} de 5${n === 1 ? `: ${p.extremos[0]}` : n === 5 ? `: ${p.extremos[1]}` : ""}`}
                />
                {n}
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-between gap-4 text-xs text-white/55" aria-hidden="true">
            <span>{p.extremos[0]}</span>
            <span className="text-right">{p.extremos[1]}</span>
          </div>
        </div>
      );

    case "abierta": {
      const texto = typeof valor === "string" ? valor : "";
      return (
        <div>
          <label htmlFor={`txt-${p.id}`} className="sr-only">
            {p.titulo}
          </label>
          <textarea
            id={`txt-${p.id}`}
            rows={4}
            maxLength={p.max}
            value={texto}
            onChange={(e) => poner(p.id, e.target.value)}
            placeholder="Escribe aquí tu respuesta"
            aria-describedby={`cuenta-${p.id}${errorId ? ` ${errorId}` : ""}`}
            className="w-full rounded-2xl border border-white/20 bg-negro px-4 py-3 text-base text-blanco placeholder:text-white/35 focus:border-amarillo focus:outline focus:outline-[3px] focus:outline-offset-2 focus:outline-amarillo"
          />
          <p id={`cuenta-${p.id}`} className="mt-1 text-right text-xs text-white/50">
            {texto.length} / {p.max}
          </p>
        </div>
      );
    }

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
                      onChange={() => poner(f.id, n)}
                      aria-label={`${f.etiqueta}: ${n} de 5`}
                    />
                    {n}
                  </label>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-white/50" aria-hidden="true">
                <span>{p.extremos[0]}</span>
                <span>{p.extremos[1]}</span>
              </div>
            </div>
          ))}
        </div>
      );

    case "doble":
      return (
        <div className="grid gap-5">
          {p.partes.map((pt) => (
            <div key={pt.id}>
              <p id={`parte-${pt.id}`} className="mb-2.5 text-sm font-semibold uppercase tracking-wider text-amarillo">
                {pt.etiqueta}
              </p>
              <Radios
                nombre={pt.id}
                opciones={pt.opciones}
                valor={r[pt.id]}
                alElegir={(op) => poner(pt.id, op)}
                etiquetaId={`parte-${pt.id}`}
                errorId={errorId}
              />
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
