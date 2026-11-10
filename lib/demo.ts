import { EDADES, LOCALIDADES, ROLES, type Respuestas, type Valor } from "./encuesta";
import type { FilaRespuesta } from "./tipos";

const TEXTOS = [
  "Más escenarios y mejor iluminación",
  "Que paguen a los árbitros a tiempo",
  "Transmitir más partidos de la liga",
  "Más apoyo a la rama femenina",
  "Seguro para los jugadores",
];

/** Datos ficticios para ver el panel sin Supabase (solo en desarrollo). */
export function datosDemo(n = 160): FilaRespuesta[] {
  let s = 42;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  function elegir<T>(arr: readonly T[], pesos?: number[]): T {
    if (!pesos) return arr[Math.floor(rnd() * arr.length)];
    const total = pesos.reduce((a, b) => a + b, 0);
    let x = rnd() * total;
    for (let i = 0; i < arr.length; i++) if ((x -= pesos[i]) <= 0) return arr[i];
    return arr[arr.length - 1];
  }

  return Array.from({ length: n }, (_, i) => {
    const rol = elegir(ROLES, [40, 35, 15, 10]);
    const r: Respuestas = {
      rol: rol.etiqueta,
      localidad: elegir(LOCALIDADES),
      edad: elegir(EDADES, [6, 12, 34, 26, 13, 9]),
    };
    const detalle: Record<string, Valor> = {};
    for (const p of rol.preguntas) {
      if (p.mostrar && !p.mostrar(r)) continue;
      if (p.opcional && rnd() < 0.2) continue;
      const poner = (k: string, v: Valor) => ((r[k] = v), (detalle[k] = v));
      switch (p.tipo) {
        case "unica":
          poner(p.id, elegir(p.opciones));
          break;
        case "multiple": {
          const libres = p.opciones.filter((o) => !p.exclusivas?.includes(o));
          let marcadas = libres.filter(() => rnd() > 0.6).slice(0, p.max ?? 99);
          if (!marcadas.length) marcadas = [p.exclusivas?.[0] ?? libres[0]];
          poner(p.id, marcadas);
          break;
        }
        case "escala":
          poner(p.id, 1 + Math.floor(rnd() * 5));
          break;
        case "abierta":
          if (rnd() < 0.4) poner(p.id, elegir(TEXTOS));
          break;
        case "doble":
          for (const pt of p.partes) poner(pt.id, elegir(pt.opciones));
          break;
      }
    }
    return {
      id: `demo-${i}`,
      fecha: new Date(Date.now() - i * 3_600_000 * 4).toISOString(),
      autorizacion: true,
      rol: rol.etiqueta,
      localidad: String(r.localidad),
      edad: String(r.edad),
      detalle,
      origen: elegir(["qr_escenarios", "instagram", "whatsapp", "directo"]),
    };
  });
}
