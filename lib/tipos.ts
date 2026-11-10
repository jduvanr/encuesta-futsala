import type { Valor } from "./encuesta";

/** Una fila de la tabla respuestas_roles. */
export type FilaRespuesta = {
  id: string;
  fecha: string;
  autorizacion: boolean;
  rol: string;
  localidad: string;
  edad: string;
  /** Respuestas propias del rol: { j4: "Pago por partido", j7: ["EPS (salud)"], j9: 3, … } */
  detalle: Record<string, Valor>;
  origen: string | null;
};
