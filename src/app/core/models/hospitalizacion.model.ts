export type PrioridadHospitalizacion = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type EstadoHospitalizacion = 'Hospitalizado' | 'En observación' | 'Listo para salida' | 'Finalizado';
export type EstadoEvolucion = 'Estable' | 'Mejorando' | 'Mejorado' | 'Sin cambios' | 'Empeorando' | 'Crítico';

export interface EvolucionHospitalizacion {
  id: string;
  fecha: string;
  hora: string;
  usuario: string;
  estado: string;
  observaciones: string;
}

export interface Hospitalizacion {
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
  motivo: string;
  diagnostico: string | null;
  fecha_ingreso: string;
  hora_ingreso: string;
  fecha_salida_estimada: string;
  fecha_alta: string | null;
  hora_alta: string | null;
  ubicacion: string;
  prioridad: PrioridadHospitalizacion;
  estado: EstadoHospitalizacion;
  observaciones: string | null;
  evoluciones: EvolucionHospitalizacion[];
}

export interface HospitalizacionPayload {
  paciente_id?: string;
  veterinario_id: string;
  motivo: string;
  diagnostico?: string | null;
  fecha_ingreso: string;
  hora_ingreso: string;
  fecha_salida_estimada: string;
  ubicacion: string;
  prioridad: PrioridadHospitalizacion;
  estado?: 'Hospitalizado' | 'En observación' | 'Listo para salida';
  observaciones?: string | null;
}

export interface EvolucionPayload {
  estado: EstadoEvolucion;
  observaciones: string;
}

export interface ResumenHospitalizacion {
  total: number;
  hospitalizados: number;
  en_observacion: number;
  listos_salida: number;
  criticos: number;
  total_evoluciones: number;
}
