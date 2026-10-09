export interface MovimientoMedicamento {
  id: string;
  tipo: 'Entrada' | 'Salida' | 'Ajuste';
  cantidad: number;
  fecha: string;
  motivo: string;
  responsable: string;
  factura_id?: string | null;
  precio_unitario?: number | null;
  total?: number | null;
  comprador_nombre?: string | null;
  comprador_identificacion?: string | null;
  comprador_celular?: string | null;
}

export interface Medicamento {
  id: string;
  empresa_id?: string;
  codigo: string;
  nombre: string;
  principioActivo: string;
  principio_activo?: string;
  concentracion: number;
  concentracion_unidad: string;
  presentacion: string;
  categoria: string;
  laboratorio: string;
  lote: string;
  fechaVencimiento: string;
  fecha_vencimiento?: string;
  stock: number;
  stockMinimo: number;
  stock_minimo?: number;
  visible_en_formulaciones: boolean;
  visible_en_evoluciones: boolean;
  ubicacion: string;
  precioCompra: number;
  precio_compra?: number;
  precioVenta: number;
  precio_venta?: number;
  estado: 'Activo' | 'Inactivo';
  movimientos: MovimientoMedicamento[];
}

export interface FormularioMedicamento {
  nombre: string;
  principioActivo: string;
  concentracion: number;
  concentracion_unidad: string;
  presentacion: string;
  categoria: string;
  laboratorio: string;
  lote: string;
  fechaVencimiento: string;
  stock: number;
  stockMinimo: number;
  visible_en_formulaciones: boolean;
  visible_en_evoluciones: boolean;
  ubicacion: string;
  precioCompra: number;
  precioVenta: number;
}

export interface FormularioMovimiento {
  tipo: 'Entrada' | 'Salida' | 'Ajuste';
  cantidad: number;
  motivo: string;
  responsable: string;
  fecha?: string;
  comprador_nombre?: string;
  comprador_identificacion?: string;
  comprador_celular?: string;
}

export interface ResumenFarmacia {
  total_medicamentos: number;
  medicamentos_activos: number;
  stock_bajo: number;
  proximos_vencer: number;
  valor_inventario: number;
  categorias: string[];
}
