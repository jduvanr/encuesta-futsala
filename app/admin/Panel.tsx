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
import { ASPECTOS, CANALES, EDADES, FRECUENCIAS, LOCALIDADES, PAGOS, PREFERENCIAS } from "@/lib/encuesta";
import type { FilaRespuesta } from "@/lib/tipos";

// Paleta categórica validada (OKLCH, daltonismo y contraste) sobre la superficie oscura #141414.
const CATEGORICA = ["#B08F00", "#CE1126", "#2F7FC1", "#2E9E6A", "#9B5FD0", "#7A7A7A"];
const BARRA = "#FCD116";
const EJE = "rgba(255,255,255,0.55)";
const REJILLA = "rgba(255,255,255,0.08)";

type Dato = { nombre: string; valor: number; pct: number };

function conteo(filas: FilaRespuesta[], obtener: (f: FilaRespuesta) => string | null, opciones: readonly string[]): Dato[] {
  const mapa = new Map<string, number>(opciones.map((o) => [o, 0]));
  let sin = 0;
  for (const f of filas) {
    const v = obtener(f);
    if (v == null) sin++;
    else mapa.set(v, (mapa.get(v) ?? 0) + 1);
  }
  const n = filas.length || 1;
  const datos = Array.from(mapa, ([nombre, valor]) => ({ nombre, valor, pct: (valor / n) * 100 }));
  if (sin) datos.push({ nombre: "Sin respuesta", valor: sin, pct: (sin / n) * 100 });
  return datos;
}

const fmtPct = (n: number) => `${n.toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`;

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
      <h2 className="font-bold">{titulo}</h2>
      {nota && <p className="text-xs text-white/55">{nota}</p>}
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

