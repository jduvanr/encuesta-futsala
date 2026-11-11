/**
 * Encuestas dirigidas futsala.co y Liga de Fútbol de Salón de Bogotá.
 *
 * Flujo: bloque inicial (B1 a B4) → la pregunta de rol (B2) decide cuál de las 7 encuestas sigue.
 * Todas las preguntas son obligatorias salvo las marcadas con `opcional: true`.
 * Si cambias opciones de B2, B3 o B4, actualiza también las restricciones en supabase/schema.sql.
 */

// ── Tipos ────────────────────────────────────────────────────────────
export type Valor = string | string[] | number;
export type Respuestas = Record<string, Valor | undefined>;

type Base = {
  /** Clave con la que se guarda la respuesta (en `detalle` para las preguntas de rol). */
  id: string;
  /** Código del documento (B1, J4, A8…). Se usa en el panel y en el CSV. */
  codigo: string;
  titulo: string;
  ayuda?: string;
  opcional?: boolean;
  /** Si existe y devuelve false, la pregunta se salta. */
  mostrar?: (r: Respuestas) => boolean;
};

export type Parte = { id: string; etiqueta: string; opciones: readonly string[] };

export type Pregunta =
  | (Base & { tipo: "autorizacion"; texto: string; opciones: readonly [string, string] })
  | (Base & { tipo: "unica"; opciones: readonly string[]; desplegable?: boolean })
  | (Base & { tipo: "multiple"; opciones: readonly string[]; max?: number; exclusivas?: readonly string[] })
  | (Base & { tipo: "escala"; extremos: readonly [string, string] })
  | (Base & { tipo: "abierta"; max: number })
  | (Base & { tipo: "doble"; partes: readonly Parte[] })
  | (Base & { tipo: "cuadricula"; filas: readonly { id: string; etiqueta: string }[]; extremos: readonly [string, string] });

const NO_RESPONDER = "Prefiero no responder";

// ── Bloque inicial (todas las encuestas) ────────────────────────────
export const AUTORIZA = "Sí autorizo";
export const NO_AUTORIZA = "No autorizo";

export const ROLES_ETIQUETAS = [
  "Jugador o jugadora",
  "Aficionado o espectador",
  "Entrenador o cuerpo técnico",
  "Organizador de torneos o liga",
  "Periodista",
  "Creador de contenido",
  "Patrocinador o marca",
] as const;

export const LOCALIDADES = [
  "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito", "Bosa",
  "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos", "Teusaquillo",
  "Los Mártires", "Antonio Nariño", "Puente Aranda", "La Candelaria",
  "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz",
  "Soacha", "Otro municipio de Cundinamarca", "Otro lugar",
] as const;

export const EDADES = ["Menos de 14", "14 a 17", "18 a 25", "26 a 35", "36 a 45", "46 o más"] as const;
const MENORES: readonly string[] = ["Menos de 14", "14 a 17"];

export const BLOQUE_INICIAL: Pregunta[] = [
  {
    id: "autorizacion",
    codigo: "B1",
    tipo: "autorizacion",
    titulo: "Autorización de datos",
    texto:
      "Autorizo a futsala.co y a la Liga de Fútbol de Salón de Bogotá a tratar mis datos con fines estadísticos y de mejora del deporte, según la Ley 1581 de 2012. Si soy menor de 18 años, respondo con permiso de mi acudiente.",
    opciones: [AUTORIZA, NO_AUTORIZA],
  },
  {
    id: "rol",
    codigo: "B2",
    tipo: "unica",
    titulo: "¿Cuál es tu rol en el fútbol de salón y el microfútbol?",
    ayuda: "Según tu respuesta te mostramos las preguntas que te corresponden.",
    opciones: ROLES_ETIQUETAS,
  },
  {
    id: "localidad",
    codigo: "B3",
    tipo: "unica",
    desplegable: true,
    titulo: "¿En qué localidad de Bogotá vives?",
    opciones: LOCALIDADES,
  },
  { id: "edad", codigo: "B4", tipo: "unica", titulo: "¿En qué rango de edad estás?", opciones: EDADES },
];

