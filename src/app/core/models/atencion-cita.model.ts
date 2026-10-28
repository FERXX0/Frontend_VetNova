import { Cita } from './cita.model';

export interface MedicamentoAtencion {
  id: string;
  codigo: string;
  nombre: string;
  principio_activo: string;
  concentracion: number;
  concentracion_unidad: string;
  presentacion: string;
  stock: number;
}

export interface MedicamentoAtencionPayload {
  medicamento_id: string;
  dosis_cantidad: number;
  dosis_unidad: string;
  frecuencia_horas: number | null;
  duracion_dias: number;
  via: string;
  indicaciones: string | null;
}

export interface AtencionCitaPayload {
  fecha: string;
  motivo: string;
  peso_kg: number | null;
  temperatura_c: number | null;
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
  evolucion: string | null;
  detalles: Record<string, unknown> | null;
  vacunacion?: {
    nombre: string;
    tipo: 'Antirrábica' | 'Polivalente' | 'Refuerzo' | 'Otra';
    lote: string | null;
    fecha_aplicacion: string;
    proxima_fecha: string;
    observaciones: string | null;
  };
  desparasitacion?: {
    producto: string;
    tipo: 'Interna' | 'Externa' | 'Interna y Externa';
    fecha_aplicacion: string;
    proxima_fecha: string;
    observaciones: string | null;
  };
  medicamentos: MedicamentoAtencionPayload[];
}


export interface HistorialAgendaItem {
  id: string;
  fecha: string | null;
  hora_inicio: string;
  hora_fin: string | null;
  servicio: string | null;
  tipo_consulta: string;
  veterinario: string | null;
  motivo: string;
  estado: string;
  observaciones: string | null;
}

export interface DiagnosticoAnterior {
  fecha: string | null;
  principal_id: string;
  diagnosticos: Array<{ id: string; label: string; description: string }>;
}

export interface AtencionCitaResponse {
  cita: Cita;
  tipo_formato: 'general' | 'vacunacion' | 'desparasitacion' | 'control' | 'cirugia' | 'urgencia' | 'estetica';
  atencion: unknown | null;
  historial_agenda: HistorialAgendaItem[];
  medicamentos: MedicamentoAtencion[];
  diagnostico_anterior: DiagnosticoAnterior | null;
}
