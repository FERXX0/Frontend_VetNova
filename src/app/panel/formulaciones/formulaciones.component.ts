import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import { Paciente } from '../../core/models/paciente.model';
import { Profesional } from '../../core/models/cita.model';
import {
  FormulacionFila,
  FormulacionPayload,
  MedicamentoFormulacion,
  ResumenFormulaciones,
} from '../../core/models/formulacion.model';
import { EmpresaService } from '../../core/services/empresa.service';
import { FormulacionService } from '../../core/services/formulacion.service';
import { PacienteService } from '../../core/services/paciente.service';
import { AlcanceApi } from '../../core/utils/alcance-api';

interface FormularioMedicamento {
  nombre: string;
  concentracion: string;
  presentacion: string;
  cantidad: number;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './formulaciones.component.html',
  styleUrl: './formulaciones.component.scss',
})
export class FormulacionesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly formulacionService = inject(FormulacionService);
  private readonly pacienteService = inject(PacienteService);
  private readonly empresaService = inject(EmpresaService);

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

  readonly modoEdicion = signal(false);
  readonly formulacionEditandoId = signal<string | null>(null);

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
      error: (err) => console.error('Error cargando empresas:', err),
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
        error: (err) => {
          console.error('Error cargando formulaciones:', err);
          this.cargando.set(false);
        },
      });

    this.formulacionService.resumen(alcance).subscribe({
      next: (data) => this.resumen.set(data),
      error: (err) => console.error('Error cargando resumen:', err),
    });

    this.pacienteService.listar({ per_page: 100 }, alcance).subscribe({
      next: (resp) => this.pacientes.set(resp.data),
      error: (err) => console.error('Error cargando pacientes:', err),
    });

    this.formulacionService.profesionales(alcance).subscribe({
      next: (data) => this.profesionales.set(data),
      error: (err) => console.error('Error cargando profesionales:', err),
    });
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
      unidad: 'tableta',
      frecuencia: '',
      duracion: '',
      via: 'Oral',
      indicaciones: '',
    };
  }

  abrirDetalle(formulacion: FormulacionFila): void {
    this.formulacionSeleccionada.set(formulacion);
    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
  }

  abrirNuevaFormulacion(): void {
    this.modoEdicion.set(false);
    this.formulacionEditandoId.set(null);
    this.errorModal.set(null);
    this.formulario.set(this.formularioVacio());
    this.medicamentosTemporales.set([]);
    this.modalFormularioAbierto.set(true);
  }

  editarFormulacion(formulacion: FormulacionFila): void {
    this.modoEdicion.set(true);
    this.formulacionEditandoId.set(formulacion.id);
    this.errorModal.set(null);

    this.formulario.set({
      paciente_id: formulacion.paciente?.id ?? '',
      veterinario_id: formulacion.veterinario_id ?? '',
      diagnostico: formulacion.diagnostico,
      observaciones: formulacion.observaciones ?? '',
    });

    this.medicamentosTemporales.set(
      formulacion.medicamentos.map((m) => ({ ...m }))
    );

    this.modalDetalleAbierto.set(false);
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

  abrirNuevoMedicamento(): void {
    this.medicamentoFormulario.set(this.medicamentoVacio());
    this.modalMedicamentoAbierto.set(true);
  }

  editarMedicamento(index: number): void {
    const med = this.medicamentosTemporales()[index];

    this.medicamentoFormulario.set({
      nombre: med.nombre,
      concentracion: med.concentracion,
      presentacion: med.presentacion ?? '',
      cantidad: med.cantidad,
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
    valor: string | number
  ): void {
    this.medicamentoFormulario.update((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  guardarMedicamento(): void {
    const m = this.medicamentoFormulario();

    if (
      !m.nombre.trim() ||
      !m.concentracion.trim() ||
      !m.frecuencia.trim() ||
      !m.duracion.trim()
    ) {
      return;
    }

    const nuevoMed: MedicamentoFormulacion = {
      nombre: m.nombre.trim(),
      concentracion: m.concentracion.trim(),
      presentacion: m.presentacion.trim() || null,
      cantidad: Number(m.cantidad) || 1,
      unidad: m.unidad,
      frecuencia: m.frecuencia.trim(),
      duracion: m.duracion.trim(),
      via: m.via,
      indicaciones: m.indicaciones.trim() || null,
    };

    const existeIndice = this.medicamentosTemporales().findIndex(
      (item) =>
        item.nombre.toLowerCase() === nuevoMed.nombre.toLowerCase() &&
        item.concentracion === nuevoMed.concentracion
    );

    if (existeIndice >= 0) {
      this.medicamentosTemporales.update((meds) =>
        meds.map((item, index) => (index === existeIndice ? nuevoMed : item))
      );
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

    const alcance = this.alcanceActual();
    const esEdit = this.modoEdicion() && this.formulacionEditandoId() !== null;
    const req$ = esEdit
      ? this.formulacionService.actualizar(this.formulacionEditandoId()!, payload, alcance)
      : this.formulacionService.crear(payload, alcance);

    req$.subscribe({
      next: (resp) => {
        this.guardando.set(false);
        this.modalFormularioAbierto.set(false);
        this.mostrarToast(
          esEdit
            ? 'Formulación actualizada exitosamente.'
            : 'Formulación registrada exitosamente.'
        );
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
    const alcance = this.alcanceActual();

    this.formulacionService.cambiarEstado(formulacion.id, nuevoEstado, alcance).subscribe({
      next: (actualizada) => {
        this.formulacionSeleccionada.set(actualizada);
        this.mostrarToast(`Formulación ${nuevoEstado.toLowerCase()} exitosamente.`);
        this.cargarDatos();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al cambiar el estado.');
      },
    });
  }

  eliminarFormulacion(formulacion: FormulacionFila): void {
    const confirmar = window.confirm(
      `¿Deseas eliminar la formulación ${formulacion.numero}?`
    );

    if (!confirmar) return;

    const alcance = this.alcanceActual();

    this.formulacionService.eliminar(formulacion.id, alcance).subscribe({
      next: () => {
        this.modalDetalleAbierto.set(false);
        this.formulacionSeleccionada.set(null);
        this.mostrarToast('Formulación eliminada exitosamente.');
        this.cargarDatos();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al eliminar la formulación.');
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