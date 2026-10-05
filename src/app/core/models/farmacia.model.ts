export interface MovimientoMedicamento {
  id: string;
  tipo: 'Entrada' | 'Salida' | 'Ajuste';
  cantidad: number;
  fecha: string;
  motivo: string;
  responsable: string;
}

export interface Medicamento {
  id: string;
  empresa_id?: string;
  codigo: string;
  nombre: string;
  principioActivo: string;
  principio_activo?: string;
  concentracion: string;
  presentacion: string;
  categoria: string;
  laboratorio: string;
  lote: string;
  fechaVencimiento: string;
  fecha_vencimiento?: string;
  stock: number;
  stockMinimo: number;
  stock_minimo?: number;
  unidad: string;
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
  concentracion: string;
  presentacion: string;
  categoria: string;
  laboratorio: string;
  lote: string;
  fechaVencimiento: string;
  stock: number;
  stockMinimo: number;
  unidad: string;
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
}

export interface ResumenFarmacia {
  total_medicamentos: number;
  medicamentos_activos: number;
  stock_bajo: number;
  proximos_vencer: number;
  valor_inventario: number;
  categorias: string[];
}
