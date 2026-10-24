import { PermisoDirective } from '../../core/directives/permiso.directive';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { LaboratorioService } from '../../core/services/laboratorio.service';
import { PacienteService } from '../../core/services/paciente.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { SessionService } from '../../core/services/session.service';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import { Profesional } from '../../core/models/cita.model';
import { AlcanceApi } from '../../core/utils/alcance-api';
import {
  EstadoSolicitud,
  PrioridadSolicitud,
  ResumenLaboratorio,
  SolicitudLaboratorio,
  SolicitudPayload,
} from '../../core/models/laboratorio.model';

interface OpcionPaciente {
  id: string;
  nombre: string;
  especie: string;
  propietario: string;
}

interface FormularioLaboratorio {
  pacienteId: string;
  veterinarioId: string;
  examen: string;
  categoria: string;
  diagnostico: string;
  fechaSolicitud: string;
  horaSolicitud: string;
  fechaResultadoEstimada: string;
  laboratorio: string;
  muestra: string;
  prioridad: PrioridadSolicitud;
  estado: EstadoSolicitud;
  observaciones: string;
}

interface FormularioResultado {
  parametro: string;
  resultado: string;
  unidad: string;
  referencia: string;
  observacion: string;
}

@Component({
  selector: 'app-laboratorio',
  standalone: true,
  imports: [PermisoDirective, CommonModule, FormsModule],
  templateUrl: './laboratorio.component.html',
  styleUrl: './laboratorio.component.scss',
})
export class LaboratorioComponent implements OnInit {
  private readonly laboratorioService = inject(LaboratorioService);
  private readonly pacienteService = inject(PacienteService);
  private readonly empresaService = inject(EmpresaService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  readonly empresasDisponibles = signal<EmpresaOpcion[]>([]);
  readonly filtroEmpresa = signal('');

  readonly solicitudes = signal<SolicitudLaboratorio[]>([]);
  readonly resumen = signal<ResumenLaboratorio | null>(null);
  readonly paginaActual = signal(1);
  readonly totalPaginas = signal(1);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('Todos');
  readonly filtroPrioridad = signal('Todas');
  readonly filtroCategoria = signal('Todas');

  readonly modalDetalleAbierto = signal(false);
  readonly modalFormularioAbierto = signal(false);
  readonly modalResultadoAbierto = signal(false);
  readonly modalNotaAbierto = signal(false);

  readonly solicitudSeleccionada = signal<SolicitudLaboratorio | null>(null);

  readonly modoEdicion = signal(false);
  readonly solicitudEditandoId = signal<string | null>(null);
  readonly empresaFormulario = signal<string | null>(null);

  readonly pacientes = signal<OpcionPaciente[]>([]);
  readonly profesionales = signal<Profesional[]>([]);

  readonly guardando = signal(false);
  readonly errorFormulario = signal<string | null>(null);
  readonly errorResultado = signal<string | null>(null);
  readonly errorNota = signal<string | null>(null);

  readonly mensaje = signal('');
  readonly tipoMensaje = signal<'success' | 'error'>('success');

  readonly formulario = signal<FormularioLaboratorio>(this.formularioInicial());

  readonly formularioResultado = signal<FormularioResultado>({
    parametro: '',
    resultado: '',
    unidad: '',
    referencia: '',
    observacion: '',
  });

  readonly formularioNota = signal({ nota: '' });

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly alcanceListado = computed<AlcanceApi | undefined>(() =>
    this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: this.filtroEmpresa() || null }
      : undefined
  );

  readonly totalSolicitudes = computed(() => this.resumen()?.total ?? 0);
  readonly totalPendientes = computed(() => this.resumen()?.pendientes ?? 0);
  readonly totalProcesamiento = computed(() => this.resumen()?.en_procesamiento ?? 0);
  readonly totalResultados = computed(() => this.resumen()?.con_resultados ?? 0);
  readonly totalUrgentes = computed(() => this.resumen()?.urgentes ?? 0);
  readonly totalNotas = computed(() => this.resumen()?.total_notas ?? 0);