function Barras({ datos, horizontal = false }: { datos: Dato[]; horizontal?: boolean }) {
  const alto = horizontal ? Math.max(180, datos.length * 30 + 30) : 240;
  return (
    <ResponsiveContainer width="100%" height={alto}>
      {horizontal ? (
        <BarChart data={datos} layout="vertical" margin={{ left: 4, right: 40, top: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={REJILLA} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: EJE, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="nombre"
            width={130}
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
      ) : (
        <BarChart data={datos} margin={{ left: -20, right: 4, top: 16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={REJILLA} />
          <XAxis dataKey="nombre" tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fill: EJE, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<Consejo />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          <Bar
            dataKey="valor"
            isAnimationActive={false}
            fill={BARRA}
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
            label={{ position: "top", fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
          />
        </BarChart>
      )}
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

export function Panel({ filas, totalContactos, aviso }: { filas: FilaRespuesta[]; totalContactos: number; aviso: string | null }) {
  const [localidad, setLocalidad] = useState("");
  const [edad, setEdad] = useState("");

  const filtradas = useMemo(
    () => filas.filter((f) => (!localidad || f.localidad === localidad) && (!edad || f.edad === edad)),
    [filas, localidad, edad],
  );

  const g = useMemo(() => {
    const n = filtradas.length || 1;
    const canales = CANALES.map((c) => {
      const valor = filtradas.filter((f) => f.canales?.includes(c)).length;
      return { nombre: c, valor, pct: (valor / n) * 100 };
    });
    const origenes = Array.from(new Set(filtradas.map((f) => f.origen ?? "directo")));
    const promedios = ASPECTOS.map((a) => {
      const notas = filtradas.map((f) => f[a.id]).filter((v): v is number => v != null);
      const prom = notas.length ? notas.reduce((s, v) => s + v, 0) / notas.length : 0;
      return { nombre: a.etiqueta, valor: Number(prom.toFixed(2)), pct: (notas.length / n) * 100, n: notas.length };
    });
    const conNota = promedios.filter((p) => p.n);
    return {
      edad: conteo(filtradas, (f) => f.edad, EDADES),
      localidad: conteo(filtradas, (f) => f.localidad, LOCALIDADES).sort((a, b) => b.valor - a.valor),
      frecuencia: conteo(filtradas, (f) => f.frecuencia, FRECUENCIAS),
      canales,
      preferencia: conteo(filtradas, (f) => f.preferencia, PREFERENCIAS),
      pago: conteo(filtradas, (f) => f.pago_final, PAGOS),
      origen: conteo(filtradas, (f) => f.origen ?? "directo", origenes).sort((a, b) => b.valor - a.valor),
      promedios,
      general: conNota.length ? conNota.reduce((s, p) => s + p.valor, 0) / conNota.length : null,
    };
  }, [filtradas]);

  function descargarCsv() {
    const cols = [
      "id", "fecha", "autorizacion", "edad", "localidad", "frecuencia", "canales", "preferencia",
      "seguridad", "comodidad", "banos", "comida", "pago_final", "origen",
    ] as const;
    const csv = aCsv(
      [...cols],
      filas.map((f) => cols.map((c) => (c === "canales" ? (f.canales ?? []).join(", ") : f[c]))),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `respuestas-futsala-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const ultima = filas[0]?.fecha
    ? new Date(filas[0].fecha).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" })
    : "—";
  const filtrando = Boolean(localidad || edad);
  const selectCls =
    "min-h-[44px] rounded-xl border border-white/20 bg-negro px-3 text-sm focus:border-amarillo focus:outline focus:outline-2 focus:outline-amarillo";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Bandera className="mb-3 w-16" />
          <h1 className="text-2xl font-bold">Resultados de la encuesta</h1>
          <p className="text-sm text-white/60">¿Cómo vives el fútbol de salón en Bogotá?</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={descargarCsv} className="btn-primario min-h-[44px] text-sm" disabled={!filas.length}>
            Descargar respuestas (CSV)
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

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4">
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
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { t: filtrando ? "Respuestas (filtradas)" : "Total de respuestas", v: filtradas.length.toLocaleString("es-CO"), s: filtrando ? `de ${filas.length.toLocaleString("es-CO")}` : undefined },
          { t: "Promedio escenarios", v: g.general != null ? g.general.toLocaleString("es-CO", { maximumFractionDigits: 2 }) : "—", s: "sobre 5" },
          { t: "Contactos WhatsApp", v: totalContactos.toLocaleString("es-CO"), s: "tabla separada" },
          { t: "Última respuesta", v: ultima, chico: true },
        ].map((k) => (
          <div key={k.t} className="rounded-2xl border border-white/10 bg-[#141414] p-4">
            <p className="text-xs text-white/60">{k.t}</p>
            <p className={`mt-1 font-bold tabular-nums ${k.chico ? "text-base" : "text-3xl"}`}>{k.v}</p>
            {k.s && <p className="text-xs text-white/50">{k.s}</p>}
          </div>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-10 text-center text-white/60">Todavía no hay respuestas{filtrando ? " con estos filtros" : ""}.</p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-[#141414] p-5 lg:col-span-2">
            <h2 className="font-bold">Calificación promedio de los escenarios</h2>
            <p className="text-xs text-white/55">Escala de 1 (muy mala) a 5 (excelente)</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {g.promedios.map((p) => (
                <li key={p.nombre} className="rounded-2xl border border-white/10 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">{p.nombre}</span>
                    <span className="text-2xl font-bold tabular-nums">
                      {p.n ? p.valor.toLocaleString("es-CO", { maximumFractionDigits: 2 }) : "—"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10" aria-hidden="true">
                    <div className="h-full rounded-full bg-amarillo" style={{ width: `${(p.valor / 5) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-white/50">{p.n} calificaciones</p>
                </li>
              ))}
            </ul>
          </section>

          <Tarjeta titulo="Rango de edad" datos={g.edad}>
            <Barras datos={g.edad} horizontal />
          </Tarjeta>
          <Tarjeta titulo="Frecuencia de asistencia a partidos" datos={g.frecuencia}>
            <Torta datos={g.frecuencia} />
          </Tarjeta>
          <Tarjeta titulo="Localidad" datos={g.localidad}>
            <Barras datos={g.localidad} horizontal />
          </Tarjeta>
          <div className="grid gap-4">
            <Tarjeta titulo="Dónde se enteran de partidos" nota="Selección múltiple: personas que marcaron cada canal (el % en la tabla es sobre el total)" datos={g.canales}>
              <Barras datos={g.canales} horizontal />
            </Tarjeta>
            <Tarjeta titulo="Origen (utm_source)" datos={g.origen}>
              <Barras datos={g.origen} horizontal />
            </Tarjeta>
          </div>
          <Tarjeta titulo="Qué les gusta ver más" datos={g.preferencia}>
            <Barras datos={g.preferencia} horizontal />
          </Tarjeta>
          <Tarjeta titulo="¿Pagarían por ver una final en vivo?" datos={g.pago}>
            <Torta datos={g.pago} />
          </Tarjeta>
        </div>
      )}
    </main>
  );
}
