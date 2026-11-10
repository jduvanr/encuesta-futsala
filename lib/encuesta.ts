export const EDADES = ["Menos de 18", "18 a 25", "26 a 35", "36 a 45", "Más de 45"] as const;

export const LOCALIDADES = [
  "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito", "Bosa",
  "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos", "Teusaquillo",
  "Los Mártires", "Antonio Nariño", "Puente Aranda", "La Candelaria",
  "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz", "Fuera de Bogotá",
] as const;

export const FRECUENCIAS = [
  "Cada semana", "Cada mes", "Solo finales o partidos especiales", "Casi nunca",
] as const;

export const CANALES = ["Instagram", "Facebook", "TikTok", "YouTube", "WhatsApp", "Voz a voz"] as const;

export const PREFERENCIAS = [
  "Partido completo en vivo", "Resumen", "Solo goles", "Historias y detrás de cámaras", "Entrevistas",
] as const;

export const ASPECTOS = [
  { id: "seguridad", etiqueta: "Seguridad" },
  { id: "comodidad", etiqueta: "Comodidad" },
  { id: "banos", etiqueta: "Baños" },
  { id: "comida", etiqueta: "Comida" },
] as const;

export const PAGOS = ["No", "Sí hasta 5.000 pesos", "Sí hasta 10.000 pesos", "Sí más de 10.000 pesos"] as const;

export type AspectoId = (typeof ASPECTOS)[number]["id"];

export type Respuestas = {
  autorizacion: boolean;
  edad: string | null;
  localidad: string | null;
  frecuencia: string | null;
  canales: string[];
  preferencia: string | null;
  seguridad: number | null;
  comodidad: number | null;
  banos: number | null;
  comida: number | null;
  pago_final: string | null;
};

export const RESPUESTAS_INICIALES: Respuestas = {
  autorizacion: false,
  edad: null,
  localidad: null,
  frecuencia: null,
  canales: [],
  preferencia: null,
  seguridad: null,
  comodidad: null,
  banos: null,
  comida: null,
  pago_final: null,
};

type Base = { id: string; titulo: string; ayuda?: string; obligatoria: boolean };

export type Pregunta =
  | (Base & { tipo: "casilla"; campo: "autorizacion"; texto: string })
  | (Base & { tipo: "unica"; campo: "edad" | "frecuencia" | "preferencia" | "pago_final"; opciones: readonly string[] })
  | (Base & { tipo: "desplegable"; campo: "localidad"; opciones: readonly string[] })
  | (Base & { tipo: "multiple"; campo: "canales"; opciones: readonly string[] })
  | (Base & { tipo: "cuadricula"; filas: typeof ASPECTOS });

/**
 * Las 8 preguntas. Para volver obligatoria una pregunta cambia `obligatoria` a true.
 */
export const PREGUNTAS: Pregunta[] = [
  {
    id: "autorizacion",
    tipo: "casilla",
    campo: "autorizacion",
    titulo: "Autorización de datos",
    texto:
      "Autorizo el tratamiento de mis datos personales según la Ley 1581 de 2012, solo con fines estadísticos de este estudio.",
    obligatoria: true,
  },
  { id: "edad", tipo: "unica", campo: "edad", titulo: "¿Cuál es tu rango de edad?", opciones: EDADES, obligatoria: true },
  {
    id: "localidad",
    tipo: "desplegable",
    campo: "localidad",
    titulo: "¿En qué localidad vives?",
    opciones: LOCALIDADES,
    obligatoria: true,
  },
  {
    id: "frecuencia",
    tipo: "unica",
    campo: "frecuencia",
    titulo: "¿Con qué frecuencia vas a ver partidos en vivo?",
    opciones: FRECUENCIAS,
    obligatoria: false,
  },
  {
    id: "canales",
    tipo: "multiple",
    campo: "canales",
    titulo: "¿Dónde te enteras de partidos y resultados?",
    ayuda: "Puedes marcar varias opciones.",
    opciones: CANALES,
    obligatoria: false,
  },
  {
    id: "preferencia",
    tipo: "unica",
    campo: "preferencia",
    titulo: "¿Qué te gusta ver más?",
    opciones: PREFERENCIAS,
    obligatoria: false,
  },
  {
    id: "escenarios",
    tipo: "cuadricula",
    titulo: "Califica de 1 a 5 la experiencia en los escenarios",
    ayuda: "1 es muy mala y 5 es excelente.",
    filas: ASPECTOS,
    obligatoria: false,
  },
  {
    id: "pago_final",
    tipo: "unica",
    campo: "pago_final",
    titulo: "¿Pagarías por ver una final en vivo por internet?",
    opciones: PAGOS,
    obligatoria: false,
  },
];

/** Devuelve un mensaje de error si la pregunta obligatoria no está respondida. */
export function validar(p: Pregunta, r: Respuestas): string | null {
  if (!p.obligatoria) return null;
  switch (p.tipo) {
    case "casilla":
      return r.autorizacion ? null : "Para continuar debes autorizar el tratamiento de tus datos.";
    case "unica":
      return r[p.campo] ? null : "Elige una opción para continuar.";
    case "desplegable":
      return r[p.campo] ? null : "Elige tu localidad para continuar.";
    case "multiple":
      return r.canales.length ? null : "Marca al menos una opción para continuar.";
    case "cuadricula":
      return p.filas.every((f) => r[f.id] != null) ? null : "Califica todos los aspectos para continuar.";
  }
}

/** Celular colombiano: 10 dígitos que empiezan por 3. Acepta espacios, guiones y +57. */
export function normalizarWhatsapp(valor: string): string | null {
  let d = valor.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("57")) d = d.slice(2);
  return /^3\d{9}$/.test(d) ? d : null;
}