// ── Jugadores ───────────────────────────────────────────────────────
/** Infantil o Juvenil y menor de 18: salta J3 a J12 y pasa a J13. */
const jugadorAdulto = (r: Respuestas) =>
  !(["Infantil", "Juvenil"].includes(String(r.j1_categoria)) && MENORES.includes(String(r.edad)));

const JUGADORES: Pregunta[] = [
  {
    id: "j1",
    codigo: "J1",
    tipo: "doble",
    titulo: "¿En qué categoría y rama juegas?",
    partes: [
      { id: "j1_categoria", etiqueta: "Categoría", opciones: ["Infantil", "Juvenil", "Única", "Veteranos", "Máster"] },
      { id: "j1_rama", etiqueta: "Rama", opciones: ["Masculina", "Femenina", "Mixta"] },
    ],
  },
  { id: "j2", codigo: "J2", tipo: "unica", titulo: "¿Dónde juegas?", opciones: ["Liga oficial", "Torneos de barrio o locales", "Ambos"] },
  {
    id: "j3",
    codigo: "J3",
    tipo: "unica",
    titulo: "¿Cómo te consideras como jugador?",
    opciones: ["Profesional (vivo del deporte)", "Semiprofesional", "Aficionado o recreativo"],
    mostrar: jugadorAdulto,
  },
  {
    id: "j4",
    codigo: "J4",
    tipo: "unica",
    opcional: true,
    titulo: "¿Recibes algún pago por jugar?",
    opciones: [
      "No recibo nada", "Solo premios o incentivos", "Pago por partido", "Salario mensual",
      "Beca o apoyo (estudio, transporte, alimentación)", NO_RESPONDER,
    ],
    mostrar: jugadorAdulto,
  },
  {
    id: "j5",
    codigo: "J5",
    tipo: "unica",
    titulo: "¿Tienes contrato por escrito con tu equipo o club?",
    opciones: ["Sí, por escrito", "Solo acuerdo verbal", "No tengo ningún acuerdo"],
    mostrar: jugadorAdulto,
  },
  {
    id: "j6",
    codigo: "J6",
    tipo: "unica",
    titulo: "¿Tienes ARL por jugar?",
    opciones: ["Sí, la paga mi equipo", "Sí, la pago yo", "No tengo", "No sé qué es la ARL"],
    mostrar: jugadorAdulto,
  },
  {
    id: "j7",
    codigo: "J7",
    tipo: "multiple",
    titulo: "¿Con cuáles de estas coberturas cuentas?",
    opciones: ["EPS (salud)", "Seguro de accidentes deportivos", "Aportes a pensión", "Ninguna"],
    exclusivas: ["Ninguna"],
    mostrar: jugadorAdulto,
  },
  {
    id: "j8",
    codigo: "J8",
    tipo: "unica",
    titulo: "¿Perteneces a alguna agremiación, sindicato o asociación de jugadores?",
    opciones: ["Sí", "No, pero me gustaría", "No", "No sabía que existen"],
    mostrar: jugadorAdulto,
  },
  {
    id: "j9",
    codigo: "J9",
    tipo: "escala",
    titulo: "¿Qué tanto conoces los derechos laborales que tienes como jugador?",
    extremos: ["Nada", "Muy bien"],
    mostrar: jugadorAdulto,
  },
  {
    id: "j10",
    codigo: "J10",
    tipo: "unica",
    opcional: true,
    titulo: "La última vez que te lesionaste jugando, ¿quién cubrió tu atención médica?",
    opciones: ["La EPS", "La ARL", "Mi equipo o club", "Yo, de mi bolsillo", "Nunca me he lesionado", NO_RESPONDER],
    mostrar: jugadorAdulto,
  },
  {
    id: "j11",
    codigo: "J11",
    tipo: "multiple",
    opcional: true,
    titulo: "Si una lesión te impide jugar, ¿de dónde saldría tu ingreso de respaldo?",
    opciones: [
      "Otro trabajo o negocio", "Ahorros", "Ayuda de mi familia", "Pago o apoyo del equipo",
      "Seguro o ARL", "Colectas o rifas", "No tengo respaldo", NO_RESPONDER,
    ],
    exclusivas: ["No tengo respaldo", NO_RESPONDER],
    mostrar: jugadorAdulto,
  },
  {
    id: "j12",
    codigo: "J12",
    tipo: "unica",
    opcional: true,
    titulo: "¿Cuál es tu principal fuente de ingreso hoy?",
    opciones: [
      "Empleo con contrato", "Trabajo independiente o informal", "Clases o entrenamiento",
      "Dependo de mi familia", "El deporte", "Otra", NO_RESPONDER,
    ],
    mostrar: jugadorAdulto,
  },
  {
    id: "j13",
    codigo: "J13",
    tipo: "multiple",
    titulo: "¿Con cuáles de estos apoyos cuenta tu equipo?",
    opciones: ["Entrenador", "Preparador físico", "Médico o fisioterapeuta", "Apoyo psicológico", "Ninguno"],
    exclusivas: ["Ninguno"],
  },
  {
    id: "j14",
    codigo: "J14",
    tipo: "multiple",
    max: 2,
    titulo: "¿Qué es lo que más te frena para seguir jugando?",
    opciones: [
      "Costos", "Trabajo o estudio", "Horarios", "Lesiones", "Falta de torneos",
      "Falta de pago o apoyo", "Estado de los escenarios",
    ],
  },
  {
    id: "j16",
    codigo: "J16",
    tipo: "unica",
    titulo: "¿Has visto decisiones de los árbitros que consideras erradas?",
    opciones: ["Sí, con frecuencia", "A veces", "Rara vez", "Nunca"],
  },
  {
    id: "j17",
    codigo: "J17",
    tipo: "unica",
    titulo: "¿Crees que esas decisiones erradas influyen en el resultado de los partidos?",
    opciones: ["Sí, mucho", "Algo", "Poco", "Nada"],
    // Solo si en J16 no respondió "Nunca"
    mostrar: (r) => Boolean(r.j16) && r.j16 !== "Nunca",
  },
  {
    id: "j18",
    codigo: "J18",
    tipo: "escala",
    titulo: "¿Cómo percibes el trato de los jueces y árbitros hacia los jugadores?",
    extremos: ["Muy malo", "Muy bueno"],
  },
  { id: "j15", codigo: "J15", tipo: "abierta", opcional: true, max: 300, titulo: "¿Qué cambiarías del fútbol de salón en Bogotá?" },
];

