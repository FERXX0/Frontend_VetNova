import { PaginacionLaravel } from './empresa.model';

export type EstadoEsquemaVD = 'Al día' | 'Próxima' | 'Vencida' | 'Sin esquema';

export interface PropietarioResumen {
  nombre: string;
  celular?: string | null;
  numero_identificacion?: string | null;
}

export interface Vacuna {
  id: string;
  empresa_id: string;
  paciente_id: string;
  veterinario_id: string | null;
  veterinario_nombre: string;
  nombre: string;
  tipo: string;
  lote: string | null;
  fecha_aplicacion: string;
  proxima_fecha: string;
  observaciones: string | null;
  creado_en?: string;
  actualizado_en?: string;
}

export interface Desparasitacion {
  id: string;
  empresa_id: string;
  paciente_id: string;
  veterinario_id: string | null;
  veterinario_nombre: string;
  producto: string;
  tipo: string;
  fecha_aplicacion: string;
  proxima_fecha: string;
  observaciones: string | null;
  creado_en?: string;
  actualizado_en?: string;
}

export interface EsquemaPacienteFila {
  id: string;
  empresa_id: string;
  empresa_nombre?: string;
  nombre: string;
  especie: string;
  raza: string | null;
  edad_estimada: string | null;
  propietario: PropietarioResumen | null;
  ultima_vacuna: string | null;
  proxima_vacuna: string | null;
  total_vacunas: number;
  total_desparasitaciones: number;
  estado: EstadoEsquemaVD;
}

export interface EsquemaPacienteDetalle extends EsquemaPacienteFila {
  vacunas: Vacuna[];
  desparasitaciones: Desparasitacion[];
}

export interface ResumenEsquemaVD {
  total_pacientes: number;
  total_vacunas: number;
  total_desparasitaciones: number;
  al_dia: number;
  proximas: number;
  vencidas: number;
  sin_esquema: number;
}

export interface VacunaPayload {
  veterinario_id: string;
  nombre: string;
  tipo: string;
  lote?: string | null;
  fecha_aplicacion: string;
  proxima_fecha: string;
  observaciones?: string | null;
}

export interface DesparasitacionPayload {
  veterinario_id: string;
  producto: string;
  tipo: string;
  fecha_aplicacion: string;
  proxima_fecha: string;
  observaciones?: string | null;
}
