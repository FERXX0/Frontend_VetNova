import { PermisoDirective } from '../../core/directives/permiso.directive';
﻿import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import { Paciente } from '../../core/models/paciente.model';
import { Profesional } from '../../core/models/cita.model';
import {
  AgregarMedicamentoPayload,
  EvolucionFormulacion,
  FormulacionFila,
  FormulacionPayload,
  MedicamentoFormulacion,
  ResumenFormulaciones,
} from '../../core/models/formulacion.model';
import { EmpresaService } from '../../core/services/empresa.service';
import { FormulacionService } from '../../core/services/formulacion.service';
import { PacienteService } from '../../core/services/paciente.service';
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

interface FormularioFormulacion {
  paciente_id: string;
  veterinario_id: string;
  diagnostico: string;
  observaciones: string;
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
  private readonly pacienteService = inject(PacienteService);
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
  });

  readonly pacientes = signal<Paciente[]>([]);
  readonly profesionales = signal<Profesional[]>([]);
  readonly medicamentosDisponibles = signal<Medicamento[]>([]);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('Todos');
  readonly filtroEspecie = signal('Todas');

  readonly paginaActual = signal(1);
  readonly totalPaginas = signal(1);
  readonly total = signal(0);
  readonly perPage = 15;

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorModal = signal<string | null>(null);
  readonly mensajeToast = signal<string | null>(null);

  readonly modalDetalleAbierto = signal(false);
  readonly modalFormularioAbierto = signal(false);
  readonly modalMedicamentoAbierto = signal(false);

  readonly formulacionSeleccionada = signal<FormulacionFila | null>(null);

  readonly evoluciones = signal<EvolucionFormulacion[]>([]);
  readonly cargandoEvoluciones = signal(false);
  readonly modoAgregarAFormulacion = signal(false);
  readonly guardandoMedicamento = signal(false);
  readonly errorMedicamento = signal<string | null>(null);

  readonly formulario = signal<FormularioFormulacion>(this.formularioVacio());
  readonly medicamentoFormulario = signal<FormularioMedicamento>(this.medicamentoVacio());
  readonly medicamentosTemporales = signal<MedicamentoFormulacion[]>([]);

  readonly pacienteSeleccionado = computed(() => {
    const id = this.formulario().paciente_id;
    return this.pacientes().find((p) => p.id === id) ?? null;
  });

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
        error: () => {
          this.formulaciones.set([]);
          this.cargando.set(false);
        },
      });

    this.formulacionService.resumen(alcance).subscribe({
      next: (data) => this.resumen.set(data),
      error: () =>
        this.resumen.set({
          total: 0,
          activas: 0,
          finalizadas: 0,
          total_medicamentos: 0,
        }),
    });

    this.pacienteService.listar({ per_page: 100 }, alcance).subscribe({
      next: (resp) => this.pacientes.set(resp.data),
      error: () => this.pacientes.set([]),
    });

    this.formulacionService.profesionales(alcance).subscribe({
      next: (data) => this.profesionales.set(data),
      error: () => this.profesionales.set([]),
    });

    this.cargarMedicamentosDisponibles(alcance);
  }

  private cargarMedicamentosDisponibles(alcance?: AlcanceApi): void {
    this.farmaciaService
      .obtenerMedicamentos(alcance, { estado: 'Activo', per_page: 100 })
      .subscribe({
        next: (resp) =>
          this.medicamentosDisponibles.set((resp.data || []).filter((med) => med.stock > 0)),
        error: () => this.medicamentosDisponibles.set([]),
      });
  }

  /** Alcance de la API para operar sobre una formulación concreta, según su empresa. */
  private alcanceDe(formulacion: FormulacionFila): AlcanceApi | undefined {
    if (!this.esSuperUsuario()) return undefined;

    return {
      plataforma: true,
      empresaId: formulacion.empresa_id || this.empresaIdSeleccionada() || undefined,
    };
  }

  private mensajeError(err: any, porDefecto: string): string {
    const errores = err?.error?.errors;

    if (errores) {
      const primero = Object.values(errores)[0] as string[] | undefined;

      if (primero?.length) {
        return primero[0];
      }
    }

    return err?.error?.message || porDefecto;
  }

  iconoEvolucion(tipo: string): string {
    const iconos: Record<string, string> = {
      creada: 'add_circle',
      actualizada: 'edit',
      medicamento_agregado: 'add',
      medicamento_retirado: 'remove_circle',
      medicamento_dispensado: 'inventory_2',
      estado_cambiado: 'swap_horiz',
    };

    return iconos[tipo] ?? 'history';
  }

  alBuscar(texto: string): void {
    this.busqueda.set(texto);
    clearTimeout(this.debounceTimer);
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

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('Todos');
    this.filtroEspecie.set('Todas');
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  irAPagina(page: number): void {
    if (page < 1 || page > this.totalPaginas()) return;
    this.paginaActual.set(page);
    this.cargarDatos();
  }

  private formularioVacio(): FormularioFormulacion {
    return {
      paciente_id: '',
      veterinario_id: '',
      diagnostico: '',
      observaciones: '',
    };
  }

  private medicamentoVacio(): FormularioMedicamento {
    return {
      nombre: '',
      concentracion: '',
      presentacion: '',
      cantidad: 1,
      medicamento_id: '',
      unidad: 'Tableta',
      dosis_cantidad: 1,
      dosis_unidad: 'dosis',
      frecuencia_horas: 8,
      duracion_dias: 1,
      frecuencia: 'Cada 8 horas',
      duracion: '1 días',
      via: 'Oral',
      indicaciones: '',
    };
  }

  abrirDetalle(formulacion: FormulacionFila): void {
    this.formulacionSeleccionada.set(formulacion);
    this.evoluciones.set([]);
    this.modalDetalleAbierto.set(true);
    this.cargarEvoluciones(formulacion);
  }

  private cargarEvoluciones(formulacion: FormulacionFila): void {
    this.cargandoEvoluciones.set(true);

    this.formulacionService.evoluciones(formulacion.id, this.alcanceDe(formulacion)).subscribe({
      next: (lista) => {
        this.evoluciones.set(lista);
        this.cargandoEvoluciones.set(false);
      },
      error: () => this.cargandoEvoluciones.set(false),
    });
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
  }

  abrirNuevaFormulacion(): void {
    this.errorModal.set(null);
    this.formulario.set(this.formularioVacio());
    this.medicamentosTemporales.set([]);
    this.modalFormularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    this.modalFormularioAbierto.set(false);
    this.errorModal.set(null);
  }

  actualizarFormulario(campo: keyof FormularioFormulacion, valor: string): void {
    this.formulario.update((actual) => ({
      ...actual,
      [campo]: valor,
    }));
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
    const eraAgregarAFormulacion = this.modoAgregarAFormulacion();

    this.modalMedicamentoAbierto.set(false);
    this.modoAgregarAFormulacion.set(false);
    this.errorMedicamento.set(null);

    if (eraAgregarAFormulacion && this.esSuperUsuario()) {
      this.cargarMedicamentosDisponibles(this.alcanceActual());
    }
  }

  private agregarMedicamentoAFormulacion(payload: AgregarMedicamentoPayload): void {
    const formulacion = this.formulacionSeleccionada();

    if (!formulacion) return;

    const yaExiste = formulacion.medicamentos.some(
      (item) => item.medicamento_id === payload.medicamento_id
    );

    if (yaExiste) {
      this.errorMedicamento.set('Este medicamento ya está en la formulación.');
      return;
    }

    this.guardandoMedicamento.set(true);
    this.errorMedicamento.set(null);

    this.formulacionService
      .agregarMedicamento(formulacion.id, payload, this.alcanceDe(formulacion))
      .subscribe({
        next: (actualizada) => {
          this.guardandoMedicamento.set(false);
          this.formulacionSeleccionada.set(actualizada);
          this.cerrarModalMedicamento();
          this.cargarEvoluciones(actualizada);
          this.mostrarToast('Medicamento agregado a la formulación.');
          this.cargarDatos();
        },
        error: (err) => {
          this.guardandoMedicamento.set(false);
          this.errorMedicamento.set(this.mensajeError(err, 'No se pudo agregar el medicamento.'));
        },
      });
  }

  retirarMedicamento(formulacion: FormulacionFila, medicamento: MedicamentoFormulacion): void {
    if (!medicamento.id || medicamento.dispensado) return;

    const confirmar = window.confirm(
      `¿Deseas retirar ${medicamento.nombre} de la formulación ${formulacion.numero}?`
    );

    if (!confirmar) return;

    this.formulacionService
      .retirarMedicamento(formulacion.id, medicamento.id, this.alcanceDe(formulacion))
      .subscribe({
        next: (actualizada) => {
          this.formulacionSeleccionada.set(actualizada);
          this.cargarEvoluciones(actualizada);
          this.mostrarToast('Medicamento retirado de la formulación.');
          this.cargarDatos();
        },
        error: (err) => {
          alert(this.mensajeError(err, 'No se pudo retirar el medicamento.'));
        },
      });
  }

  abrirNuevoMedicamento(): void {
    this.medicamentoFormulario.set(this.medicamentoVacio());
    this.modalMedicamentoAbierto.set(true);
  }

  editarMedicamento(index: number): void {
    const med = this.medicamentosTemporales()[index];

    this.medicamentoFormulario.set({
      medicamento_id: med.medicamento_id ?? '',
      nombre: med.nombre,
      concentracion: med.concentracion,
      presentacion: med.presentacion ?? '',
      cantidad: med.cantidad,
      dosis_cantidad: med.dosis_cantidad ?? med.cantidad,
      dosis_unidad: med.dosis_unidad ?? 'dosis',
      frecuencia_horas: med.frecuencia_horas ?? 8,
      duracion_dias: med.duracion_dias ?? 1,
      unidad: med.unidad,
      frecuencia: med.frecuencia,
      duracion: med.duracion,
      via: med.via,
      indicaciones: med.indicaciones ?? '',
    });

    this.modalMedicamentoAbierto.set(true);
  }

  eliminarMedicamento(index: number): void {
    this.medicamentosTemporales.update((meds) => meds.filter((_, i) => i !== index));
  }

  actualizarMedicamento(
    campo: keyof FormularioMedicamento,
    valor: string | number | null
  ): void {
    if (campo === 'medicamento_id') {
      const inventario = this.medicamentosDisponibles().find((item) => item.id === valor);
      this.medicamentoFormulario.update((actual) => ({
        ...actual,
        medicamento_id: String(valor ?? ''),
        nombre: inventario?.nombre ?? '',
        concentracion: inventario ? `${inventario.concentracion} ${inventario.concentracion_unidad}` : '',
        presentacion: inventario?.presentacion ?? '',
        unidad: inventario?.presentacion ?? 'Tableta',
      }));
      return;
    }

    this.medicamentoFormulario.update((actual) => ({
      ...actual,
      [campo]: valor,
    }));
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
        medicamento_id: inventario.id,
        cantidad,
        dosis_cantidad: m.dosis_cantidad,
        dosis_unidad: m.dosis_unidad,
        frecuencia_horas: m.frecuencia_horas,
        duracion_dias: m.duracion_dias,
        frecuencia: `Cada ${m.frecuencia_horas} horas`,
        duracion: `${m.duracion_dias} días`,
        via: m.via,
        indicaciones: m.indicaciones.trim() || null,
      });
      return;
    }

    const nuevoMed: MedicamentoFormulacion = {
      medicamento_id: inventario.id,
      nombre: inventario.nombre,
      concentracion: `${inventario.concentracion} ${inventario.concentracion_unidad}`, 
      presentacion: inventario.presentacion || null,
      cantidad,
      dosis_cantidad: m.dosis_cantidad,
      dosis_unidad: m.dosis_unidad,
      frecuencia_horas: m.frecuencia_horas,
      duracion_dias: m.duracion_dias,
      unidad: inventario.presentacion,
      frecuencia: `Cada ${m.frecuencia_horas} horas`,
      duracion: `${m.duracion_dias} días`,
      via: m.via,
      indicaciones: m.indicaciones.trim() || null,
    };

    const existeIndice = this.medicamentosTemporales().findIndex((item) => item.medicamento_id === nuevoMed.medicamento_id);
    if (existeIndice >= 0) {
      this.medicamentosTemporales.update((meds) => meds.map((item, index) => index === existeIndice ? nuevoMed : item));
    } else {
      this.medicamentosTemporales.update((meds) => [...meds, nuevoMed]);
    }

    this.modalMedicamentoAbierto.set(false);
  }

  guardarFormulacion(): void {
    const form = this.formulario();
    const meds = this.medicamentosTemporales();

    if (!form.paciente_id) {
      this.errorModal.set('Selecciona un paciente.');
      return;
    }

    if (!form.diagnostico.trim()) {
      this.errorModal.set('El diagnóstico es obligatorio.');
      return;
    }

    if (meds.length === 0) {
      this.errorModal.set('Debe agregar al menos un medicamento.');
      return;
    }

    this.guardando.set(true);
    this.errorModal.set(null);

    const payload: FormulacionPayload = {
      paciente_id: form.paciente_id,
      veterinario_id: form.veterinario_id || null,
      diagnostico: form.diagnostico.trim(),
      observaciones: form.observaciones.trim() || null,
      medicamentos: meds,
    };

    this.formulacionService.crear(payload, this.alcanceActual()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalFormularioAbierto.set(false);
        this.mostrarToast('Formulación registrada exitosamente.');
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorModal.set(
          err.error?.message || 'Ocurrió un error al guardar la formulación.'
        );
      },
    });
  }

  cambiarEstado(formulacion: FormulacionFila, nuevoEstado: 'Finalizada' | 'Cancelada'): void {
    this.formulacionService
      .cambiarEstado(formulacion.id, nuevoEstado, this.alcanceDe(formulacion))
      .subscribe({
        next: (actualizada) => {
          this.formulacionSeleccionada.set(actualizada);
          this.cargarEvoluciones(actualizada);
          this.mostrarToast(`Formulación ${nuevoEstado.toLowerCase()} exitosamente.`);
          this.cargarDatos();
        },
        error: (err) => {
          alert(err.error?.message || 'Error al cambiar el estado.');
        },
      });
  }

  obtenerIniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  mostrarToast(mensaje: string): void {
    this.mensajeToast.set(mensaje);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.mensajeToast.set(null);
    }, 4000);
  }
}