// ── Aficionados ─────────────────────────────────────────────────────
const INFLUYE = ["No influye nada", "Influye mucho"] as const;

const AFICIONADOS: Pregunta[] = [
  {
    id: "a1",
    codigo: "A1",
    tipo: "unica",
    titulo: "¿Con qué frecuencia vas a ver partidos en vivo?",
    opciones: ["Cada semana", "Una o dos veces al mes", "Solo finales o partidos especiales", "Casi nunca"],
  },
  {
    id: "a2",
    codigo: "A2",
    tipo: "multiple",
    titulo: "¿Dónde te enteras de partidos y resultados?",
    opciones: ["Instagram", "Facebook", "TikTok", "YouTube", "WhatsApp", "Voz a voz"],
  },
  {
    id: "a3",
    codigo: "A3",
    tipo: "unica",
    titulo: "¿Has visto transmisiones en vivo de microfútbol o fútbol de salón?",
    opciones: ["Sí, varias veces", "Sí, una vez", "No, no sabía que existían", "No me interesa"],
  },
  {
    id: "a4",
    codigo: "A4",
    tipo: "unica",
    titulo: "¿En qué red social prefieres ver los partidos?",
    opciones: ["Facebook", "YouTube", "Instagram", "TikTok", "Otra", "No veo partidos por redes"],
  },
  {
    id: "a5",
    codigo: "A5",
    tipo: "escala",
    titulo: "¿Qué tanto influye la calidad de la transmisión (imagen, sonido, cámaras) para que veas un partido por redes?",
    extremos: INFLUYE,
  },
  { id: "a6", codigo: "A6", tipo: "escala", titulo: "¿Qué tanto influye el nivel de juego del partido para que lo sigas por redes?", extremos: INFLUYE },
  { id: "a7", codigo: "A7", tipo: "escala", titulo: "¿Qué tanto influye la narración de los partidos para que sigas viéndolos?", extremos: INFLUYE },
  {
    id: "a8",
    codigo: "A8",
    tipo: "unica",
    titulo: "¿Pagarías por ver fútbol de salón bogotano en vivo?",
    opciones: ["No pagaría", "Sí, por una final", "Sí, por un torneo completo", "Sí, con una mensualidad", "Depende del precio"],
  },
  {
    id: "a9",
    codigo: "A9",
    tipo: "unica",
    titulo: "¿Cuánto pagarías?",
    opciones: ["Hasta $5.000", "$5.000 a $10.000", "$10.000 a $20.000", "Más de $20.000"],
    // Solo si en A8 respondió Sí o Depende
    mostrar: (r) => Boolean(r.a8) && r.a8 !== "No pagaría",
  },
  { id: "a10", codigo: "A10", tipo: "unica", titulo: "¿Qué prefieres ver?", opciones: ["Partido completo", "Resumen", "Solo goles", "Historias"] },
  {
    id: "a11",
    codigo: "A11",
    tipo: "multiple",
    titulo: "¿Qué días y horas ves más contenido deportivo?",
    opciones: ["Entre semana en la noche", "Sábado en el día", "Sábado en la noche", "Domingo en el día", "Domingo en la noche"],
  },
  {
    id: "a12",
    codigo: "A12",
    tipo: "multiple",
    max: 2,
    titulo: "¿Qué contenido te gustaría ver más?",
    opciones: ["Entrevistas", "Mejores jugadas", "Estadísticas", "Detrás de cámaras"],
  },
  {
    id: "a13",
    codigo: "A13",
    tipo: "unica",
    opcional: true,
    titulo: "¿Alguna vez has hecho apuestas deportivas?",
    opciones: ["Sí, en partidos de microfútbol o fútbol de salón", "Sí, pero solo en otros deportes", "No, nunca", NO_RESPONDER],
  },
];

