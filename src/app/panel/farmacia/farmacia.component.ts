import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Movimiento {
  id: number;
  tipo: 'Entrada' | 'Salida' | 'Ajuste';
  cantidad: number;
  fecha: string;
  motivo: string;
  responsable: string;
}

interface Medicamento {
  id: number;
  codigo: string;
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

  estado: 'Activo' | 'Inactivo';
  movimientos: Movimiento[];
}

interface FormularioMedicamento {
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

interface FormularioMovimiento {
  tipo: 'Entrada' | 'Salida' | 'Ajuste';
  cantidad: number;
  motivo: string;
  responsable: string;
}

@Component({
  selector: 'app-farmacia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farmacia.component.html',
  styleUrl: './farmacia.component.scss',
})
export class FarmaciaComponent {

  private contador = 7;
  private contadorMovimiento = 30;

  readonly medicamentos = signal<Medicamento[]>([
    {
      id: 1,
      codigo: 'MED-0001',
      nombre: 'Amoxicilina',
      principioActivo: 'Amoxicilina',
      concentracion: '250 mg',
      presentacion: 'Suspensión oral',
      categoria: 'Antibióticos',
      laboratorio: 'Laboratorios VetPharma',
      lote: 'AMX-2601',
      fechaVencimiento: '2027-05-18',
      stock: 42,
      stockMinimo: 15,
      unidad: 'Frascos',
      ubicacion: 'Estante A-01',
      precioCompra: 18500,
      precioVenta: 28000,
      estado: 'Activo',
      movimientos: [
        {
          id: 1,
          tipo: 'Entrada',
          cantidad: 50,
          fecha: '2026-09-01',
          motivo: 'Compra a proveedor',
          responsable: 'Pepito Vetnova',
        },
        {
          id: 2,
          tipo: 'Salida',
          cantidad: 8,
          fecha: '2026-09-10',
          motivo: 'Dispensación',
          responsable: 'Dra. Laura Martínez',
        },
      ],
    },
    {
      id: 2,
      codigo: 'MED-0002',
      nombre: 'Carprofeno',
      principioActivo: 'Carprofeno',
      concentracion: '50 mg',
      presentacion: 'Tabletas',
      categoria: 'Analgésicos',
      laboratorio: 'VetCare',
      lote: 'CAR-2604',
      fechaVencimiento: '2027-02-10',
      stock: 8,
      stockMinimo: 12,
      unidad: 'Tabletas',
      ubicacion: 'Estante A-03',
      precioCompra: 8500,
      precioVenta: 14000,
      estado: 'Activo',
      movimientos: [
        {
          id: 3,
          tipo: 'Entrada',
          cantidad: 30,
          fecha: '2026-08-20',
          motivo: 'Compra a proveedor',
          responsable: 'Pepito Vetnova',
        },
        {
          id: 4,
          tipo: 'Salida',
          cantidad: 22,
          fecha: '2026-09-11',
          motivo: 'Dispensación',
          responsable: 'Dr. Andrés Pérez',
        },
      ],
    },
    {
      id: 3,
      codigo: 'MED-0003',
      nombre: 'Omeprazol',
      principioActivo: 'Omeprazol',
      concentracion: '20 mg',
      presentacion: 'Cápsulas',
      categoria: 'Gastrointestinales',
      laboratorio: 'Animal Health',
      lote: 'OMP-2603',
      fechaVencimiento: '2026-11-25',
      stock: 24,
      stockMinimo: 10,
      unidad: 'Cápsulas',
      ubicacion: 'Estante B-02',
      precioCompra: 4200,
      precioVenta: 7500,
      estado: 'Activo',
      movimientos: [
        {
          id: 5,
          tipo: 'Entrada',
          cantidad: 40,
          fecha: '2026-08-15',
          motivo: 'Compra a proveedor',
          responsable: 'Pepito Vetnova',
        },
        {
          id: 6,
          tipo: 'Salida',
          cantidad: 16,
          fecha: '2026-09-08',
          motivo: 'Dispensación',
          responsable: 'Dra. Laura Martínez',
        },
      ],
    },
    {
      id: 4,
      codigo: 'MED-0004',
      nombre: 'Prednisolona',
      principioActivo: 'Prednisolona',
      concentracion: '5 mg',
      presentacion: 'Tabletas',
      categoria: 'Antiinflamatorios',
      laboratorio: 'VetMed',
      lote: 'PRE-2602',
      fechaVencimiento: '2027-08-30',
      stock: 36,
      stockMinimo: 10,
      unidad: 'Tabletas',
      ubicacion: 'Estante A-05',
      precioCompra: 3100,
      precioVenta: 6000,
      estado: 'Activo',
      movimientos: [
        {
          id: 7,
          tipo: 'Entrada',
          cantidad: 40,
          fecha: '2026-09-03',
          motivo: 'Compra a proveedor',
          responsable: 'Pepito Vetnova',
        },
        {
          id: 8,
          tipo: 'Salida',
          cantidad: 4,
          fecha: '2026-09-12',
          motivo: 'Dispensación',
          responsable: 'Dr. Andrés Pérez',
        },
      ],
    },
    {
      id: 5,
      codigo: 'MED-0005',
      nombre: 'Clorhexidina',
      principioActivo: 'Clorhexidina',
      concentracion: '2%',
      presentacion: 'Solución tópica',
      categoria: 'Antisépticos',
      laboratorio: 'BioVet',
      lote: 'CLX-2512',
      fechaVencimiento: '2026-10-15',
      stock: 7,
      stockMinimo: 10,
      unidad: 'Frascos',
      ubicacion: 'Estante C-01',
      precioCompra: 12500,
      precioVenta: 19000,
      estado: 'Activo',
      movimientos: [
        {
          id: 9,
          tipo: 'Entrada',
          cantidad: 20,
          fecha: '2026-07-10',
          motivo: 'Compra a proveedor',
          responsable: 'Pepito Vetnova',
        },
        {
          id: 10,
          tipo: 'Salida',
          cantidad: 13,
          fecha: '2026-09-09',
          motivo: 'Dispensación',
          responsable: 'Dra. Laura Martínez',
        },
      ],
    },
    {
      id: 6,
      codigo: 'MED-0006',
      nombre: 'Antiparasitario',
      principioActivo: 'Praziquantel',
      concentracion: '100 mg',
      presentacion: 'Tabletas',
      categoria: 'Antiparasitarios',
      laboratorio: 'PetPharma',
      lote: 'PRA-2605',
      fechaVencimiento: '2028-01-20',
      stock: 58,
      stockMinimo: 20,
      unidad: 'Tabletas',
      ubicacion: 'Estante B-05',
      precioCompra: 5200,
      precioVenta: 9000,
      estado: 'Activo',
      movimientos: [
        {
          id: 11,
          tipo: 'Entrada',
          cantidad: 60,
          fecha: '2026-09-05',
          motivo: 'Compra a proveedor',
          responsable: 'Pepito Vetnova',
        },
        {
          id: 12,
          tipo: 'Salida',
          cantidad: 2,
          fecha: '2026-09-13',
          motivo: 'Dispensación',
          responsable: 'Dr. Andrés Pérez',
        },
      ],
    },
  ]);

