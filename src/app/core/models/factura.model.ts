export interface FacturaDetalle {
  id: string;
  medicamento_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

export interface Factura {
  id: string;
  empresa_id: string;
  numero: string;
  tipo: string;
  estado: string;
  fecha: string;
  tercero_nombre: string;
  tercero_identificacion?: string | null;
  tercero_celular?: string | null;
  subtotal: number;
  total: number;
  observaciones?: string | null;
  detalles: FacturaDetalle[];
}
