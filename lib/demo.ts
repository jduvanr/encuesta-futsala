import { CANALES, EDADES, FRECUENCIAS, LOCALIDADES, PAGOS, PREFERENCIAS } from "./encuesta";
import type { FilaRespuesta } from "./tipos";

/** Datos ficticios para ver el panel sin Supabase (solo en desarrollo). */
export function datosDemo(n = 140): FilaRespuesta[] {
  let s = 42;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  function elegir<T>(arr: readonly T[], pesos?: number[]): T {
    if (!pesos) return arr[Math.floor(rnd() * arr.length)];
    const total = pesos.reduce((a, b) => a + b, 0);
    let x = rnd() * total;
    for (let i = 0; i < arr.length; i++) if ((x -= pesos[i]) <= 0) return arr[i];
    return arr[arr.length - 1];
  }
  const nota = () => 1 + Math.floor(rnd() * 5);
  return Array.from({ length: n }, (_, i) => ({
    id: `demo-${i}`,
    fecha: new Date(Date.now() - i * 3_600_000 * 5).toISOString(),
    autorizacion: true,
    edad: elegir(EDADES, [10, 35, 28, 15, 12]),
    localidad: elegir(LOCALIDADES),
    frecuencia: elegir(FRECUENCIAS, [30, 30, 25, 15]),
    canales: CANALES.filter(() => rnd() > 0.55),
    preferencia: elegir(PREFERENCIAS, [35, 25, 20, 12, 8]),
    seguridad: nota(),
    comodidad: nota(),
    banos: nota(),
    comida: nota(),
    pago_final: elegir(PAGOS, [30, 35, 22, 13]),
    origen: elegir(["qr_escenarios", "instagram", "whatsapp", "directo"]),
  }));
}
