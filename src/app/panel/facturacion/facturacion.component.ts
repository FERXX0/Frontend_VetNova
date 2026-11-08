import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CargoCuenta,
  CuentaPaciente,
  FacturacionService,
  PagoCuenta,
} from '../../core/services/facturacion.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Factura } from '../../core/models/factura.model';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import { AlcanceApi } from '../../core/utils/alcance-api';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion.component.html',
  styleUrl: './facturacion.component.scss',
})
export class FacturacionComponent implements OnInit {
  private readonly service = inject(FacturacionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly router = inject(Router);

  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));
  readonly empresasDisponibles = signal<EmpresaOpcion[]>([]);
  readonly filtroEmpresa = signal('');
  readonly busqueda = signal('');
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly total = signal(0);

  vista = signal<'cuentas' | 'facturas'>('cuentas');
  cuentas = signal<CuentaPaciente[]>([]);
  cuentaSeleccionada = signal<CuentaPaciente | null>(null);
  cargandoCuentas = signal(false);
  errorCuentas = signal<string | null>(null);

  filtroEstadoCuenta = signal<string>('');
  busquedaCuenta = signal<string>('');
  paginaCuentas = signal(1);
  totalPaginasCuentas = signal(1);

  facturas = signal<Factura[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  pagina = signal(1);
  totalPaginas = signal(1);
  facturaSeleccionada = signal<Factura | null>(null);

  // Modales de acciones clínicas/financieras
  modalPagoAbierto = signal(false);
  pagoMonto = signal<number>(0);
  pagoMetodo = signal<string>('Efectivo');
  pagoReferencia = signal<string>('');
  pagoNotas = signal<string>('');
  procesandoPago = signal(false);
  errorPago = signal<string | null>(null);

  modalAnularAbierto = signal(false);
  cargoAAnular = signal<CargoCuenta | null>(null);
  motivoAnulacion = signal<string>('');
  procesandoAnulacion = signal(false);
  errorAnulacion = signal<string | null>(null);

  procesandoAccion = signal(false);
  mensajeAlerta = signal<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  readonly metodosPagoDisponibles = [
    'Efectivo',
    'Tarjeta de crédito',
    'Tarjeta de débito',
    'Transferencia',
    'Nequi',
    'Daviplata',
    'Otro',
  ];

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceTimerCuentas: ReturnType<typeof setTimeout> | null = null;

  readonly hayFiltros = computed(
    () => !!(this.busqueda() || this.desde() || this.hasta() || this.filtroEmpresa())
  );

  private alcance(): AlcanceApi | undefined {
    return this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: this.filtroEmpresa() || null }
      : undefined;
  }

  ngOnInit(): void {
    if (this.esVistaSuperUsuario()) {
      this.empresaService.listarOpciones().subscribe({
        next: (res) => this.empresasDisponibles.set(res || []),
        error: () => {},
      });
    }
    this.cargar();
    this.cargarCuentas();
  }

  cargarCuentas(page = 1): void {
    this.cargandoCuentas.set(true);
    this.errorCuentas.set(null);
    this.service
      .listarCuentas(
        this.alcance(),
        {
          estado: this.filtroEstadoCuenta() || undefined,
          buscar: this.busquedaCuenta() || undefined,
          page,
        }
      )
      .subscribe({
        next: (r) => {
          this.cuentas.set(r.data || []);
          this.paginaCuentas.set(r.current_page || 1);
          this.totalPaginasCuentas.set(r.last_page || 1);
          this.cargandoCuentas.set(false);
        },
        error: (e) => {
          this.errorCuentas.set(e?.error?.message || 'No se pudieron cargar las cuentas.');
          this.cargandoCuentas.set(false);
        },
      });
  }

  cambiarBusquedaCuenta(valor: string): void {
    this.busquedaCuenta.set(valor);
    if (this.debounceTimerCuentas) {
      clearTimeout(this.debounceTimerCuentas);
    }
    this.debounceTimerCuentas = setTimeout(() => this.cargarCuentas(1), 350);
  }

  cambiarEstadoCuenta(estado: string): void {
    this.filtroEstadoCuenta.set(estado);
    this.cargarCuentas(1);
  }

  verCuenta(cuenta: CuentaPaciente): void {
    this.service.obtenerCuenta(cuenta.id, this.alcance()).subscribe({
      next: (r) => this.cuentaSeleccionada.set(r),
      error: (e) => this.errorCuentas.set(e?.error?.message || 'No se pudo consultar la cuenta.'),
    });
  }

  refrescarCuentaSeleccionada(): void {
    const sel = this.cuentaSeleccionada();
    if (!sel) return;
    this.service.obtenerCuenta(sel.id, this.alcance()).subscribe({
      next: (r) => {
        this.cuentaSeleccionada.set(r);
        // También actualizar la lista
        this.cuentas.update((items) => items.map((c) => (c.id === r.id ? r : c)));
      },
    });
  }

  abrirRegistrarPago(): void {
    const cuenta = this.cuentaSeleccionada();
    if (!cuenta) return;
    const saldo = this.saldoPendiente(cuenta);
    this.pagoMonto.set(saldo);
    this.pagoMetodo.set('Efectivo');
    this.pagoReferencia.set('');
    this.pagoNotas.set('');
    this.errorPago.set(null);
    this.modalPagoAbierto.set(true);
  }

  cerrarModalPago(): void {
    this.modalPagoAbierto.set(false);
    this.errorPago.set(null);
  }

  guardarPago(): void {
    const cuenta = this.cuentaSeleccionada();
    if (!cuenta) return;

    const monto = Number(this.pagoMonto());
    if (isNaN(monto) || monto <= 0) {
      this.errorPago.set('Ingresa un monto válido mayor a 0.');
      return;
    }

    const saldo = this.saldoPendiente(cuenta);
    if (monto > saldo) {
      this.errorPago.set(`El monto no puede superar el saldo pendiente (${this.formatearMoneda(saldo)}).`);
      return;
    }

    this.procesandoPago.set(true);
    this.errorPago.set(null);

    this.service
      .registrarPago(
        cuenta.id,
        {
          monto,
          metodo_pago: this.pagoMetodo(),
          referencia: this.pagoReferencia().trim() || undefined,
          notas: this.pagoNotas().trim() || undefined,
        },
        this.alcance()
      )
      .subscribe({
        next: (r) => {
          this.procesandoPago.set(false);
          this.cerrarModalPago();
          this.cuentaSeleccionada.set(r);
          this.cuentas.update((items) => items.map((c) => (c.id === r.id ? r : c)));
          this.mostrarAlerta('Abono registrado correctamente.', 'exito');
        },
        error: (err) => {
          this.procesandoPago.set(false);
          this.errorPago.set(err?.error?.message || 'Error al registrar el pago.');
        },
      });
  }

  abrirAnularCargo(cargo: CargoCuenta): void {
    this.cargoAAnular.set(cargo);
    this.motivoAnulacion.set('');
    this.errorAnulacion.set(null);
    this.modalAnularAbierto.set(true);
  }

  cerrarModalAnular(): void {
    this.modalAnularAbierto.set(false);
    this.cargoAAnular.set(null);
    this.errorAnulacion.set(null);
  }

  confirmarAnulacion(): void {
    const cuenta = this.cuentaSeleccionada();
    const cargo = this.cargoAAnular();
    if (!cuenta || !cargo) return;

    const motivo = this.motivoAnulacion().trim();
    if (motivo.length < 5) {
      this.errorAnulacion.set('Indica un motivo de anulación de al menos 5 caracteres.');
      return;
    }

    this.procesandoAnulacion.set(true);
    this.errorAnulacion.set(null);

    this.service.anularCargo(cuenta.id, cargo.id, motivo, this.alcance()).subscribe({
      next: (r) => {
        this.procesandoAnulacion.set(false);
        this.cerrarModalAnular();
        this.cuentaSeleccionada.set(r);
        this.cuentas.update((items) => items.map((c) => (c.id === r.id ? r : c)));
        this.mostrarAlerta('Cargo anulado exitosamente.', 'exito');
      },
      error: (err) => {
        this.procesandoAnulacion.set(false);
        this.errorAnulacion.set(err?.error?.message || 'Error al anular el cargo.');
      },
    });
  }

  cerrarCuenta(): void {
    const cuenta = this.cuentaSeleccionada();
    if (!cuenta) return;

    const saldo = this.saldoPendiente(cuenta);
    if (saldo > 0) {
      this.mostrarAlerta(`No puedes cerrar la cuenta. Hay un saldo pendiente de ${this.formatearMoneda(saldo)}.`, 'error');
      return;
    }

    if (!confirm(`¿Confirmas el cierre definitivo de la cuenta de ${cuenta.atencion?.paciente?.nombre}? Ya no admitirá nuevos cargos.`)) {
      return;
    }

    this.procesandoAccion.set(true);
    this.service.cerrarCuenta(cuenta.id, this.alcance()).subscribe({
      next: (r) => {
        this.procesandoAccion.set(false);
        this.cuentaSeleccionada.set(r);
        this.cuentas.update((items) => items.map((c) => (c.id === r.id ? r : c)));
        this.mostrarAlerta('Cuenta cerrada formalmente.', 'exito');
      },
      error: (err) => {
        this.procesandoAccion.set(false);
        this.mostrarAlerta(err?.error?.message || 'Error al cerrar la cuenta.', 'error');
      },
    });
  }

  emitirFactura(): void {
    const cuenta = this.cuentaSeleccionada();
    if (!cuenta) return;

    if (!confirm(`¿Generar factura oficial para la cuenta de ${cuenta.atencion?.paciente?.nombre}?`)) {
      return;
    }

    this.procesandoAccion.set(true);
    this.service.emitirFactura(cuenta.id, this.alcance()).subscribe({
      next: (factura) => {
        this.procesandoAccion.set(false);
        this.refrescarCuentaSeleccionada();
        this.cargar(1); // Actualizar listado de facturas
        this.mostrarAlerta(`Factura ${factura.numero} generada con éxito.`, 'exito');
      },
      error: (err) => {
        this.procesandoAccion.set(false);
        this.mostrarAlerta(err?.error?.message || 'Error al emitir factura.', 'error');
      },
    });
  }

  saldoPendiente(cuenta: CuentaPaciente): number {
    const tot = Number(cuenta.total || 0);
    const pag = Number(cuenta.pagado || 0);
    return Math.max(0, tot - pag);
  }

  origenEtiqueta(tipo: string): string {
    switch (tipo) {
      case 'cita_servicio':
        return 'Cita Médica';
      case 'hospitalizacion':
        return 'Hospitalización';
      case 'procedimiento':
        return 'Procedimiento';
      case 'laboratorio':
        return 'Laboratorio';
      case 'dispensacion_medicamento':
        return 'Medicamento';
      case 'venta_medicamento':
        return 'Farmacia';
      default:
        return tipo;
    }
  }

  cargar(page = 1): void {
    if (this.desde() && this.hasta() && this.hasta() < this.desde()) {
      this.error.set('La fecha final no puede ser anterior a la fecha inicial.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    this.service
      .listar(
        this.alcance(),
        {
          buscar: this.busqueda(),
          desde: this.desde(),
          hasta: this.hasta(),
        },
        page
      )
      .subscribe({
        next: (res) => {
          this.facturas.set(res.data || []);
          this.pagina.set(res.current_page || 1);
          this.totalPaginas.set(res.last_page || 1);
          this.total.set(res.total ?? 0);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se pudieron cargar las facturas.');
          this.cargando.set(false);
        },
      });
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.cargar(1), 350);
  }

  cambiarDesde(valor: string): void {
    this.desde.set(valor);
    this.cargar(1);
  }

  cambiarHasta(valor: string): void {
    this.hasta.set(valor);
    this.cargar(1);
  }

  onEmpresaChange(valor: string): void {
    this.filtroEmpresa.set(valor);
    this.cargar(1);
    this.cargarCuentas(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEmpresa.set('');
    this.desde.set('');
    this.hasta.set('');
    this.cargar(1);
  }

  verFactura(factura: Factura): void {
    const alcanceDetalle: AlcanceApi | undefined = this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: factura.empresa_id }
      : undefined;

    this.service.obtener(factura.id, alcanceDetalle).subscribe({
      next: (detalle) => this.facturaSeleccionada.set(detalle),
      error: () => this.facturaSeleccionada.set(factura),
    });
  }

  cerrarDetalle(): void {
    this.facturaSeleccionada.set(null);
  }

  mostrarAlerta(texto: string, tipo: 'exito' | 'error'): void {
    this.mensajeAlerta.set({ texto, tipo });
    setTimeout(() => this.mensajeAlerta.set(null), 5000);
  }

  formatearMoneda(valor: number | string): string {
    const num = Number(valor || 0);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);
  }
}
