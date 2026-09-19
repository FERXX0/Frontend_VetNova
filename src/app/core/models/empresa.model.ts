export type EstadoEmpresa = 'activa' | 'inactiva' | 'suspendida';

export interface Empresa {
  id: string;
  nombre: string;
  razon_social: string | null;
  nit: string | null;
  correo: string | null;
  zona_horaria: string;
  estado: 'activa' | 'inactiva' | 'suspendida';
  es_empresa_sistema: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

// Lo que exige EmpresaRequest al crear/editar
export interface EmpresaPayload {
  nombre: string;
  razon_social?: string | null;
  nit?: string | null;
  correo?: string | null;
  zona_horaria: string;
  estado: EstadoEmpresa;
}

// Laravel pagina con ->paginate(), esta es la forma estándar de esa respuesta
export interface PaginacionLaravel<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}