export type TipoAtencion = 'consulta' | 'urgencia' | 'hospitalizacion' | 'procedimiento' | 'laboratorio' | 'otra';
export type EstadoAtencion = 'abierta' | 'finalizada' | 'cancelada';
export interface CuentaAtencion { id: string; estado: string; subtotal: string; descuentos: string; impuestos: string; total: string; pagado: string; cerrada_en: string | null; }
export interface AtencionVeterinaria {
  id: string; paciente_id: string; propietario_id: string; tipo: TipoAtencion; estado: EstadoAtencion;
  motivo: string | null; iniciada_en: string; finalizada_en: string | null;
  paciente?: { id: string; nombre: string }; propietario?: { id: string; nombre: string };
  cuenta?: CuentaAtencion;
}
export interface PaginaAtenciones { data: AtencionVeterinaria[]; current_page: number; last_page: number; total: number; }
