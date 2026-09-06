export type EstadoSuscripcion = 'prueba' | 'activa' | 'vencida' | 'en_mora' | 'cancelada';

export type PeriodoSuscripcion = 'mensual' | 'trimestral' | 'semestral' | 'anual';

export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio_mensual: string;
  precio_anual: string | null;
  moneda: string;
  maximo_usuarios: number | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Suscripcion {
  id: string;
  empresa_id: string;
  plan_id: string;
  estado: EstadoSuscripcion;
  periodo: PeriodoSuscripcion;
  monto: string;
  moneda: string;
  inicia_en: string;
  finaliza_en: string | null;
  prueba_finaliza_en: string | null;
  cancelada_en: string | null;
  creado_en: string;
  actualizado_en: string;
  plan: Plan;
}

export interface SuscripcionPayload {
  plan_id: string;
  estado: EstadoSuscripcion;
  periodo: PeriodoSuscripcion;
  monto: number;
  moneda: string;
  inicia_en: string;
  finaliza_en?: string | null;
  prueba_finaliza_en?: string | null;
}

export interface PaginacionLaravel<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}