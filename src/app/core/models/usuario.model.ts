import { PaginacionLaravel } from './empresa.model';
import { Rol } from './auth.model';

export interface UsuarioEmpresaResumen {
  id: string;
  nombre: string;
}

/**
 * Usuario tal como lo devuelve el listado global (GET /api/usuarios)
 * y el listado por empresa (GET /api/empresas/{empresa}/usuarios).
 * Espejo de App\Models\Usuario (backend).
 */
export interface Usuario {
  id: string;
  empresa_id: string;
  empresa?: UsuarioEmpresaResumen;
  rol_id: string;
  rol?: Rol;
  nombre: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  celular?: string | null;
  fecha_nacimiento?: string | null;
  correo: string;
  activo: boolean;
  es_super_administrador: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

// Lo que exige UsuarioRequest al crear/editar (contrasena solo obligatoria al crear)
export interface UsuarioPayload {
  rol_id: string;
  nombre: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  celular?: string | null;
  fecha_nacimiento?: string | null;
  correo: string;
  contrasena?: string;
  activo?: boolean;
}

export interface FiltrosUsuariosGlobal {
  buscar?: string;
  empresa_id?: string;
  rol_id?: string;
  activo?: '1' | '0';
  page?: number;
}

export type PaginacionUsuarios = PaginacionLaravel<Usuario>;
