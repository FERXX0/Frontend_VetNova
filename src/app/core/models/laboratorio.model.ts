import { PropietarioResumen } from './historia-clinica.model';

export type EstadoSolicitud =
    | 'Solicitado'
    | 'Muestra recibida'
    | 'En procesamiento'
    | 'Resultado disponible'
    | 'Finalizado'
    | 'Cancelado';

export type PrioridadSolicitud = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export interface PacienteSolicitud {
    id: string;
    nombre: string;
    especie: string;
    raza: string | null;
    edad_estimada: string | null;
}

export interface ResultadoLaboratorio {
    id: string;
    parametro: string;
    resultado: string;
    unidad: string | null;
    referencia: string | null;
    observacion: string | null;
}

export interface NotaLaboratorio {
    id: string;
    fecha: string;
    hora: string;
    usuario: string;
    nota: string;
}

export interface SolicitudLaboratorio {
    id: string;
    empresa_id: string;
    empresa_nombre?: string | null;
    paciente: PacienteSolicitud | null;
    propietario: PropietarioResumen | null;
    veterinario_id: string | null;
    veterinario_nombre: string;
    examen: string;
    categoria: string;
    diagnostico: string | null;
    fecha_solicitud: string;
    hora_solicitud: string;
    fecha_resultado_estimada: string | null;
    laboratorio: string;
    muestra: string;
    prioridad: PrioridadSolicitud;
    estado: EstadoSolicitud;
    observaciones: string | null;
    resultados: ResultadoLaboratorio[];
    notas: NotaLaboratorio[];
}

export interface ResumenLaboratorio {
    total: number;
    pendientes: number;
    en_procesamiento: number;
    con_resultados: number;
    urgentes: number;
    total_notas: number;
}

export interface SolicitudPayload {
    paciente_id: string;
    veterinario_id: string;
    examen: string;
    categoria: string;
    diagnostico: string | null;
    fecha_solicitud: string;
    hora_solicitud: string;
    fecha_resultado_estimada: string | null;
    laboratorio: string;
    muestra: string;
    prioridad: string;
    estado: string;
    observaciones: string | null;
}

export interface ResultadoPayload {
    parametro: string;
    resultado: string;
    unidad: string | null;
    referencia: string | null;
    observacion: string | null;
}

export interface NotaPayload {
    nota: string;
}