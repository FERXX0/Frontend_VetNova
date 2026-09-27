import { Modulo } from './auth.model';

export type MonedaModulo = 'COP' | 'USD';

/**
 * Registro de aprovisionamiento de un módulo para una empresa puntual.
 * Espejo de App\Models\ModuloEmpresa (backend).
 */
export interface ModuloEmpresaRegistro {
  id: string;
  empresa_id: string;
  modulo_id: string;
  modulo?: Modulo;
  activo: boolean;
  monto_mensual: number;
  moneda: MonedaModulo;
  vence_en?: string | null;
  creado_en?: string;
  actualizado_en?: string;
}

export interface ModuloEmpresaPayload {
  modulo_id: string;
  activo: boolean;
  monto_mensual: number;
  moneda: MonedaModulo;
  vence_en?: string | null;
}