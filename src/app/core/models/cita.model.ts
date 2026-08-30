export type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'atendida';
export type TipoConsulta = 'general' | 'vacunacion' | 'desparasitacion' | 'cirugia' | 'urgencia' | 'control' | 'estetica';

export interface Cita {
  id: string;
  paciente_id: string;
  paciente_nombre: string;
  paciente_especie?: string;
  propietario_nombre: string;
  propietario_celular?: string;
  veterinario_id?: string;
  veterinario_nombre: string;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:mm
  hora_fin?: string; // HH:mm
  motivo: string;
  tipo_consulta: TipoConsulta;
  estado: EstadoCita;
  observaciones?: string;
  creado_en?: string;
  actualizado_en?: string;
}

export interface CitaPayload {
  paciente_id: string;
  paciente_nombre: string;
  propietario_nombre?: string;
  propietario_celular?: string;
  veterinario_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin?: string;
  motivo: string;
  tipo_consulta: TipoConsulta;
  estado: EstadoCita;
  observaciones?: string;
}
