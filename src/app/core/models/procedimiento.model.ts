export type PrioridadProcedimiento = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type EstadoProcedimiento = 'Programado' | 'En proceso' | 'Completado' | 'Cancelado';

export interface NotaProcedimiento {
  id: string;
  fecha: string;
  hora: string;
  usuario: string;
  nota: string;
}

export interface Procedimiento {
  id: string;
  empresa_id: string;
  empresa_nombre: string | null;
  paciente: {
    id: string;
    nombre: string;
    especie: string;
    raza: string | null;
    edad_estimada: string | null;
  } | null;
  propietario: {
    nombre: string;
    celular: string | null;
    numero_identificacion: string | null;
  } | null;
  veterinario_id: string | null;
  veterinario_nombre: string;
  procedimiento: string;
  categoria: string;
  diagnostico: string | null;
  fecha: string;
  hora: string;
  duracion: string | null;
  sala: string;
  prioridad: PrioridadProcedimiento;
  estado: EstadoProcedimiento;
  servicio_id?: string | null;
  servicio?: {
    id: string;
    nombre: string;
    precio: number;
  } | null;
  cuenta_atencion_id?: string | null;
  indicaciones: string | null;
  observaciones: string | null;
  notas: NotaProcedimiento[];
}

export interface ProcedimientoPayload {
  paciente_id?: string;
  veterinario_id: string;
  servicio_id?: string | null;
  cuenta_atencion_id?: string | null;
  procedimiento: string;
  categoria: string;
  diagnostico?: string | null;
  fecha: string;
  hora: string;
  duracion?: string | null;
  sala: string;
  prioridad: PrioridadProcedimiento;
  estado?: 'Programado' | 'En proceso';
  indicaciones?: string | null;
  observaciones?: string | null;
}

export interface NotaProcedimientoPayload {
  nota: string;
}

export interface ResumenProcedimientos {
  total: number;
  programados: number;
  en_proceso: number;
  completados: number;
  alta_prioridad: number;
  total_notas: number;
}