// ── Periodistas ─────────────────────────────────────────────────────
const PERIODISTAS: Pregunta[] = [
  {
    id: "pe1",
    codigo: "PE1",
    tipo: "unica",
    titulo: "¿En qué tipo de medio trabajas?",
    opciones: ["Prensa escrita", "Radio", "Televisión", "Medio digital", "Independiente"],
  },
  {
    id: "pe2",
    codigo: "PE2",
    tipo: "unica",
    titulo: "¿Con qué frecuencia cubres fútbol de salón o microfútbol?",
    opciones: ["Cada semana", "Cada mes", "Solo eventos especiales", "Casi nunca"],
  },
  {
    id: "pe3",
    codigo: "PE3",
    tipo: "multiple",
    titulo: "¿Qué torneos cubres más?",
    opciones: ["Liga de Bogotá", "Liga nacional", "Torneos de barrio", "Torneos de colegios", "Selecciones"],
  },
  {
    id: "pe4",
    codigo: "PE4",
    tipo: "cuadricula",
    titulo: "Califica de 1 a 5",
    extremos: ["Muy malo", "Muy bueno"],
    filas: [
      { id: "pe4_escenarios", etiqueta: "Acceso a escenarios" },
      { id: "pe4_datos", etiqueta: "Acceso a datos y resultados" },
      { id: "pe4_atencion", etiqueta: "Atención de ligas y organizadores" },
      { id: "pe4_audiencia", etiqueta: "Interés de la audiencia" },
    ],
  },
  {
    id: "pe5",
    codigo: "PE5",
    tipo: "unica",
    titulo: "¿Cuál es tu mayor dificultad para cubrir este deporte?",
    opciones: ["Falta de información oficial", "Acceso a partidos", "Poco espacio en el medio", "Falta de recursos", "Otro"],
  },
  {
    id: "pe6",
    codigo: "PE6",
    tipo: "unica",
    titulo: "¿Te serviría recibir resultados, estadísticas y fotos oficiales de la liga?",
    opciones: ["Sí", "No", "Tal vez"],
  },
];

