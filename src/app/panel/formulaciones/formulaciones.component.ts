import { PermisoDirective } from '../../core/directives/permiso.directive';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import {
  AgregarMedicamentoPayload,
  EvolucionFormulacion,
  FormulacionFila,
  MedicamentoFormulacion,
  ResumenFormulaciones,
} from '../../core/models/formulacion.model';
import { EmpresaService } from '../../core/services/empresa.service';
import { FormulacionService } from '../../core/services/formulacion.service';
import { AlcanceApi } from '../../core/utils/alcance-api';
import { FarmaciaService } from '../../core/services/farmacia.service';
import { Medicamento } from '../../core/models/farmacia.model';

interface FormularioMedicamento {
  medicamento_id: string;
  nombre: string;
  concentracion: string;
  presentacion: string;
  cantidad: number;
  dosis_cantidad: number;
  dosis_unidad: string;
  frecuencia_horas: number | null;
  duracion_dias: number;
  unidad: string;
  frecuencia: string;
  duracion: string;
  via: string;
  indicaciones: string;
}

@Component({
  selector: 'app-formulaciones',
  standalone: true,
  imports: [PermisoDirective, CommonModule, FormsModule],
  templateUrl: './formulaciones.component.html',
  styleUrl: './formulaciones.component.scss',
})
export class FormulacionesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly formulacionService = inject(FormulacionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly farmaciaService = inject(FarmaciaService);

  readonly esSuperUsuario = computed(() => this.router.url.startsWith('/super-usuario'));

  readonly empresas = signal<EmpresaOpcion[]>([]);
  readonly empresaIdSeleccionada = signal<string>('');

  readonly formulaciones = signal<FormulacionFila[]>([]);
  readonly resumen = signal<ResumenFormulaciones>({
    total: 0,
    activas: 0,
    finalizadas: 0,
    total_medicamentos: 0,
    pendientes_dispensar: 0,
  });

  readonly medicamentosDisponibles = signal<Medicamento[]>([]);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('Todos');
  readonly filtroEspecie = signal('Todas');
  readonly filtroDispensacion = signal<'pendientes' | 'completas' | 'todas'>('pendientes');
  readonly dispensandoLineaId = signal<string | null>(null);

  readonly paginaActual = signal(1);
  readonly totalPaginas = signal(1);
  readonly total = signal(0);
  readonly perPage = 15;

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly mensajeToast = signal<string | null>(null);

  readonly modalDetalleAbierto = signal(false);
  readonly modalMedicamentoAbierto = signal(false);

  readonly formulacionSeleccionada = signal<FormulacionFila | null>(null);

  readonly evoluciones = signal<EvolucionFormulacion[]>([]);
  readonly cargandoEvoluciones = signal(false);
  readonly modoAgregarAFormulacion = signal(false);
  readonly guardandoMedicamento = signal(false);
  readonly errorMedicamento = signal<string | null>(null);

  readonly medicamentoFormulario = signal<FormularioMedicamento>(this.medicamentoVacio());

  private debounceTimer: any;
  private toastTimer: any;

  readonly alcanceActual = computed<AlcanceApi | undefined>(() => {
    if (!this.esSuperUsuario()) return undefined;
    const empId = this.empresaIdSeleccionada();
    return { plataforma: true, empresaId: empId || undefined };
  });

  ngOnInit(): void {
    if (this.esSuperUsuario()) {
      this.cargarEmpresas();
    }
    this.cargarDatos();
  }

  cargarEmpresas(): void {
    this.empresaService.listarOpciones().subscribe({
      next: (data) => this.empresas.set(data),
      error: () => this.empresas.set([]),
    });
  }

  alCambiarEmpresa(empId: string): void {
    this.empresaIdSeleccionada.set(empId);
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    const alcance = this.alcanceActual();

    this.formulacionService
      .listar(
        {
          buscar: this.busqueda().trim() || undefined,
          estado: this.filtroEstado() !== 'Todos' ? this.filtroEstado() : undefined,
          especie: this.filtroEspecie() !== 'Todas' ? this.filtroEspecie() : undefined,
          dispensacion: this.filtroDispensacion(),
          page: this.paginaActual(),
          per_page: this.perPage,
        },
        alcance
      )
      .subscribe({
        next: (resp) => {
          this.formulaciones.set(resp.data);
          this.paginaActual.set(resp.current_page);
          this.totalPaginas.set(resp.last_page);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.mostrarToast(this.mensajeError(err, 'Error al cargar las formulaciones.'));
        },
      });

    this.formulacionService.resumen(alcance).subscribe({
      next: (resumen) => this.resumen.set(resumen),
      error: () => {},
    });

    if (!this.esSuperUsuario()) {
      this.cargarMedicamentosDisponibles();
    }
  }

  cargarMedicamentosDisponibles(alcance?: AlcanceApi): void {
    this.farmaciaService.obtenerMedicamentos(alcance, { per_page: 100, estado: 'Activo' }).subscribe({
      next: (resp) => this.medicamentosDisponibles.set(resp.data),
      error: () => this.medicamentosDisponibles.set([]),
    });
  }

  alcanceDe(formulacion: FormulacionFila): AlcanceApi | undefined {
    if (!this.esSuperUsuario()) return undefined;
    return { plataforma: true, empresaId: formulacion.empresa_id };
  }

  mensajeError(err: any, porDefecto: string): string {
    return err?.error?.message ?? porDefecto;
  }

  iconoEvolucion(tipo: string): string {
    switch (tipo) {
      case 'creada':
        return 'add_circle';
      case 'medicamento_agregado':
        return 'medication';
      case 'medicamento_retirado':
        return 'delete';
      case 'medicamento_dispensado':
        return 'check_circle';
      case 'finalizada':
        return 'task_alt';
      case 'cancelada':
        return 'cancel';
      default:
        return 'history';
    }
  }

  alBuscar(texto: string): void {
    clearTimeout(this.debounceTimer);
    this.busqueda.set(texto);
    this.debounceTimer = setTimeout(() => {
      this.paginaActual.set(1);
      this.cargarDatos();
    }, 350);
  }

  alCambiarFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  alCambiarFiltroEspecie(especie: string): void {
    this.filtroEspecie.set(especie);
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  alCambiarFiltroDispensacion(disp: 'pendientes' | 'completas' | 'todas'): void {
    this.filtroDispensacion.set(disp);
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('Todos');
    this.filtroEspecie.set('Todas');
    this.filtroDispensacion.set('pendientes');
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  irAPagina(page: number): void {
    if (page < 1 || page > this.totalPaginas() || page === this.paginaActual()) return;
    this.paginaActual.set(page);
    this.cargarDatos();
  }

  medicamentoVacio(): FormularioMedicamento {
    return {
      medicamento_id: '',
      nombre: '',
      concentracion: '',
      presentacion: '',
      cantidad: 1,
      dosis_cantidad: 1,
      dosis_unidad: '',
      frecuencia_horas: 8,
      duracion_dias: 5,
      unidad: '',
      frecuencia: 'Cada 8 horas',
      duracion: '5 días',
      via: 'Oral',
      indicaciones: '',
    };
  }

  abrirDetalle(formulacion: FormulacionFila): void {
    this.formulacionSeleccionada.set(formulacion);
    this.modalDetalleAbierto.set(true);
    this.cargarEvoluciones(formulacion);
  }

  cargarEvoluciones(formulacion: FormulacionFila): void {
    this.cargandoEvoluciones.set(true);
    this.formulacionService.evoluciones(formulacion.id, this.alcanceDe(formulacion)).subscribe({
      next: (data) => {
        this.evoluciones.set(data);
        this.cargandoEvoluciones.set(false);
      },
      error: () => {
        this.evoluciones.set([]);
        this.cargandoEvoluciones.set(false);
      },
    });
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.formulacionSeleccionada.set(null);
    this.evoluciones.set([]);
  }

  abrirAgregarMedicamento(formulacion: FormulacionFila): void {
    this.modoAgregarAFormulacion.set(true);
    this.errorMedicamento.set(null);
    this.medicamentoFormulario.set(this.medicamentoVacio());

    if (this.esSuperUsuario()) {
      this.cargarMedicamentosDisponibles(this.alcanceDe(formulacion));
    }

    this.modalMedicamentoAbierto.set(true);
  }

  cerrarModalMedicamento(): void {
    this.modalMedicamentoAbierto.set(false);
    this.modoAgregarAFormulacion.set(false);
    this.errorMedicamento.set(null);
  }

  agregarMedicamentoAFormulacion(payload: AgregarMedicamentoPayload): void {
    const seleccionada = this.formulacionSeleccionada();
    if (!seleccionada) return;

    this.guardandoMedicamento.set(true);
    this.errorMedicamento.set(null);

    this.formulacionService
      .agregarMedicamento(seleccionada.id, payload, this.alcanceDe(seleccionada))
      .subscribe({
        next: (actualizada) => {
          this.guardandoMedicamento.set(false);
          this.cerrarModalMedicamento();
          this.formulacionSeleccionada.set(actualizada);
          this.cargarEvoluciones(actualizada);
          this.cargarDatos();
          this.mostrarToast('Medicamento agregado correctamente.');
        },
        error: (err) => {
          this.guardandoMedicamento.set(false);
          this.errorMedicamento.set(this.mensajeError(err, 'No fue posible agregar el medicamento.'));
        },
      });
  }

  retirarMedicamento(formulacion: FormulacionFila, medicamento: MedicamentoFormulacion): void {
    if (!medicamento.id) return;

    const confirmar = confirm(`¿Retirar "${medicamento.nombre}" de la formulación?`);
    if (!confirmar) return;

    this.formulacionService
      .retirarMedicamento(formulacion.id, medicamento.id, this.alcanceDe(formulacion))
      .subscribe({
        next: (actualizada) => {
          this.formulacionSeleccionada.set(actualizada);
          this.cargarEvoluciones(actualizada);
          this.cargarDatos();
          this.mostrarToast('Medicamento retirado correctamente.');
        },
        error: (err) => {
          this.mostrarToast(this.mensajeError(err, 'No fue posible retirar el medicamento.'));
        },
      });
  }

  actualizarMedicamento(
    campo: keyof FormularioMedicamento,
    valor: string | number | null
  ): void {
    this.medicamentoFormulario.update((actual) => {
      const actualizado = {
        ...actual,
        [campo]: valor,
      };

      if (campo === 'medicamento_id') {
        const inventario = this.medicamentosDisponibles().find((item) => item.id === valor);
        if (inventario) {
          actualizado.nombre = inventario.nombre;
          actualizado.concentracion = `${inventario.concentracion ?? ''} ${inventario.concentracion_unidad ?? ''}`.trim();
          actualizado.presentacion = inventario.presentacion ?? '';
          actualizado.unidad = inventario.presentacion ?? '';
          actualizado.dosis_unidad = inventario.concentracion_unidad ?? '';
        }
      }

      if (
        campo === 'dosis_cantidad' ||
        campo === 'frecuencia_horas' ||
        campo === 'duracion_dias'
      ) {
        const dosis = Number(actualizado.dosis_cantidad) || 0;
        const frec = Number(actualizado.frecuencia_horas) || 0;
        const dias = Number(actualizado.duracion_dias) || 0;

        if (dosis > 0 && frec > 0 && dias > 0) {
          actualizado.cantidad = Number((dosis * (24 / frec) * dias).toFixed(2));
        }

        if (campo === 'frecuencia_horas' && frec > 0) {
          actualizado.frecuencia = `Cada ${frec} horas`;
        }

        if (campo === 'duracion_dias' && dias > 0) {
          actualizado.duracion = `${dias} días`;
        }
      }

      return actualizado;
    });
  }

  guardarMedicamento(): void {
    const m = this.medicamentoFormulario();
    const inventario = this.medicamentosDisponibles().find((item) => item.id === m.medicamento_id);

    if (!inventario || !m.dosis_cantidad || !m.duracion_dias || !m.frecuencia_horas || !m.via) {
      return;
    }

    const cantidad = Number((m.dosis_cantidad * (24 / m.frecuencia_horas) * m.duracion_dias).toFixed(2));

    if (this.modoAgregarAFormulacion()) {
      this.agregarMedicamentoAFormulacion({
        medicamento_id: m.medicamento_id,
        cantidad,
        dosis_cantidad: m.dosis_cantidad,
        dosis_unidad: m.dosis_unidad,
        frecuencia_horas: m.frecuencia_horas,
        duracion_dias: m.duracion_dias,
        frecuencia: m.frecuencia,
        duracion: m.duracion,
        via: m.via,
        indicaciones: m.indicaciones,
      });
    }
  }

  dispensar(formulacion: FormulacionFila, linea: MedicamentoFormulacion): void {
    if (!linea.id) return;

    this.dispensandoLineaId.set(linea.id);
    this.formulacionService.dispensar(formulacion.id, linea.id).subscribe({
      next: (actualizada) => {
        this.dispensandoLineaId.set(null);
        this.formulacionSeleccionada.set(actualizada);
        this.cargarEvoluciones(actualizada);
        this.cargarDatos();
        this.mostrarToast(`Se dispensó ${linea.nombre} correctamente.`);
      },
      error: (err) => {
        this.dispensandoLineaId.set(null);
        this.mostrarToast(this.mensajeError(err, 'No fue posible dispensar el medicamento.'));
      },
    });
  }

  cambiarEstado(formulacion: FormulacionFila, nuevoEstado: 'Finalizada' | 'Cancelada'): void {
    const accion = nuevoEstado === 'Finalizada' ? 'finalizar' : 'cancelar';
    const confirmar = confirm(`¿Estás seguro de que deseas ${accion} esta formulación?`);
    if (!confirmar) return;

    this.guardando.set(true);
    this.formulacionService
      .cambiarEstado(formulacion.id, nuevoEstado, this.alcanceDe(formulacion))
      .subscribe({
        next: (actualizada) => {
          this.guardando.set(false);
          this.formulacionSeleccionada.set(actualizada);
          this.cargarEvoluciones(actualizada);
          this.cargarDatos();
          this.mostrarToast(`Formulación ${accion}da correctamente.`);
        },
        error: (err) => {
          this.guardando.set(false);
          this.mostrarToast(this.mensajeError(err, `No fue posible ${accion} la formulación.`));
        },
      });
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'PA';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }

  mostrarToast(mensaje: string): void {
    this.mensajeToast.set(mensaje);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.mensajeToast.set(null);
    }, 3200);
  }
}
