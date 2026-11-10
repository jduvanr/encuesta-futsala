/** Datos generales del sitio. Cambia aquí lo que necesites. */
export const SITIO = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  titulo: "¿Cómo vives el fútbol de salón en Bogotá?",
  descripcion:
    "Estudio de futsala.co con la Liga de Fútbol de Salón de Bogotá. Elige tu rol y responde entre 3 y 4 minutos.",
  tiempoEstimado: "3 a 4 minutos",
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
