
export interface HistorialTarifa {
  id: string;
  empresa_id: string;
  servicio_id: string;
  usuario_id: string | null;
  precio_anterior: string;
  precio_nuevo: string;
  motivo: string | null;
  creado_en: string;
}
