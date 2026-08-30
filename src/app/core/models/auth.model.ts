export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface Rol {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface Empresa {
  id: string;
  nombre: string;
  razon_social: string | null;
  nit: string | null;
  correo: string | null;
  zona_horaria: string;
  estado: 'activa' | 'inactiva' | 'suspendida';
}

export interface Modulo {
  id: string;
  codigo: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  celular: string;
  fecha_nacimiento: string;
  correo: string;
  es_super_administrador: boolean;
  activo: boolean;
  rol: Rol;
  empresa: Empresa;
  modulos: Modulo[];
}

export interface LoginResponse {
  message: string;
  token: string;
  token_type: 'Bearer';
  usuario: UsuarioAutenticado;
}

export interface PerfilUsuarioPayload {
  nombre: string;
  celular?: string | null;
  correo: string;
  fecha_nacimiento?: string | null;
}