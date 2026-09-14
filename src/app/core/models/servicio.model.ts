import { TipoConsulta } from './cita.model';

/**
 * Catálogo de Servicios / Tipos de servicio de la empresa.
 * Espejo de app/Models/Servicio.php (backend).
 */
export interface Servicio {
  id: string;
  empresa_id?: string;
  nombre: string;
  descripcion?: string | null;
  tipo_consulta: TipoConsulta;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface ServicioPayload {
  nombre: string;
  descripcion?: string | null;
  tipo_consulta: TipoConsulta;
  duracion_minutos: number;
  precio: number;
  activo?: boolean;
}
