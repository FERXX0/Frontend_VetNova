import { EstadoPaciente, SexoPaciente } from './paciente.model';

export interface PropietarioResumen {
  nombre: string | null;
  celular: string | null;
  numero_identificacion: string | null;
}

export interface HistoriaResumen {
  id: string;
  empresa_id: string;
  empresa_nombre?: string | null;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: SexoPaciente;
  estado: EstadoPaciente;
  microchip: string | null;
  edad_estimada: string | null;
  propietario: PropietarioResumen;
  ultima_consulta: string | null;
  total_consultas: number;
}

export interface ConsultaClinica {
  id: string;
  empresa_id: string;
  paciente_id: string;
  veterinario_id: string | null;
  veterinario_nombre: string;
  fecha: string;
  motivo: string;
  peso_kg: string | null;
  temperatura_c: string | null;
  diagnostico: string;
  tratamiento: string | null;
  medicamentos: string | null;
  observaciones: string | null;
  evolucion: string | null;
}

export interface HistoriaDetalle {
  id: string;
  empresa_id: string;
  empresa_nombre?: string | null;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: SexoPaciente;
  estado: EstadoPaciente;
  microchip: string | null;
  fecha_nacimiento: string | null;
  edad_estimada: string | null;
  propietario: PropietarioResumen;
  antecedentes: string | null;
  alergias: string | null;
  observaciones: string | null;
  ultima_consulta: string | null;
  total_consultas: number;
  consultas: ConsultaClinica[];
}

export interface ResumenHistorias {
  total_historias: number;
  activos: number;
  inactivos: number;
  fallecidos: number;
  total_consultas: number;
}

export interface DatosGeneralesPayload {
  antecedentes: string | null;
  alergias: string | null;
  observaciones: string | null;
}

export interface ConsultaPayload {
  veterinario_id: string;
  fecha: string;
  motivo: string;
  peso_kg: number | null;
  temperatura_c: number | null;
  diagnostico: string;
  tratamiento: string | null;
  medicamentos: string | null;
  observaciones: string | null;
  evolucion: string | null;
}
