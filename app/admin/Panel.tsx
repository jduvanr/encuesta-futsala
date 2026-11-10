"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bandera } from "@/components/Encabezado";
import { aCsv } from "@/lib/csv";
import { EDADES, LOCALIDADES, ROLES, ROLES_ETIQUETAS, clavesDe, type Pregunta, type Rol, type Valor } from "@/lib/encuesta";
import type { FilaRespuesta } from "@/lib/tipos";

// Paleta categórica validada (OKLCH, daltonismo y contraste) sobre la superficie oscura #141414.
const CATEGORICA = ["#B08F00", "#CE1126", "#2F7FC1", "#2E9E6A", "#9B5FD0", "#7A7A7A"];
const BARRA = "#FCD116";
const EJE = "rgba(255,255,255,0.55)";
const REJILLA = "rgba(255,255,255,0.08)";
const SIN = "Sin respuesta o no aplica";

type Dato = { nombre: string; valor: number; pct: number };

function conteo(filas: FilaRespuesta[], obtener: (f: FilaRespuesta) => Valor | null | undefined, opciones: readonly string[]): Dato[] {
  const mapa = new Map<string, number>(opciones.map((o) => [o, 0]));
  let sin = 0;
  for (const f of filas) {
    const v = obtener(f);
    if (v == null || v === "") sin++;
    else mapa.set(String(v), (mapa.get(String(v)) ?? 0) + 1);
  }
  const n = filas.length || 1;
  const datos = Array.from(mapa, ([nombre, valor]) => ({ nombre, valor, pct: (valor / n) * 100 }));
  if (sin) datos.push({ nombre: SIN, valor: sin, pct: (sin / n) * 100 });
  return datos;
}

/** Selección múltiple: personas que marcaron cada opción (el % es sobre el total del grupo). */
function conteoMultiple(filas: FilaRespuesta[], clave: string, opciones: readonly string[]): Dato[] {
  const n = filas.length || 1;
  const datos = opciones.map((o) => {
    const valor = filas.filter((f) => {
      const v = f.detalle?.[clave];
      return Array.isArray(v) && v.includes(o);
    }).length;
    return { nombre: o, valor, pct: (valor / n) * 100 };
  });
  const sin = filas.filter((f) => !Array.isArray(f.detalle?.[clave]) || !(f.detalle[clave] as string[]).length).length;
  if (sin) datos.push({ nombre: SIN, valor: sin, pct: (sin / n) * 100 });
  return datos;
}

const fmtPct = (n: number) => `${n.toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`;
const fmtNum = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 2 });