  readonly busqueda = signal('');
  readonly filtroCategoria = signal('Todas');
  readonly filtroEstado = signal('Todos');
  readonly filtroStock = signal('Todos');

  readonly modalDetalleAbierto = signal(false);
  readonly modalFormularioAbierto = signal(false);
  readonly modalMovimientoAbierto = signal(false);

  readonly medicamentoSeleccionado =
    signal<Medicamento | null>(null);

  readonly modoEdicion = signal(false);
  readonly medicamentoEditandoId = signal<number | null>(null);

  readonly formulario = signal<FormularioMedicamento>(
    this.formularioVacio()
  );

  readonly formularioMovimiento = signal<FormularioMovimiento>(
    this.movimientoVacio()
  );

  readonly categorias = computed(() => {
    const lista = this.medicamentos()
      .map((medicamento) => medicamento.categoria)
      .filter(Boolean);

    return [...new Set(lista)];
  });

  readonly medicamentosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const categoria = this.filtroCategoria();
    const estado = this.filtroEstado();
    const stock = this.filtroStock();

    return this.medicamentos().filter((medicamento) => {

      const coincideTexto =
        !texto ||
        medicamento.codigo.toLowerCase().includes(texto) ||
        medicamento.nombre.toLowerCase().includes(texto) ||
        medicamento.principioActivo.toLowerCase().includes(texto) ||
        medicamento.laboratorio.toLowerCase().includes(texto) ||
        medicamento.lote.toLowerCase().includes(texto);

      const coincideCategoria =
        categoria === 'Todas' ||
        medicamento.categoria === categoria;

      const coincideEstado =
        estado === 'Todos' ||
        medicamento.estado === estado;

      let coincideStock = true;

      if (stock === 'Bajo') {
        coincideStock =
          medicamento.stock <= medicamento.stockMinimo;
      }

      if (stock === 'Disponible') {
        coincideStock =
          medicamento.stock > medicamento.stockMinimo;
      }

      if (stock === 'Agotado') {
        coincideStock = medicamento.stock === 0;
      }

      return (
        coincideTexto &&
        coincideCategoria &&
        coincideEstado &&
        coincideStock
      );
    });
  });

  readonly totalMedicamentos = computed(
    () => this.medicamentos().length
  );

  readonly medicamentosActivos = computed(
    () =>
      this.medicamentos().filter(
        (medicamento) => medicamento.estado === 'Activo'
      ).length
  );

  readonly stockBajo = computed(
    () =>
      this.medicamentos().filter(
        (medicamento) =>
          medicamento.estado === 'Activo' &&
          medicamento.stock <= medicamento.stockMinimo
      ).length
  );

  readonly proximosVencer = computed(() => {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + 90);

    return this.medicamentos().filter((medicamento) => {
      const vencimiento = new Date(
        `${medicamento.fechaVencimiento}T00:00:00`
      );

      return (
        medicamento.estado === 'Activo' &&
        vencimiento >= hoy &&
        vencimiento <= limite
      );
    }).length;
  });

  readonly valorInventario = computed(() =>
    this.medicamentos().reduce(
      (total, medicamento) =>
        total + medicamento.stock * medicamento.precioCompra,
      0
    )
  );

  private formularioVacio(): FormularioMedicamento {
    return {
      nombre: '',
      principioActivo: '',
      concentracion: '',
      presentacion: '',
      categoria: '',
      laboratorio: '',
      lote: '',
      fechaVencimiento: '',
      stock: 0,
      stockMinimo: 0,
      unidad: 'Unidades',
      ubicacion: '',
      precioCompra: 0,
      precioVenta: 0,
    };
  }

  private movimientoVacio(): FormularioMovimiento {
    return {
      tipo: 'Entrada',
      cantidad: 1,
      motivo: '',
      responsable: '',
    };
  }

  abrirDetalle(medicamento: Medicamento): void {
    this.medicamentoSeleccionado.set(medicamento);
    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
  }

  abrirNuevoMedicamento(): void {
    this.modoEdicion.set(false);
    this.medicamentoEditandoId.set(null);
    this.formulario.set(this.formularioVacio());
    this.modalFormularioAbierto.set(true);
  }

  editarMedicamento(medicamento: Medicamento): void {
    this.modoEdicion.set(true);
    this.medicamentoEditandoId.set(medicamento.id);

    this.formulario.set({
      nombre: medicamento.nombre,
      principioActivo: medicamento.principioActivo,
      concentracion: medicamento.concentracion,
      presentacion: medicamento.presentacion,
      categoria: medicamento.categoria,
      laboratorio: medicamento.laboratorio,
      lote: medicamento.lote,
      fechaVencimiento: medicamento.fechaVencimiento,
      stock: medicamento.stock,
      stockMinimo: medicamento.stockMinimo,
      unidad: medicamento.unidad,
      ubicacion: medicamento.ubicacion,
      precioCompra: medicamento.precioCompra,
      precioVenta: medicamento.precioVenta,
    });

    this.modalDetalleAbierto.set(false);
    this.modalFormularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    this.modalFormularioAbierto.set(false);
  }

  actualizarFormulario(
    campo: keyof FormularioMedicamento,
    valor: string | number
  ): void {
    this.formulario.update((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  guardarMedicamento(): void {
    const formulario = this.formulario();

    if (
      !formulario.nombre.trim() ||
      !formulario.principioActivo.trim() ||
      !formulario.concentracion.trim() ||
      !formulario.presentacion.trim() ||
      !formulario.categoria.trim() ||
      !formulario.fechaVencimiento
    ) {
      return;
    }

    const id = this.medicamentoEditandoId();

    if (this.modoEdicion() && id !== null) {

      this.medicamentos.update((medicamentos) =>
        medicamentos.map((medicamento) =>
          medicamento.id === id
            ? {
                ...medicamento,
                ...formulario,
                stock: Number(formulario.stock) || 0,
                stockMinimo:
                  Number(formulario.stockMinimo) || 0,
                precioCompra:
                  Number(formulario.precioCompra) || 0,
                precioVenta:
                  Number(formulario.precioVenta) || 0,
              }
            : medicamento
        )
      );

      this.actualizarSeleccionado(id);

    } else {

      const nuevo: Medicamento = {
        id: this.contador,
        codigo: `MED-${String(this.contador).padStart(4, '0')}`,
        ...formulario,
        stock: Number(formulario.stock) || 0,
        stockMinimo: Number(formulario.stockMinimo) || 0,
        precioCompra: Number(formulario.precioCompra) || 0,
        precioVenta: Number(formulario.precioVenta) || 0,
        estado: 'Activo',
        movimientos: [],
      };

      this.contador++;

      this.medicamentos.update((medicamentos) => [
        nuevo,
        ...medicamentos,
      ]);
    }

    this.modalFormularioAbierto.set(false);
  }

  abrirMovimiento(
    medicamento: Medicamento,
    tipo: FormularioMovimiento['tipo'] = 'Entrada'
  ): void {
    this.medicamentoSeleccionado.set(medicamento);

    this.formularioMovimiento.set({
      ...this.movimientoVacio(),
      tipo,
    });

    this.modalMovimientoAbierto.set(true);
  }

  cerrarMovimiento(): void {
    this.modalMovimientoAbierto.set(false);
  }

  actualizarMovimiento(
    campo: keyof FormularioMovimiento,
    valor: string | number
  ): void {
    this.formularioMovimiento.update((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  guardarMovimiento(): void {
    const medicamento = this.medicamentoSeleccionado();
    const formulario = this.formularioMovimiento();

    if (
      !medicamento ||
      formulario.cantidad <= 0 ||
      !formulario.motivo.trim() ||
      !formulario.responsable.trim()
    ) {
      return;
    }

    let nuevoStock = medicamento.stock;

    if (formulario.tipo === 'Entrada') {
      nuevoStock += Number(formulario.cantidad);
    }

    if (formulario.tipo === 'Salida') {
      nuevoStock -= Number(formulario.cantidad);

      if (nuevoStock < 0) {
        return;
      }
    }

    if (formulario.tipo === 'Ajuste') {
      nuevoStock = Number(formulario.cantidad);
    }

    const movimiento: Movimiento = {
      id: this.contadorMovimiento++,
      tipo: formulario.tipo,
      cantidad: Number(formulario.cantidad),
      fecha: new Date().toISOString().split('T')[0],
      motivo: formulario.motivo,
      responsable: formulario.responsable,
    };

    this.medicamentos.update((medicamentos) =>
      medicamentos.map((item) =>
        item.id === medicamento.id
          ? {
              ...item,
              stock: nuevoStock,
              movimientos: [
                movimiento,
                ...item.movimientos,
              ],
            }
          : item
      )
    );

    this.actualizarSeleccionado(medicamento.id);
    this.modalMovimientoAbierto.set(false);
  }

  cambiarEstado(
    medicamento: Medicamento,
    estado: Medicamento['estado']
  ): void {
    this.medicamentos.update((medicamentos) =>
      medicamentos.map((item) =>
        item.id === medicamento.id
          ? { ...item, estado }
          : item
      )
    );

    this.actualizarSeleccionado(medicamento.id);
  }

  eliminarMedicamento(medicamento: Medicamento): void {
    const confirmar = window.confirm(
      `¿Deseas eliminar el medicamento ${medicamento.nombre}?`
    );

    if (!confirmar) {
      return;
    }

    this.medicamentos.update((medicamentos) =>
      medicamentos.filter((item) => item.id !== medicamento.id)
    );

    this.modalDetalleAbierto.set(false);
    this.medicamentoSeleccionado.set(null);
  }

  actualizarSeleccionado(id: number): void {
    const actualizado = this.medicamentos().find(
      (medicamento) => medicamento.id === id
    );

    this.medicamentoSeleccionado.set(actualizado ?? null);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroCategoria.set('Todas');
    this.filtroEstado.set('Todos');
    this.filtroStock.set('Todos');
  }

  obtenerEstadoStock(medicamento: Medicamento): string {
    if (medicamento.stock === 0) {
      return 'Agotado';
    }

    if (medicamento.stock <= medicamento.stockMinimo) {
      return 'Stock bajo';
    }

    return 'Disponible';
  }

  obtenerDiasParaVencer(fecha: string): number {
    const hoy = new Date();
    const vencimiento = new Date(`${fecha}T00:00:00`);

    const diferencia =
      vencimiento.getTime() - hoy.getTime();

    return Math.ceil(
      diferencia / (1000 * 60 * 60 * 24)
    );
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }
}