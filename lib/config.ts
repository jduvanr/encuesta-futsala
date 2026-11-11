/** Datos generales del sitio. Cambia aquí lo que necesites. */
export const SITIO = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  titulo: "Tu VOZ también cuenta, micrero",
  descripcion:
    "Encuesta distrital del fútbol de salón y el microfútbol en Bogotá. Elige tu rol y responde en 3 a 7 minutos.",
  tiempoEstimado: "3 a 7 minutos",
  // Correo para que los participantes ejerzan sus derechos (Ley 1581). CÁMBIALO por uno real.
  correoDatos: "futsalabogotatv@gmail.com",
  responsable: "futsala.co",
} as const;

export const REDES = {
  youtube: "https://www.youtube.com/channel/UCYCgGBhseQMEd6syQqsbveQ",
  youtubeSuscribir: "https://www.youtube.com/channel/UCYCgGBhseQMEd6syQqsbveQ?sub_confirmation=1",
  instagram: "https://www.instagram.com/futsala.tv/",
  tiktok: "https://www.tiktok.com/@futsala.co",
  facebook: "https://www.facebook.com/futsala.co",
} as const;

/** Clave de localStorage para evitar respuestas duplicadas. */
export const CLAVE_LOCAL = "futsala-encuesta-bogota-v2";