// ── Creadores de contenido ──────────────────────────────────────────
const CREADORES: Pregunta[] = [
  {
    id: "cr1",
    codigo: "CR1",
    tipo: "multiple",
    titulo: "¿En qué plataformas publicas?",
    opciones: ["Instagram", "Facebook", "TikTok", "YouTube", "Twitch", "Kick", "WhatsApp"],
  },
  {
    id: "cr2",
    codigo: "CR2",
    tipo: "unica",
    titulo: "¿Qué formato te da más alcance?",
    opciones: ["Transmisiones en vivo", "Reels o videos cortos", "Fotos y carruseles", "Resúmenes", "Historias"],
  },
  {
    id: "cr3",
    codigo: "CR3",
    tipo: "unica",
    titulo: "¿Cuál es tu mayor dificultad?",
    opciones: ["Acceso a escenarios", "Internet en escenarios", "Equipos", "Monetización", "Tiempo"],
  },
  {
    id: "cr4",
    codigo: "CR4",
    tipo: "multiple",
    titulo: "¿Cómo generas ingresos con tu contenido?",
    opciones: ["Patrocinios", "Pago de organizadores", "Pago de equipos", "Monetización de plataformas", "Todavía no genero ingresos"],
    exclusivas: ["Todavía no genero ingresos"],
  },
  {
    id: "cr5",
    codigo: "CR5",
    tipo: "unica",
    titulo: "¿Tienes alianzas con ligas u organizadores?",
    opciones: ["Sí", "No", "Estoy buscando"],
  },
  {
    id: "cr6",
    codigo: "CR6",
    tipo: "unica",
    titulo: "¿Te interesaría trabajar en red con otros creadores del deporte?",
    opciones: ["Sí", "No", "Tal vez"],
  },
];

// ── Patrocinadores ──────────────────────────────────────────────────
const PATROCINADORES: Pregunta[] = [
  {
    id: "pa1",
    codigo: "PA1",
    tipo: "unica",
    titulo: "¿A qué se dedica tu negocio?",
    opciones: ["Comidas y bebidas", "Ropa y deporte", "Salud y bienestar", "Servicios", "Comercio de barrio", "Otro"],
  },
  {
    id: "pa2",
    codigo: "PA2",
    tipo: "unica",
    titulo: "¿Has patrocinado equipos o torneos de microfútbol?",
    opciones: ["Sí, varias veces", "Sí, una vez", "No, pero me interesa", "No"],
  },
  {
    id: "pa3",
    codigo: "PA3",
    tipo: "multiple",
    titulo: "¿Qué tipo de patrocinio das o darías?",
    opciones: ["Dinero", "Uniformes", "Premios", "Productos", "Descuentos"],
  },
  {
    id: "pa4",
    codigo: "PA4",
    tipo: "unica",
    titulo: "¿Qué esperas a cambio?",
    opciones: ["Visibilidad", "Ventas", "Imagen en el barrio", "Apoyar el deporte"],
  },
  {
    id: "pa5",
    codigo: "PA5",
    tipo: "unica",
    titulo: "¿Te interesaría aparecer en transmisiones en vivo y redes sociales?",
    opciones: ["Sí", "No", "Tal vez"],
  },
  {
    id: "pa6",
    codigo: "PA6",
    tipo: "unica",
    titulo: "¿Cuánto podrías invertir por torneo?",
    opciones: ["Menos de $200.000", "$200.000 a $500.000", "$500.000 a $1.000.000", "Más de $1.000.000", "Solo en especie"],
  },
];

