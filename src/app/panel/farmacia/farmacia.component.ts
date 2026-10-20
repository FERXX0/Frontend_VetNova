import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlcanceApi } from '../../core/utils/alcance-api';
import { FormularioMedicamento, FormularioMovimiento, Medicamento, ResumenFarmacia } from '../../core/models/farmacia.model';
import { FarmaciaService } from '../../core/services/farmacia.service';
import { Paciente } from '../../core/models/paciente.model';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import { EmpresaService } from '../../core/services/empresa.service';
import { BuscadorPacienteComponent } from '../../shared/components/buscador-paciente/buscador-paciente';
import { DispensacionFormulacionesComponent } from './dispensacion/dispensacion.component';
import { RegistroPacienteFarmaciaComponent } from './registro-paciente/registro-paciente.component';
import { SessionService } from '../../core/services/session.service';
import { fechaHoyIso } from '../../core/utils/periodo-suscripcion';

@Component({
  selector: 'app-farmacia',
  standalone: true,
  imports: [CommonModule, FormsModule, BuscadorPacienteComponent, DispensacionFormulacionesComponent, RegistroPacienteFarmaciaComponent],
  templateUrl: './farmacia.component.html',
  styleUrl: './farmacia.component.scss',
})
export class FarmaciaComponent implements OnInit {
  private farmaciaService = inject(FarmaciaService);
  private session = inject(SessionService);
  private router = inject(Router);
  private empresaService = inject(EmpresaService);

  readonly hoyIso = fechaHoyIso();
  readonly pendientesDispensar = signal(0);

  readonly responsableActual = computed(() => this.session.usuario()?.nombre ?? '');

  readonly esSuperUsuario = computed(() => this.router.url.startsWith('/super-usuario'));
  readonly empresas = signal<EmpresaOpcion[]>([]);
  readonly empresaIdSeleccionada = signal<string>('');

  readonly alcanceActual = computed<AlcanceApi | undefined>(() => {
    if (!this.esSuperUsuario()) return undefined;
    const empresaId = this.empresaIdSeleccionada();
    return { plataforma: true, empresaId: empresaId || undefined };
  });

  readonly puedeCrearMedicamento = computed(
    () => !this.esSuperUsuario() || !!this.empresaIdSeleccionada()
  );

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly medicamentos = signal<Medicamento[]>([]);
  readonly resumen = signal<ResumenFarmacia | null>(null);

  readonly busqueda = signal('');
  readonly filtroCategoria = signal('Todas');
  readonly filtroEstado = signal('Todos');
  readonly filtroStock = signal('Todos');

