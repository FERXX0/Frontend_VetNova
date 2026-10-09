export interface MedicamentoFormulacion {
  id?: string;
  medicamento_id?: string | null;
  nombre: string;
  concentracion: string;
  presentacion?: string | null;
  cantidad: number;
  dosis_cantidad?: number | null;
  dosis_unidad?: string | null;
  frecuencia_horas?: number | null;
  duracion_dias?: number | null;
  unidad: string;
  frecuencia: string;
  duracion: string;
  via: string;
  indicaciones?: string | null;
}

export interface FormulacionPaciente {
  id: string;
  nombre: string;
  especie: string;
  raza?: string | null;
  edad_estimada?: string | null;
}

export interface FormulacionPropietario {
  nombre: string;
  celular?: string | null;
  numero_identificacion?: string | null;
}

export interface FormulacionFila {
  id: string;
  numero: string;
  fecha: string;
  estado: 'Activa' | 'Finalizada' | 'Cancelada';
  diagnostico: string;
  observaciones?: string | null;
  veterinario_id?: string | null;
  veterinario_nombre: string;
  paciente?: FormulacionPaciente | null;
  propietario?: FormulacionPropietario | null;
  empresa_nombre?: string;
  medicamentos: MedicamentoFormulacion[];
}

export interface FormulacionPayload {
  paciente_id: string;
  veterinario_id?: string | null;
  diagnostico: string;
  observaciones?: string | null;
  medicamentos: MedicamentoFormulacion[];
}

export interface ResumenFormulaciones {
  total: number;
  activas: number;
  finalizadas: number;
  total_medicamentos: number;
}