  /** En la vista super-usuario solo se puede crear con una empresa elegida. */
  readonly puedeCrear = computed(() => !this.esVistaSuperUsuario() || !!this.filtroEmpresa());

  ngOnInit(): void {
    if (this.esVistaSuperUsuario()) {
      this.empresaService.listarOpciones().subscribe({
        next: (res) => this.empresasDisponibles.set(res || []),
        error: () => { },
      });
    }

    this.cargarSolicitudes(1);
    this.cargarResumen();
  }

  private alcanceEmpresa(empresaId: string | null | undefined): AlcanceApi | undefined {
    return this.esVistaSuperUsuario() ? { plataforma: true, empresaId: empresaId ?? null } : undefined;
  }

  // ---------------------------------------------------------------
  // Listado
  // ---------------------------------------------------------------

  cargarSolicitudes(pagina = 1): void {
    this.cargando.set(true);
    this.error.set(null);

    const params = {
      buscar: this.busqueda().trim() || undefined,
      estado: this.filtroEstado() === 'Todos' ? undefined : this.filtroEstado(),
      prioridad: this.filtroPrioridad() === 'Todas' ? undefined : this.filtroPrioridad(),
      categoria: this.filtroCategoria() === 'Todas' ? undefined : this.filtroCategoria(),
      page: pagina,
      per_page: 15,
    };

    this.laboratorioService.listar(params, this.alcanceListado()).subscribe({
      next: (res) => {
        this.solicitudes.set(res.data || []);
        this.paginaActual.set(res.current_page || 1);
        this.totalPaginas.set(res.last_page || 1);
        this.total.set(res.total || 0);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message || 'No se pudo cargar el listado de solicitudes.');
      },
    });
  }

  cargarResumen(): void {
    this.laboratorioService.resumen(this.alcanceListado()).subscribe({
      next: (res) => this.resumen.set(res),
      error: () => { },
    });
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.cargarSolicitudes(pagina);
    }
  }

  private recargarTodo(pagina = this.paginaActual()): void {
    this.cargarSolicitudes(pagina);
    this.cargarResumen();
  }

  onEmpresaChange(valor: string): void {
    this.filtroEmpresa.set(valor);
    this.recargarTodo(1);
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => this.cargarSolicitudes(1), 350);
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
    this.cargarSolicitudes(1);
  }

  cambiarFiltroPrioridad(valor: string): void {
    this.filtroPrioridad.set(valor);
    this.cargarSolicitudes(1);
  }

  cambiarFiltroCategoria(valor: string): void {
    this.filtroCategoria.set(valor);
    this.cargarSolicitudes(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('Todos');
    this.filtroPrioridad.set('Todas');
    this.filtroCategoria.set('Todas');
    this.filtroEmpresa.set('');
    this.recargarTodo(1);
  }

  // ---------------------------------------------------------------
  // Detalle
  // ---------------------------------------------------------------

  abrirDetalle(solicitud: SolicitudLaboratorio): void {
    this.solicitudSeleccionada.set(solicitud);
    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.solicitudSeleccionada.set(null);
  }

  /** Reemplaza la solicitud en el listado y en el detalle abierto. */
  private reemplazarSolicitud(actualizada: SolicitudLaboratorio): void {
    this.solicitudes.update((lista) =>
      lista.map((item) => (item.id === actualizada.id ? actualizada : item))
    );

    if (this.solicitudSeleccionada()?.id === actualizada.id) {
      this.solicitudSeleccionada.set(actualizada);
    }
  }

  // ---------------------------------------------------------------
  // Formulario de solicitud
  // ---------------------------------------------------------------

  formularioInicial(): FormularioLaboratorio {
    return {
      pacienteId: '',
      veterinarioId: '',
      examen: '',
      categoria: 'Hematología',
      diagnostico: '',
      fechaSolicitud: this.obtenerFechaActual(),
      horaSolicitud: this.obtenerHoraActual(),
      fechaResultadoEstimada: '',
      laboratorio: 'Laboratorio VetNova',
      muestra: 'Sangre',
      prioridad: 'Media',
      estado: 'Solicitado',
      observaciones: '',
    };
  }

  /** Carga pacientes y veterinarios habilitados de la empresa indicada. */
  private cargarOpciones(
    empresaId: string | null,
    pacienteActual: OpcionPaciente | null,
    alTerminar: (profesionales: Profesional[]) => void
  ): void {
    const alcance = this.alcanceEmpresa(empresaId);

    forkJoin({
      pacientes: this.pacienteService
        .listar({ per_page: 100 }, alcance)
        .pipe(catchError(() => of(null))),
      profesionales: this.laboratorioService
        .profesionales(alcance)
        .pipe(catchError(() => of([] as Profesional[]))),
    }).subscribe(({ pacientes, profesionales }) => {
      const opciones: OpcionPaciente[] = (pacientes?.data ?? []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        especie: p.especie,
        propietario: p.propietario?.nombre ?? '',
      }));

      if (pacienteActual && !opciones.some((o) => o.id === pacienteActual.id)) {
        opciones.unshift(pacienteActual);
      }

      this.pacientes.set(opciones);
      this.profesionales.set(profesionales);
      alTerminar(profesionales);
    });
  }

  abrirNuevaSolicitud(): void {
    if (!this.puedeCrear()) {
      this.mostrarMensaje('Selecciona una empresa para crear la solicitud.', 'error');
      return;
    }

    const empresaId = this.esVistaSuperUsuario() ? this.filtroEmpresa() : null;

    this.modoEdicion.set(false);
    this.solicitudEditandoId.set(null);
    this.empresaFormulario.set(empresaId);
    this.errorFormulario.set(null);
    this.formulario.set(this.formularioInicial());

    this.cargarOpciones(empresaId, null, (profesionales) => {
      const usuarioId = this.session.obtenerUsuario()?.id;

      if (usuarioId && profesionales.some((p) => p.id === usuarioId)) {
        this.actualizarFormulario('veterinarioId', usuarioId);
      }

      this.modalFormularioAbierto.set(true);
    });
  }

  editarSolicitud(solicitud: SolicitudLaboratorio): void {
    this.modoEdicion.set(true);
    this.solicitudEditandoId.set(solicitud.id);
    this.empresaFormulario.set(solicitud.empresa_id);
    this.errorFormulario.set(null);

    this.formulario.set({
      pacienteId: solicitud.paciente?.id ?? '',
      veterinarioId: solicitud.veterinario_id ?? '',
      examen: solicitud.examen,
      categoria: solicitud.categoria,
      diagnostico: solicitud.diagnostico ?? '',
      fechaSolicitud: solicitud.fecha_solicitud,
      horaSolicitud: solicitud.hora_solicitud,
      fechaResultadoEstimada: solicitud.fecha_resultado_estimada ?? '',
      laboratorio: solicitud.laboratorio,
      muestra: solicitud.muestra,
      prioridad: solicitud.prioridad,
      estado: solicitud.estado,
      observaciones: solicitud.observaciones ?? '',
    });

    const pacienteActual: OpcionPaciente | null = solicitud.paciente
      ? {
        id: solicitud.paciente.id,
        nombre: solicitud.paciente.nombre,
        especie: solicitud.paciente.especie,
        propietario: solicitud.propietario?.nombre ?? '',
      }
      : null;

    this.cargarOpciones(solicitud.empresa_id, pacienteActual, () => {
      this.modalFormularioAbierto.set(true);
    });
  }

  cerrarFormulario(): void {
    this.modalFormularioAbierto.set(false);
    this.errorFormulario.set(null);
  }

  actualizarFormulario(campo: keyof FormularioLaboratorio, valor: string): void {
    this.formulario.update((form) => ({ ...form, [campo]: valor }));
  }

  guardarSolicitud(): void {
    const f = this.formulario();

    if (!f.pacienteId) {
      this.errorFormulario.set('Selecciona un paciente.');
      return;
    }

    if (!f.veterinarioId) {
      this.errorFormulario.set('Selecciona el veterinario solicitante.');
      return;
    }

    if (!f.examen.trim()) {
      this.errorFormulario.set('El examen es obligatorio.');
      return;
    }

    if (!f.fechaSolicitud) {
      this.errorFormulario.set('La fecha de solicitud es obligatoria.');
      return;
    }

    if (!f.horaSolicitud) {
      this.errorFormulario.set('La hora de solicitud es obligatoria.');
      return;
    }

    if (!f.laboratorio.trim()) {
      this.errorFormulario.set('El laboratorio es obligatorio.');
      return;
    }

    const payload: SolicitudPayload = {
      paciente_id: f.pacienteId,
      veterinario_id: f.veterinarioId,
      examen: f.examen.trim(),
      categoria: f.categoria,
      diagnostico: f.diagnostico.trim() || null,
      fecha_solicitud: f.fechaSolicitud,
      hora_solicitud: f.horaSolicitud,
      fecha_resultado_estimada: f.fechaResultadoEstimada || null,
      laboratorio: f.laboratorio.trim(),
      muestra: f.muestra,
      prioridad: f.prioridad,
      estado: f.estado,
      observaciones: f.observaciones.trim() || null,
    };

    const alcance = this.alcanceEmpresa(this.empresaFormulario());
    const edicion = this.modoEdicion();

    const peticion$ = edicion
      ? this.laboratorioService.actualizar(this.solicitudEditandoId()!, payload, alcance)
      : this.laboratorioService.crear(payload, alcance);

    this.guardando.set(true);
    this.errorFormulario.set(null);

    peticion$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.cerrarFormulario();
        this.mostrarMensaje(
          edicion ? 'Solicitud actualizada correctamente.' : 'Solicitud registrada correctamente.',
          'success'
        );

        if (edicion) {
          this.reemplazarSolicitud(res);
          this.cargarResumen();
        } else {
          this.recargarTodo(1);
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(
          this.mensajeError(err, 'No se pudo guardar la solicitud. Intenta de nuevo.')
        );
      },
    });
  }

  eliminarSolicitud(solicitud: SolicitudLaboratorio): void {
    const confirmado = window.confirm(`¿Deseas eliminar la solicitud "${solicitud.examen}"?`);

    if (!confirmado) return;

    this.laboratorioService
      .eliminar(solicitud.id, this.alcanceEmpresa(solicitud.empresa_id))
      .subscribe({
        next: () => {
          this.cerrarDetalle();
          this.mostrarMensaje('Solicitud eliminada correctamente.', 'success');

          const quedaVacia = this.solicitudes().length === 1 && this.paginaActual() > 1;
          this.recargarTodo(quedaVacia ? this.paginaActual() - 1 : this.paginaActual());
        },
        error: (err) => {
          this.mostrarMensaje(this.mensajeError(err, 'No se pudo eliminar la solicitud.'), 'error');
        },
      });
  }

  // ---------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------

  cambiarEstado(solicitud: SolicitudLaboratorio, estado: EstadoSolicitud): void {
    if (solicitud.estado === estado) return;

    this.laboratorioService
      .cambiarEstado(solicitud.id, estado, this.alcanceEmpresa(solicitud.empresa_id))
      .subscribe({
        next: (res) => {
          this.reemplazarSolicitud(res);
          this.cargarResumen();
          this.mostrarMensaje(`Estado actualizado a "${estado}".`, 'success');
        },
        error: (err) => {
          this.mostrarMensaje(this.mensajeError(err, 'No se pudo cambiar el estado.'), 'error');
        },
      });
  }

  // ---------------------------------------------------------------
  // Resultados
  // ---------------------------------------------------------------

  abrirNuevoResultado(): void {
    this.formularioResultado.set({
      parametro: '',
      resultado: '',
      unidad: '',
      referencia: '',
      observacion: '',
    });
    this.errorResultado.set(null);
    this.modalResultadoAbierto.set(true);
  }

  cerrarResultado(): void {
    this.modalResultadoAbierto.set(false);
    this.errorResultado.set(null);
  }

  actualizarResultado(campo: keyof FormularioResultado, valor: string): void {
    this.formularioResultado.update((form) => ({ ...form, [campo]: valor }));
  }

  guardarResultado(): void {
    const solicitud = this.solicitudSeleccionada();
    const f = this.formularioResultado();

    if (!solicitud) return;

    if (!f.parametro.trim()) {
      this.errorResultado.set('El parámetro es obligatorio.');
      return;
    }

    if (!f.resultado.trim()) {
      this.errorResultado.set('El resultado es obligatorio.');
      return;
    }

    this.guardando.set(true);
    this.errorResultado.set(null);

    this.laboratorioService
      .agregarResultado(
        solicitud.id,
        {
          parametro: f.parametro.trim(),
          resultado: f.resultado.trim(),
          unidad: f.unidad.trim() || null,
          referencia: f.referencia.trim() || null,
          observacion: f.observacion.trim() || null,
        },
        this.alcanceEmpresa(solicitud.empresa_id)
      )
      .subscribe({
        next: (res) => {
          this.guardando.set(false);
          this.cerrarResultado();
          this.reemplazarSolicitud(res);
          this.cargarResumen();
          this.mostrarMensaje('Resultado registrado correctamente.', 'success');
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorResultado.set(
            this.mensajeError(err, 'No se pudo registrar el resultado. Intenta de nuevo.')
          );
        },
      });
  }

  // ---------------------------------------------------------------
  // Notas
  // ---------------------------------------------------------------

  abrirNuevaNota(): void {
    this.formularioNota.set({ nota: '' });
    this.errorNota.set(null);
    this.modalNotaAbierto.set(true);
  }

  cerrarNota(): void {
    this.modalNotaAbierto.set(false);
    this.errorNota.set(null);
  }

  actualizarNota(valor: string): void {
    this.formularioNota.set({ nota: valor });
  }

  guardarNota(): void {
    const solicitud = this.solicitudSeleccionada();
    const nota = this.formularioNota().nota.trim();

    if (!solicitud) return;

    if (!nota) {
      this.errorNota.set('Escribe una nota antes de guardar.');
      return;
    }

    this.guardando.set(true);
    this.errorNota.set(null);

    this.laboratorioService
      .agregarNota(solicitud.id, { nota }, this.alcanceEmpresa(solicitud.empresa_id))
      .subscribe({
        next: (res) => {
          this.guardando.set(false);
          this.cerrarNota();
          this.reemplazarSolicitud(res);
          this.cargarResumen();
          this.mostrarMensaje('Nota agregada correctamente.', 'success');
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorNota.set(this.mensajeError(err, 'No se pudo guardar la nota. Intenta de nuevo.'));
        },
      });
  }

  // ---------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------

  obtenerClaseEstado(estado: string): string {
    return estado.toLowerCase().replaceAll(' ', '-').replace('ó', 'o').replace('í', 'i');
  }

  obtenerClasePrioridad(prioridad: string): string {
    return prioridad.toLowerCase().replace('í', 'i');
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return '-';
    }

    const partes = fecha.substring(0, 10).split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  private obtenerFechaActual(): string {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');

    return `${ahora.getFullYear()}-${mes}-${dia}`;
  }

  private obtenerHoraActual(): string {
    const ahora = new Date();

    return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  }

  /** Primer error de validación (422) del backend o el mensaje general. */
  private mensajeError(err: any, porDefecto: string): string {
    const errores = err?.error?.errors;

    if (errores && typeof errores === 'object') {
      const primero = Object.values(errores)[0];

      if (Array.isArray(primero) && primero.length > 0) {
        return String(primero[0]);
      }
    }

    return err?.error?.message || porDefecto;
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje.set(mensaje);
    this.tipoMensaje.set(tipo);

    setTimeout(() => this.mensaje.set(''), 3000);
  }
}