  readonly paginaActual = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);
  readonly porPagina = signal(15);

  readonly modalDetalleAbierto = signal(false);
  readonly modalFormularioAbierto = signal(false);
  readonly modalMovimientoAbierto = signal(false);

  readonly medicamentoSeleccionado = signal<Medicamento | null>(null);

  readonly modoEdicion = signal(false);
  readonly medicamentoEditandoId = signal<string | null>(null);
  private readonly empresaEditandoId = signal<string | null>(null);

  readonly formulario = signal<FormularioMedicamento>(this.formularioVacio());
  readonly formularioMovimiento = signal<FormularioMovimiento>(this.movimientoVacio());

  readonly vista = signal<'inventario' | 'dispensacion' | 'registro'>(this.vistaInicial());
  readonly pacienteMovimiento = signal<Paciente | null>(null);

  private vistaInicial(): 'inventario' | 'dispensacion' | 'registro' {
    return this.session.codigoRol() === 'farmacia' ? 'dispensacion' : 'inventario';
  }

  readonly categorias = computed(() => {
    const backendCats = this.resumen()?.categorias ?? [];
    const localCats = this.medicamentos().map(m => m.categoria).filter(Boolean);
    return [...new Set([...backendCats, ...localCats])];
  });

  readonly totalMedicamentos = computed(() => this.resumen()?.total_medicamentos ?? this.totalRegistros());
  readonly medicamentosActivos = computed(() => this.resumen()?.medicamentos_activos ?? 0);
  readonly stockBajo = computed(() => this.resumen()?.stock_bajo ?? 0);
  readonly proximosVencer = computed(() => this.resumen()?.proximos_vencer ?? 0);
  readonly valorInventario = computed(() => this.resumen()?.valor_inventario ?? 0);

  readonly medicamentosFiltrados = computed(() => this.medicamentos());

  alcanceDe(medicamento?: Medicamento | null): AlcanceApi | undefined {
    return this.alcanceParaEmpresa(medicamento?.empresa_id);
  }

  private alcanceParaEmpresa(empresaId?: string | null): AlcanceApi | undefined {
    if (!this.esSuperUsuario()) return undefined;
    return { plataforma: true, empresaId: empresaId || this.empresaIdSeleccionada() || undefined };
  }

  ngOnInit(): void {
    if (this.esSuperUsuario()) {
      this.cargarEmpresas();
    }
    this.cargarDatos();
    this.cargarPendientes();
  }

  cargarEmpresas(): void {
    this.empresaService.listarOpciones().subscribe({
      next: (data) => this.empresas.set(data),
      error: () => this.empresas.set([]),
    });
  }

  alCambiarEmpresa(empresaId: string): void {
    this.empresaIdSeleccionada.set(empresaId);
    this.paginaActual.set(1);
    this.filtroCategoria.set('Todas');
    this.cargarDatos();
    this.cargarPendientes();
  }

  cargarPendientes(): void {
    this.farmaciaService
      .obtenerFormulaciones(this.alcanceActual(), { dispensacion: 'pendientes', per_page: 1 })
      .subscribe({
        next: (resp) => this.pendientesDispensar.set(resp.total),
        error: () => this.pendientesDispensar.set(0),
      });
  }

  alDispensar(): void {
    this.cargarDatos();
    this.cargarPendientes();
  }

  actualizarBanderaMovimiento(valor: boolean): void {
    this.formularioMovimiento.update((actual) => ({
      ...actual,
      actualizar_datos_medicamento: valor,
    }));
  }

  stockResultante(medicamento: Medicamento): number {
    const { tipo, cantidad } = this.formularioMovimiento();
    const valor = Number(cantidad) || 0;

    if (tipo === 'Entrada') return medicamento.stock + valor;
    if (tipo === 'Salida') return medicamento.stock - valor;

    return valor;
  }

  movimientoInvalido(medicamento: Medicamento): boolean {
    const formulario = this.formularioMovimiento();
    const cantidad = Number(formulario.cantidad);

    if (!Number.isFinite(cantidad) || !formulario.motivo.trim()) return true;
    if (formulario.tipo === 'Ajuste') return cantidad < 0;
    if (cantidad <= 0) return true;

    if (formulario.tipo === 'Salida') {
      return cantidad > medicamento.stock || !formulario.comprador_nombre?.trim();
    }

    return false;
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.farmaciaService.obtenerResumen(this.alcanceActual()).subscribe({
      next: (res) => this.resumen.set(res),
      error: () => {},
    });

    this.farmaciaService.obtenerMedicamentos(this.alcanceActual(), {
      busqueda: this.busqueda(),
      categoria: this.filtroCategoria(),
      estado: this.filtroEstado(),
      stock: this.filtroStock(),
      page: this.paginaActual(),
      per_page: this.porPagina(),
    }).subscribe({
      next: (resp) => {
        this.medicamentos.set(resp.data);
        this.paginaActual.set(resp.current_page);
        this.totalPaginas.set(resp.last_page);
        this.totalRegistros.set(resp.total);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar los medicamentos de farmacia.');
        this.cargando.set(false);
      },
    });
  }

  aplicarFiltros(): void {
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas()) {
      this.paginaActual.set(nuevaPagina);
      this.cargarDatos();
    }
  }

  cambiarVista(v: 'inventario' | 'dispensacion' | 'registro'): void {
    this.vista.set(v);
  }

  alSeleccionarPacienteMovimiento(paciente: Paciente): void {
    this.pacienteMovimiento.set(paciente);
  }

  quitarPacienteMovimiento(): void {
    this.pacienteMovimiento.set(null);
  }

  private formularioVacio(): FormularioMedicamento {
    return {
      nombre: '',
      principioActivo: '',
      concentracion: 0,
      concentracion_unidad: 'mg',
      presentacion: '',
      categoria: '',
      laboratorio: '',
      lote: '',
      fechaVencimiento: '',
      stock: 0,
      stockMinimo: 0,
      visible_en_formulaciones: true,
      visible_en_evoluciones: true,
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
      comprador_nombre: '',
      comprador_identificacion: '',
      comprador_celular: '',
      paciente_id: null,
    };
  }

  abrirDetalle(medicamento: Medicamento): void {
    this.farmaciaService.obtenerDetalle(medicamento.id, this.alcanceDe(medicamento)).subscribe({
      next: (det) => {
        this.medicamentoSeleccionado.set(det);
        this.modalDetalleAbierto.set(true);
      },
      error: () => {
        this.medicamentoSeleccionado.set(medicamento);
        this.modalDetalleAbierto.set(true);
      },
    });
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
  }

  abrirNuevoMedicamento(): void {
    if (!this.puedeCrearMedicamento()) return;
    this.modoEdicion.set(false);
    this.medicamentoEditandoId.set(null);
    this.empresaEditandoId.set(null);
    this.formulario.set(this.formularioVacio());
    this.modalFormularioAbierto.set(true);
  }

  editarMedicamento(medicamento: Medicamento): void {
    this.modoEdicion.set(true);
    this.medicamentoEditandoId.set(medicamento.id);
    this.empresaEditandoId.set(medicamento.empresa_id ?? null);

    this.formulario.set({
      nombre: medicamento.nombre,
      principioActivo: medicamento.principioActivo || medicamento.principio_activo || '',
      concentracion: Number(medicamento.concentracion),
      concentracion_unidad: medicamento.concentracion_unidad || 'mg',
      presentacion: medicamento.presentacion,
      categoria: medicamento.categoria,
      laboratorio: medicamento.laboratorio || '',
      lote: medicamento.lote || '',
      fechaVencimiento: medicamento.fechaVencimiento || medicamento.fecha_vencimiento || '',
      stock: medicamento.stock,
      stockMinimo: medicamento.stockMinimo ?? medicamento.stock_minimo ?? 0,
      visible_en_formulaciones: medicamento.visible_en_formulaciones ?? true,
      visible_en_evoluciones: medicamento.visible_en_evoluciones ?? true,
      ubicacion: medicamento.ubicacion || '',
      precioCompra: medicamento.precioCompra ?? medicamento.precio_compra ?? 0,
      precioVenta: medicamento.precioVenta ?? medicamento.precio_venta ?? 0,
    });

    this.modalDetalleAbierto.set(false);
    this.modalFormularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    this.modalFormularioAbierto.set(false);
  }

  actualizarFormulario(campo: keyof FormularioMedicamento, valor: string | number | boolean): void {
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
      formulario.concentracion <= 0 ||
      !formulario.presentacion.trim() ||
      !formulario.categoria.trim() ||
      !formulario.fechaVencimiento
    ) {
      return;
    }

    const id = this.medicamentoEditandoId();

    if (this.modoEdicion() && id !== null) {
      this.farmaciaService.actualizarMedicamento(id, formulario, this.alcanceParaEmpresa(this.empresaEditandoId())).subscribe({
        next: () => {
          this.modalFormularioAbierto.set(false);
          this.cargarDatos();
        },
        error: (err) => {
          alert(err.error?.message ?? 'Error al actualizar medicamento.');
        },
      });
    } else {
      this.farmaciaService.crearMedicamento(formulario, this.alcanceActual()).subscribe({
        next: () => {
          this.modalFormularioAbierto.set(false);
          this.cargarDatos();
        },
        error: (err) => {
          alert(err.error?.message ?? 'Error al crear medicamento.');
        },
      });
    }
  }

  abrirMovimiento(medicamento: Medicamento, tipo: FormularioMovimiento['tipo'] = 'Entrada'): void {
    this.pacienteMovimiento.set(null);
    this.medicamentoSeleccionado.set(medicamento);
    this.formularioMovimiento.set({
      ...this.movimientoVacio(),
      tipo,
      responsable: this.responsableActual(),
      precio_compra: medicamento.precioCompra,
      actualizar_datos_medicamento: true,
    });
    this.modalMovimientoAbierto.set(true);
  }

  cerrarMovimiento(): void {
    this.modalMovimientoAbierto.set(false);
  }

  actualizarMovimiento(campo: keyof FormularioMovimiento, valor: string | number): void {
    this.formularioMovimiento.update((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  guardarMovimiento(): void {
    const medicamento = this.medicamentoSeleccionado();
    const formulario = this.formularioMovimiento();

    if (!medicamento || this.movimientoInvalido(medicamento)) {
      return;
    }

    const payload: FormularioMovimiento = {
      ...formulario,
      paciente_id: this.pacienteMovimiento()?.id ?? null,
      responsable: this.responsableActual(),
      lote: formulario.tipo === 'Entrada' ? formulario.lote?.trim() || undefined : undefined,
      fecha_vencimiento: formulario.tipo === 'Entrada' ? formulario.fecha_vencimiento || undefined : undefined,
      proveedor: formulario.tipo === 'Entrada' ? formulario.proveedor?.trim() || undefined : undefined,
      precio_compra: formulario.tipo === 'Entrada' ? formulario.precio_compra : undefined,
      actualizar_datos_medicamento:
        formulario.tipo === 'Entrada' ? formulario.actualizar_datos_medicamento : undefined,
    };

    this.farmaciaService.registrarMovimiento(medicamento.id, payload, this.alcanceDe(medicamento)).subscribe({
      next: (resp) => {
        this.medicamentoSeleccionado.set(resp.medicamento);
        this.modalMovimientoAbierto.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        alert(err.error?.message ?? 'Error al registrar movimiento.');
      },
    });
  }

  cambiarEstado(medicamento: Medicamento, estado: Medicamento['estado']): void {
    this.farmaciaService.cambiarEstado(medicamento.id, estado, this.alcanceDe(medicamento)).subscribe({
      next: () => {
        this.cargarDatos();
      },
      error: (err) => {
        alert(err.error?.message ?? 'Error al cambiar estado.');
      },
    });
  }

  eliminarMedicamento(medicamento: Medicamento): void {
    const confirmar = window.confirm(
      `¿Deseas eliminar el medicamento ${medicamento.nombre}?`
    );

    if (!confirmar) {
      return;
    }

    this.farmaciaService.eliminarMedicamento(medicamento.id, this.alcanceDe(medicamento)).subscribe({
      next: () => {
        this.modalDetalleAbierto.set(false);
        this.medicamentoSeleccionado.set(null);
        this.cargarDatos();
      },
      error: (err) => {
        alert(err.error?.message ?? 'Error al eliminar el medicamento.');
      },
    });
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroCategoria.set('Todas');
    this.filtroEstado.set('Todos');
    this.filtroStock.set('Todos');
    this.aplicarFiltros();
  }

  obtenerEstadoStock(medicamento: Medicamento): string {
    if (medicamento.stock === 0) {
      return 'Agotado';
    }
    const min = medicamento.stockMinimo ?? medicamento.stock_minimo ?? 0;
    if (medicamento.stock <= min) {
      return 'Stock bajo';
    }
    return 'Disponible';
  }

  obtenerDiasParaVencer(fecha: string): number {
    if (!fecha) return 0;
    const hoy = new Date();
    const vencimiento = new Date(`${fecha}T00:00:00`);
    const diferencia = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }
}