function Consejo({ active, payload }: { active?: boolean; payload?: { payload: Dato }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/15 bg-[#141414] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-blanco">{d.nombre}</p>
      <p className="text-white/70">
        {d.valor.toLocaleString("es-CO")} respuestas · {fmtPct(d.pct)}
      </p>
    </div>
  );
}

function Tarjeta({ titulo, nota, datos, children }: { titulo: string; nota?: string; datos: Dato[]; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#141414] p-5">
      <h3 className="font-bold leading-snug">{titulo}</h3>
      {nota && <p className="mt-0.5 text-xs text-white/55">{nota}</p>}
      <div className="mt-4">{children}</div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-white/55 hover:text-white">Ver tabla de datos</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-white/55">
            <tr>
              <th className="py-1 font-normal">Opción</th>
              <th className="py-1 text-right font-normal">Respuestas</th>
              <th className="py-1 text-right font-normal">%</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((d) => (
              <tr key={d.nombre} className="border-t border-white/5">
                <td className="py-1">{d.nombre}</td>
                <td className="py-1 text-right tabular-nums">{d.valor}</td>
                <td className="py-1 text-right tabular-nums">{fmtPct(d.pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

function Barras({ datos }: { datos: Dato[] }) {
  const alto = Math.max(140, datos.length * 30 + 30);
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={datos} layout="vertical" margin={{ left: 4, right: 40, top: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={REJILLA} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: EJE, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="nombre"
          width={150}
          tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<Consejo />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
        <Bar
          dataKey="valor"
          isAnimationActive={false}
          fill={BARRA}
          radius={[0, 4, 4, 0]}
          barSize={18}
          label={{ position: "right", fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Torta({ datos }: { datos: Dato[] }) {
  const visibles = datos.filter((d) => d.valor > 0);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={visibles}
          dataKey="valor"
          nameKey="nombre"
          innerRadius="45%"
          outerRadius="80%"
          paddingAngle={1}
          stroke="#141414"
          strokeWidth={2}
          label={({ x, y, textAnchor, pct }: Dato & { x: number; y: number; textAnchor: "start" | "middle" | "end" }) =>
            pct >= 6 ? (
              <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill="rgba(255,255,255,0.85)" fontSize={12}>
                {fmtPct(pct)}
              </text>
            ) : null
          }
          labelLine={false}
          isAnimationActive={false}
        >
          {visibles.map((d) => (
            <Cell key={d.nombre} fill={CATEGORICA[Math.max(0, datos.indexOf(d)) % CATEGORICA.length]} />
          ))}
        </Pie>
        <Tooltip content={<Consejo />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={9}
          formatter={(v: string) => <span className="text-xs text-white/80">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Gráfica de una pregunta de rol, según su tipo. */
function GraficaPregunta({ p, filas }: { p: Pregunta; filas: FilaRespuesta[] }) {
  const titulo = `${p.codigo}. ${p.titulo}`;
  const condicional = p.mostrar ? "Solo se pregunta a una parte del grupo. " : "";

  switch (p.tipo) {
    case "unica":
    case "autorizacion": {
      const datos = conteo(filas, (f) => f.detalle?.[p.id], p.opciones);
      return (
        <Tarjeta titulo={titulo} nota={condicional || undefined} datos={datos}>
          <Barras datos={datos} />
        </Tarjeta>
      );
    }
    case "multiple": {
      const datos = conteoMultiple(filas, p.id, p.opciones);
      return (
        <Tarjeta
          titulo={titulo}
          nota={`${condicional}${p.max ? `Hasta ${p.max} opciones` : "Selección múltiple"}: personas que marcaron cada opción.`}
          datos={datos}
        >
          <Barras datos={datos} />
        </Tarjeta>
      );
    }
    case "escala": {
      const notas = filas.map((f) => f.detalle?.[p.id]).filter((v): v is number => typeof v === "number");
      const prom = notas.length ? notas.reduce((s, v) => s + v, 0) / notas.length : null;
      const datos = conteo(filas, (f) => f.detalle?.[p.id], ["1", "2", "3", "4", "5"]);
      return (
        <Tarjeta titulo={titulo} nota={`${condicional}1 = ${p.extremos[0]} · 5 = ${p.extremos[1]}`} datos={datos}>
          <p className="mb-3">
            <span className="text-3xl font-bold tabular-nums">{prom != null ? fmtNum(prom) : "—"}</span>
            <span className="text-sm text-white/60"> promedio sobre 5 · {notas.length} respuestas</span>
          </p>
          <Barras datos={datos} />
        </Tarjeta>
      );
    }
    case "doble":
      return (
        <>
          {p.partes.map((pt) => {
            const datos = conteo(filas, (f) => f.detalle?.[pt.id], pt.opciones);
            return (
              <Tarjeta key={pt.id} titulo={`${p.codigo}. ${pt.etiqueta}`} datos={datos}>
                <Barras datos={datos} />
              </Tarjeta>
            );
          })}
        </>
      );
    case "abierta": {
      const textos = filas
        .map((f) => f.detalle?.[p.id])
        .filter((v): v is string => typeof v === "string" && v.trim() !== "");
      return (
        <section className="rounded-3xl border border-white/10 bg-[#141414] p-5 lg:col-span-2">
          <h3 className="font-bold leading-snug">{titulo}</h3>
          <p className="mt-0.5 text-xs text-white/55">
            Pregunta abierta · {textos.length} respuestas{textos.length > 60 ? " (se muestran las 60 más recientes; todas están en el CSV)" : ""}
          </p>
          {textos.length ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {textos.slice(0, 60).map((t, i) => (
                <li key={i} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/85">
                  {t}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-white/55">Todavía no hay respuestas.</p>
          )}
        </section>
      );
    }
  }
}

export function Panel({ filas, totalContactos, aviso }: { filas: FilaRespuesta[]; totalContactos: number; aviso: string | null }) {
  const [rolSel, setRolSel] = useState<string>("");
  const [localidad, setLocalidad] = useState("");
  const [edad, setEdad] = useState("");

  const rol: Rol | undefined = ROLES.find((r) => r.etiqueta === rolSel);

  const filtradas = useMemo(
    () =>
      filas.filter(
        (f) => (!rolSel || f.rol === rolSel) && (!localidad || f.localidad === localidad) && (!edad || f.edad === edad),
      ),
    [filas, rolSel, localidad, edad],
  );

  const porRol = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of filas) m.set(f.rol, (m.get(f.rol) ?? 0) + 1);
    return m;
  }, [filas]);

  const g = useMemo(() => {
    const origenes = Array.from(new Set(filtradas.map((f) => f.origen ?? "directo")));
    return {
      rol: conteo(filtradas, (f) => f.rol, ROLES_ETIQUETAS),
      edad: conteo(filtradas, (f) => f.edad, EDADES),
      localidad: conteo(filtradas, (f) => f.localidad, LOCALIDADES).sort((a, b) => b.valor - a.valor),
      origen: conteo(filtradas, (f) => f.origen ?? "directo", origenes).sort((a, b) => b.valor - a.valor),
    };
  }, [filtradas]);

  function descargarCsv() {
    // Con un rol elegido: solo sus filas y sus columnas. Con "Todos": todas las filas y las columnas de los 4 roles.
    const roles = rol ? [rol] : ROLES;
    const filasCsv = rol ? filas.filter((f) => f.rol === rol.etiqueta) : filas;
    const claves = roles.flatMap((x) => x.preguntas.flatMap(clavesDe));
    const base = ["id", "fecha", "rol", "localidad", "edad", "origen"] as const;
    const celda = (v: Valor | undefined) => (Array.isArray(v) ? v.join(", ") : v);
    const csv = aCsv(
      [...base, ...claves.map((c) => c.etiqueta)],
      filasCsv.map((f) => [...base.map((b) => f[b]), ...claves.map((c) => celda(f.detalle?.[c.clave]))]),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    const sufijo = rol ? `-${rol.corto.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[̀-ͯ]/g, "")}` : "";
    a.download = `respuestas-futsala${sufijo}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const ultima = filas[0]?.fecha
    ? new Date(filas[0].fecha).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" })
    : "—";
  const filtrando = Boolean(localidad || edad);
  const selectCls =
    "min-h-[44px] rounded-xl border border-white/20 bg-negro px-3 text-sm focus:border-amarillo focus:outline focus:outline-2 focus:outline-amarillo";
  const pestanaCls = (activa: boolean) =>
    `min-h-[44px] rounded-full border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amarillo ${
      activa ? "border-amarillo bg-amarillo text-negro" : "border-white/20 text-white/85 hover:border-white/40"
    }`;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Bandera className="mb-3 w-16" />
          <h1 className="text-2xl font-bold">Resultados de la encuesta</h1>
          <p className="text-sm text-white/60">Encuestas dirigidas futsala.co y Liga de Fútbol de Salón de Bogotá</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={descargarCsv} className="btn-primario min-h-[44px] text-sm" disabled={!filas.length}>
            {rol ? `Descargar CSV de ${rol.corto.toLowerCase()}` : "Descargar todo (CSV)"}
          </button>
          <a href="/api/admin/contactos" className="btn-secundario min-h-[44px] text-sm">
            Contactos WhatsApp (CSV)
          </a>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="btn-secundario min-h-[44px] text-sm">
              Salir
            </button>
          </form>
        </div>
      </header>

      {aviso && (
        <p role="status" className="mt-5 rounded-2xl border border-amarillo/40 bg-amarillo/10 px-4 py-3 text-sm text-amarillo">
          {aviso}
        </p>
      )}

      {/* Rol */}
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Encuesta por rol">
        <button type="button" aria-pressed={!rolSel} className={pestanaCls(!rolSel)} onClick={() => setRolSel("")}>
          Todos <span className="font-normal opacity-75">({filas.length})</span>
        </button>
        {ROLES.map((x) => (
          <button
            key={x.etiqueta}
            type="button"
            aria-pressed={rolSel === x.etiqueta}
            className={pestanaCls(rolSel === x.etiqueta)}
            onClick={() => setRolSel(x.etiqueta)}
          >
            {x.corto} <span className="font-normal opacity-75">({porRol.get(x.etiqueta) ?? 0})</span>
          </button>
        ))}
      </nav>

      {/* Filtros */}
      <div className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          Localidad
          <select value={localidad} onChange={(e) => setLocalidad(e.target.value)} className={selectCls}>
            <option value="">Todas</option>
            {LOCALIDADES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          Edad
          <select value={edad} onChange={(e) => setEdad(e.target.value)} className={selectCls}>
            <option value="">Todas</option>
            {EDADES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        {filtrando && (
          <button type="button" className="btn-secundario min-h-[44px] text-sm" onClick={() => (setLocalidad(""), setEdad(""))}>
            Quitar filtros
          </button>
        )}
      </div>

      {/* Indicadores */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          {
            t: rol || filtrando ? "Respuestas (filtradas)" : "Total de respuestas",
            v: filtradas.length.toLocaleString("es-CO"),
            s: rol || filtrando ? `de ${filas.length.toLocaleString("es-CO")}` : undefined,
          },
          { t: "Contactos WhatsApp", v: totalContactos.toLocaleString("es-CO"), s: "tabla separada" },
          { t: "Última respuesta", v: ultima, chico: true },
        ].map((k) => (
          <div key={k.t} className="rounded-2xl border border-white/10 bg-[#141414] p-4 last:col-span-2 lg:last:col-span-1">
            <p className="text-xs text-white/60">{k.t}</p>
            <p className={`mt-1 font-bold tabular-nums ${k.chico ? "text-base" : "text-3xl"}`}>{k.v}</p>
            {k.s && <p className="text-xs text-white/50">{k.s}</p>}
          </div>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-10 text-center text-white/60">Todavía no hay respuestas{rol || filtrando ? " con estos filtros" : ""}.</p>
      ) : (
        <>
          <h2 className="mt-8 text-lg font-bold">Datos iniciales</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {!rol && (
              <Tarjeta titulo="Rol" datos={g.rol}>
                <Torta datos={g.rol} />
              </Tarjeta>
            )}
            <Tarjeta titulo="Rango de edad" datos={g.edad}>
              <Barras datos={g.edad} />
            </Tarjeta>
            <Tarjeta titulo="Localidad" datos={g.localidad}>
              <Barras datos={g.localidad} />
            </Tarjeta>
            <Tarjeta titulo="Origen (utm_source)" datos={g.origen}>
              <Barras datos={g.origen} />
            </Tarjeta>
          </div>

          {rol ? (
            <>
              <h2 className="mt-8 text-lg font-bold">Encuesta para {rol.corto.toLowerCase()}</h2>
              <p className="text-xs text-white/55">
                Los porcentajes son sobre {filtradas.length.toLocaleString("es-CO")} personas. &quot;{SIN}&quot; incluye preguntas
                opcionales sin responder y preguntas que se saltaron.
              </p>
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                {rol.preguntas.map((p) => (
                  <GraficaPregunta key={p.id} p={p} filas={filtradas} />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-8 rounded-2xl border border-white/10 bg-[#141414] p-4 text-sm text-white/70">
              Elige un rol arriba para ver las gráficas de sus preguntas.
            </p>
          )}
        </>
      )}
    </main>
  );
}