// ── Cuerpo técnico ──────────────────────────────────────────────────
const TECNICOS: Pregunta[] = [
  {
    id: "t1",
    codigo: "T1",
    tipo: "unica",
    titulo: "¿Qué cargo tienes?",
    opciones: ["Entrenador principal", "Asistente técnico", "Preparador físico", "Delegado o directivo", "Otro"],
  },
  {
    id: "t2",
    codigo: "T2",
    tipo: "multiple",
    titulo: "¿Con qué categorías trabajas?",
    opciones: ["Infantil", "Juvenil", "Mayores", "Sénior", "Rama femenina"],
  },
  {
    id: "t3",
    codigo: "T3",
    tipo: "unica",
    titulo: "¿Tienes formación certificada como entrenador? (Ley 2210)",
    opciones: ["Sí, certificada", "En proceso", "No, aprendí con la práctica"],
  },
  { id: "t4", codigo: "T4", tipo: "unica", titulo: "¿Cuántos días a la semana entrenan?", opciones: ["1", "2", "3", "4 o más"] },
  { id: "t5", codigo: "T5", tipo: "escala", titulo: "¿Qué tan fácil es conseguir escenario para entrenar?", extremos: ["Muy difícil", "Muy fácil"] },
  {
    id: "t6",
    codigo: "T6",
    tipo: "unica",
    opcional: true,
    titulo: "¿Cómo te pagan por tu trabajo?",
    opciones: [
      "Salario con contrato", "Contrato por prestación de servicios", "Pago informal sin contrato",
      "Voluntario sin pago", NO_RESPONDER,
    ],
  },
  {
    id: "t7",
    codigo: "T7",
    tipo: "multiple",
    opcional: true,
    titulo: "¿Tienes salud, pensión o ARL por este trabajo?",
    opciones: ["Salud", "Pensión", "ARL", "Ninguna por este trabajo", NO_RESPONDER],
    exclusivas: ["Ninguna por este trabajo", NO_RESPONDER],
  },
  {
    id: "t8",
    codigo: "T8",
    tipo: "unica",
    titulo: "¿Usas video, estadísticas o herramientas digitales para analizar partidos?",
    opciones: ["Sí, siempre", "A veces", "No, pero quisiera", "No me interesa"],
  },
  {
    id: "t9",
    codigo: "T9",
    tipo: "multiple",
    max: 2,
    titulo: "¿Qué capacitaciones te gustaría recibir?",
    opciones: ["Táctica", "Preparación física", "Prevención de lesiones", "Psicología deportiva", "Análisis de video", "Primeros auxilios"],
  },
  {
    id: "t10",
    codigo: "T10",
    tipo: "unica",
    titulo: "¿Cuál es el mayor problema para formar jugadores en Bogotá?",
    opciones: ["Falta de escenarios", "Costos", "Falta de torneos", "Poco apoyo de las familias", "Falta de capacitación", "Otro"],
  },
  { id: "t11", codigo: "T11", tipo: "escala", titulo: "Califica de 1 a 5 la organización de los torneos en los que participas", extremos: ["Muy mala", "Muy buena"] },
];

