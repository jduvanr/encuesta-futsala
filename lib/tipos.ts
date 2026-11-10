export type FilaRespuesta = {
  id: string;
  fecha: string;
  autorizacion: boolean;
  edad: string;
  localidad: string;
  frecuencia: string | null;
  canales: string[];
  preferencia: string | null;
  seguridad: number | null;
  comodidad: number | null;
  banos: number | null;
  comida: number | null;
  pago_final: string | null;
  origen: string | null;
};
