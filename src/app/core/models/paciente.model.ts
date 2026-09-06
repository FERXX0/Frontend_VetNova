export type EstadoPaciente = 'activo' | 'inactivo' | 'fallecido';
export type SexoPaciente = 'macho' | 'hembra' | 'indefinido';

export interface Propietario {
  id?: string;
  nombre: string;
  tipo_identificacion?: string;
  numero_identificacion?: string;
  celular?: string;
  correo?: string;
  direccion?: string;
}

export interface Paciente {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
  sexo: SexoPaciente;
  fecha_nacimiento?: string;
  edad_estimada?: string;
  peso_kg?: number;
  color?: string;
  microchip?: string;
  estado: EstadoPaciente;
  notas?: string;
  propietario: Propietario;
  creado_en?: string;
  actualizado_en?: string;
}

export interface PacientePayload {
  nombre: string;
  especie: string;
  raza?: string;
  sexo: SexoPaciente;
  fecha_nacimiento?: string;
  peso_kg?: number;
  color?: string;
  microchip?: string;
  estado: EstadoPaciente;
  notas?: string;
  // Datos del propietario capturados en el formulario
  propietario_nombre: string;
  propietario_tipo_identificacion?: string;
  propietario_numero_identificacion?: string;
  propietario_celular?: string;
  propietario_correo?: string;
  propietario_direccion?: string;
}