// ── Organizadores ───────────────────────────────────────────────────
const ORGANIZADORES: Pregunta[] = [
  {
    id: "o1",
    codigo: "O1",
    tipo: "multiple",
    titulo: "¿Qué tipo de torneos organizas?",
    opciones: ["Barrio o localidad", "Liga oficial", "Escolar", "Empresarial", "Infantil o juvenil", "Femenino", "Otro"],
  },
  { id: "o2", codigo: "O2", tipo: "unica", titulo: "¿Cuántos equipos participan en promedio?", opciones: ["Menos de 8", "8 a 16", "17 a 32", "Más de 32"] },
  {
    id: "o3",
    codigo: "O3",
    tipo: "multiple",
    titulo: "¿Cómo consigues los escenarios?",
    opciones: ["IDRD", "Escenarios privados", "Colegios", "Alcaldías locales", "Otro"],
  },
  {
    id: "o4",
    codigo: "O4",
    tipo: "multiple",
    max: 2,
    titulo: "¿Cuáles son tus mayores costos?",
    opciones: ["Escenarios", "Arbitraje", "Premiación", "Logística y personal", "Difusión o transmisión", "Permisos"],
  },
  {
    id: "o5",
    codigo: "O5",
    tipo: "multiple",
    titulo: "¿Cómo manejas inscripciones, resultados y tablas?",
    opciones: ["Papel", "Excel", "App", "Página web", "Redes sociales"],
  },
  {
    id: "o6",
    codigo: "O6",
    tipo: "unica",
    titulo: "¿Cuál es tu mayor dificultad?",
    opciones: ["Escenarios", "Arbitraje", "Pagos de los equipos", "Indisciplina", "Permisos"],
  },
  { id: "o7", codigo: "O7", tipo: "unica", titulo: "¿Cuántos patrocinadores tiene tu torneo?", opciones: ["Ninguno", "1 o 2", "3 a 5", "Más de 5"] },
  {
    id: "o8",
    codigo: "O8",
    tipo: "unica",
    titulo: "¿Transmites o publicas contenido de tus partidos?",
    opciones: ["Sí, transmito en vivo", "Solo publico fotos y resultados", "No", "Lo hace otra persona"],
  },
  {
    id: "o9",
    codigo: "O9",
    tipo: "unica",
    titulo: "¿Te interesaría contratar transmisiones, estadísticas o cubrimiento en redes?",
    opciones: ["Sí", "Tal vez, depende del costo", "No"],
  },
  {
    id: "o10",
    codigo: "O10",
    tipo: "unica",
    opcional: true,
    titulo: "¿Cuánto podrías invertir en visibilidad por torneo?",
    opciones: ["Nada", "Hasta $200.000", "$200.000 a $500.000", "$500.000 a $1.000.000", "Más de $1.000.000", NO_RESPONDER],
  },
  {
    id: "o11",
    codigo: "O11",
    tipo: "multiple",
    titulo: "¿Qué garantías ofrece tu torneo a los jugadores?",
    opciones: ["Seguro de accidentes", "Ambulancia o paramédico", "Árbitros con pago", "Reglamento publicado", "Ninguna de estas"],
    exclusivas: ["Ninguna de estas"],
  },
  {
    id: "o12",
    codigo: "O12",
    tipo: "multiple",
    max: 2,
    titulo: "¿Qué apoyo necesitas de la liga o del distrito?",
    opciones: ["Escenarios", "Árbitros", "Capacitación", "Difusión", "Patrocinios", "Permisos"],
  },
];

// ── Roles ───────────────────────────────────────────────────────────
export type Rol = {
  etiqueta: (typeof ROLES_ETIQUETAS)[number];
  corto: string;
  /** Título de la sección que se ve en la barra de progreso. */
  seccion: string;
  preguntas: Pregunta[];
};

export const ROLES: Rol[] = [
  { etiqueta: "Jugador o jugadora", corto: "Jugadores", seccion: "Encuesta para jugadores", preguntas: JUGADORES },
  { etiqueta: "Aficionado o espectador", corto: "Aficionados", seccion: "Encuesta para aficionados", preguntas: AFICIONADOS },
  { etiqueta: "Entrenador o cuerpo técnico", corto: "Cuerpo técnico", seccion: "Encuesta para cuerpo técnico", preguntas: TECNICOS },
  { etiqueta: "Organizador de torneos o liga", corto: "Organizadores", seccion: "Encuesta para organizadores", preguntas: ORGANIZADORES },
  { etiqueta: "Periodista", corto: "Periodistas", seccion: "El fútbol de salón visto desde los medios", preguntas: PERIODISTAS },
  { etiqueta: "Creador de contenido", corto: "Creadores de contenido", seccion: "Creadores del fútbol de salón en Bogotá", preguntas: CREADORES },
  { etiqueta: "Patrocinador o marca", corto: "Patrocinadores", seccion: "Marcas que apoyan el fútbol de salón", preguntas: PATROCINADORES },
];

export const rolDe = (etiqueta: unknown) => ROLES.find((x) => x.etiqueta === etiqueta);

const visible = (p: Pregunta, r: Respuestas) => !p.mostrar || p.mostrar(r);

/** Preguntas que le tocan a esta persona, en orden, según lo que ya respondió. */
export function preguntasVisibles(r: Respuestas): Pregunta[] {
  return [...BLOQUE_INICIAL, ...(rolDe(r.rol)?.preguntas ?? [])].filter((p) => visible(p, r));
}

/** Claves de respuesta de una pregunta (la doble guarda dos) con su etiqueta para el CSV. */
export function clavesDe(p: Pregunta): { clave: string; etiqueta: string }[] {
  if (p.tipo === "doble") return p.partes.map((pt) => ({ clave: pt.id, etiqueta: `${p.codigo} ${pt.etiqueta}` }));
  if (p.tipo === "cuadricula") return p.filas.map((f) => ({ clave: f.id, etiqueta: `${p.codigo} ${f.etiqueta}` }));
  return [{ clave: p.id, etiqueta: `${p.codigo} ${p.titulo}` }];
}

const vacio = (v: Valor | undefined) => v == null || v === "" || (Array.isArray(v) && v.length === 0);

/** Respuestas propias del rol, solo de las preguntas que la persona vio. Se guardan en `detalle`. */
export function detalleDe(r: Respuestas): Record<string, Valor> {
  const rol = rolDe(r.rol);
  const d: Record<string, Valor> = {};
  for (const p of rol?.preguntas ?? []) {
    if (!visible(p, r)) continue;
    for (const { clave } of clavesDe(p)) {
      let v = r[clave];
      if (typeof v === "string") v = v.trim();
      if (!vacio(v)) d[clave] = v as Valor;
    }
  }
  return d;
}

/** Devuelve un mensaje de error si la pregunta no está bien respondida. */
export function validar(p: Pregunta, r: Respuestas): string | null {
  const v = r[p.id];
  if (p.tipo === "multiple" && p.max && Array.isArray(v) && v.length > p.max) return `Elige máximo ${p.max} opciones.`;
  if (p.opcional) return null;
  switch (p.tipo) {
    case "autorizacion":
      return v ? null : "Elige si autorizas o no el tratamiento de tus datos.";
    case "unica":
      return v ? null : p.desplegable ? "Elige una opción de la lista para continuar." : "Elige una opción para continuar.";
    case "multiple":
      return Array.isArray(v) && v.length ? null : "Marca al menos una opción para continuar.";
    case "escala":
      return v != null ? null : "Elige un número del 1 al 5 para continuar.";
    case "abierta":
      return vacio(v) ? "Escribe tu respuesta para continuar." : null;
    case "doble":
      return p.partes.every((pt) => r[pt.id]) ? null : "Responde las dos partes para continuar.";
    case "cuadricula":
      return p.filas.every((f) => r[f.id] != null) ? null : "Califica todas las filas para continuar.";
  }
}

/** Celular colombiano: 10 dígitos que empiezan por 3. Acepta espacios, guiones y +57. */
export function normalizarWhatsapp(valor: string): string | null {
  let d = valor.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("57")) d = d.slice(2);
  return /^3\d{9}$/.test(d) ? d : null;
}
