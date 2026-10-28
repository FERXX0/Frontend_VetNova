import { PermisoDirective } from '../../core/directives/permiso.directive';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ProcedimientoService } from '../../core/services/procedimiento.service';
import { BuscadorPacienteComponent } from '../../shared/components/buscador-paciente/buscador-paciente';
import { Paciente } from '../../core/models/paciente.model';
import { EmpresaService } from '../../core/services/empresa.service';
import { SessionService } from '../../core/services/session.service';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import { Profesional } from '../../core/models/cita.model';
import { AlcanceApi } from '../../core/utils/alcance-api';
import {
  EstadoProcedimiento,
  NotaProcedimiento,
  NotaProcedimientoPayload,
  PrioridadProcedimiento,
  Procedimiento,
  ProcedimientoPayload,
  ResumenProcedimientos,
} from '../../core/models/procedimiento.model';

interface OpcionPaciente {
  id: string;
  nombre: string;
  especie: string;
  propietario: string;
}

interface FormularioProcedimiento {
  pacienteId: string;
  veterinarioId: string;
  procedimiento: string;
  categoria: string;
  diagnostico: string;
  fecha: string;
  hora: string;
  duracion: string;
  sala: string;
  prioridad: PrioridadProcedimiento;
  estado: 'Programado' | 'En proceso';
  indicaciones: string;
  observaciones: string;
}

interface FormularioNota {
  nota: string;
}

@Component({
  selector: 'app-procedimientos',
  standalone: true,
  imports: [PermisoDirective, CommonModule, FormsModule, BuscadorPacienteComponent],
  templateUrl: './procedimientos.component.html',
  styleUrl: './procedimientos.component.scss',
})
export class ProcedimientosComponent implements OnInit {
  private readonly procedimientoService = inject(ProcedimientoService);
  private readonly empresaService = inject(EmpresaService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  readonly empresasDisponibles = signal<EmpresaOpcion[]>([]);
  readonly filtroEmpresa = signal('');

  readonly procedimientos = signal<Procedimiento[]>([]);
  readonly resumen = signal<ResumenProcedimientos | null>(null);
  readonly paginaActual = signal(1);
  readonly totalPaginas = signal(1);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('Todos');
  readonly filtroPrioridad = signal('Todas');
  readonly filtroCategoria = signal('Todas');
  readonly filtroEspecie = signal('Todas');

  readonly modalDetalleAbierto = signal(false);
  readonly modalFormularioAbierto = signal(false);
  readonly modalNotaAbierto = signal(false);

  readonly procedimientoSeleccionado = signal<Procedimiento | null>(null);

  readonly modoEdicion = signal(false);
  readonly procedimientoEditandoId = signal<string | null>(null);
  readonly empresaFormulario = signal<string | null>(null);

  readonly pacienteSeleccionado = signal<OpcionPaciente | null>(null);
  readonly alcanceFormulario = computed(() => this.alcanceEmpresa(this.empresaFormulario()));
  readonly profesionales = signal<Profesional[]>([]);

  readonly guardando = signal(false);
  readonly errorFormulario = signal<string | null>(null);
  readonly errorNota = signal<string | null>(null);

  readonly mensaje = signal('');
  readonly tipoMensaje = signal<'success' | 'error'>('success');

  readonly formulario = signal<FormularioProcedimiento>(this.formularioInicial());
  readonly formularioNota = signal<FormularioNota>({ nota: '' });

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly alcanceListado = computed<AlcanceApi | undefined>(() =>
    this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: this.filtroEmpresa() || null }
      : undefined
  );

  readonly totalProcedimientos = computed(() => this.resumen()?.total ?? 0);
  readonly totalProgramados = computed(() => this.resumen()?.programados ?? 0);
  readonly totalEnProceso = computed(() => this.resumen()?.en_proceso ?? 0);
  readonly totalCompletados = computed(() => this.resumen()?.completados ?? 0);
  readonly totalAltaPrioridad = computed(() => this.resumen()?.alta_prioridad ?? 0);
  readonly totalNotas = computed(() => this.resumen()?.total_notas ?? 0);

  readonly puedeCrear = computed(() => !this.esVistaSuperUsuario() || !!this.filtroEmpresa());

  readonly procedimientoActivo = computed(() => {
    const e = this.procedimientoSeleccionado()?.estado;
    return e === 'Programado' || e === 'En proceso';
  });

  ngOnInit(): void {
    if (this.esVistaSuperUsuario()) {
      this.empresaService.listarOpciones().subscribe({
        next: (res) => this.empresasDisponibles.set(res || []),
        error: () => {},
      });
    }

    this.cargarProcedimientos(1);
    this.cargarResumen();
  }

  alcanceEmpresa(empresaId: string | null | undefined): AlcanceApi | undefined {
    return this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: empresaId ?? null }
      : undefined;
  }

  cargarProcedimientos(pagina = 1): void {
    this.cargando.set(true);
    this.error.set(null);

    const params: {
      buscar?: string;
      estado?: string;
      prioridad?: string;
      categoria?: string;
      especie?: string;
      page?: number;
      per_page?: number;
    } = {
      buscar: this.busqueda().trim() || undefined,
      estado: this.filtroEstado() === 'Todos' ? undefined : this.filtroEstado(),
      prioridad: this.filtroPrioridad() === 'Todas' ? undefined : this.filtroPrioridad(),
      categoria: this.filtroCategoria() === 'Todas' ? undefined : this.filtroCategoria(),
      especie: this.filtroEspecie() === 'Todas' ? undefined : this.filtroEspecie(),
      page: pagina,
      per_page: 15,
    };

    this.procedimientoService.listar(params, this.alcanceListado()).subscribe({
      next: (res) => {
        this.procedimientos.set(res.data || []);
        this.paginaActual.set(res.current_page || 1);
        this.totalPaginas.set(res.last_page || 1);
        this.total.set(res.total || 0);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message || 'No se pudo cargar el listado de procedimientos.');
      },
    });
  }

  cargarResumen(): void {
    this.procedimientoService.resumen(this.alcanceListado()).subscribe({
      next: (res) => this.resumen.set(res),
      error: () => {},
    });
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.cargarProcedimientos(pagina);
    }
  }

  private recargarTodo(pagina = this.paginaActual()): void {
    this.cargarProcedimientos(pagina);
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

    this.debounceTimer = setTimeout(() => this.cargarProcedimientos(1), 350);
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
    this.cargarProcedimientos(1);
  }

  cambiarFiltroPrioridad(valor: string): void {
    this.filtroPrioridad.set(valor);
    this.cargarProcedimientos(1);
  }

  cambiarFiltroCategoria(valor: string): void {
    this.filtroCategoria.set(valor);
    this.cargarProcedimientos(1);
  }

  cambiarFiltroEspecie(valor: string): void {
    this.filtroEspecie.set(valor);
    this.cargarProcedimientos(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('Todos');
    this.filtroPrioridad.set('Todas');
    this.filtroCategoria.set('Todas');
    this.filtroEspecie.set('Todas');
    this.filtroEmpresa.set('');
    this.recargarTodo(1);
  }

  abrirDetalle(item: Procedimiento): void {
    this.procedimientoSeleccionado.set(item);
    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.procedimientoSeleccionado.set(null);
  }

  private reemplazarProcedimiento(actualizado: Procedimiento): void {
    this.procedimientos.update((lista) =>
      lista.map((item) => (item.id === actualizado.id ? actualizado : item))
    );

    if (this.procedimientoSeleccionado()?.id === actualizado.id) {
      this.procedimientoSeleccionado.set(actualizado);
    }
  }

  formularioInicial(): FormularioProcedimiento {
    return {
      pacienteId: '',
      veterinarioId: '',
      procedimiento: '',
      categoria: 'Terapéutico',
      diagnostico: '',
      fecha: this.obtenerFechaActual(),
      hora: this.obtenerHoraActual(),
      duracion: '',
      sala: '',
      prioridad: 'Media',
      estado: 'Programado',
      indicaciones: '',
      observaciones: '',
    };
  }

  private cargarOpciones(
    empresaId: string | null,
    pacienteActual: OpcionPaciente | null,
    alTerminar: (profesionales: Profesional[]) => void
  ): void {
    const alcance = this.alcanceEmpresa(empresaId);

    forkJoin({
      profesionales: this.procedimientoService
        .profesionales(alcance)
        .pipe(catchError(() => of([] as Profesional[]))),
    }).subscribe(({ profesionales }) => {
      this.pacienteSeleccionado.set(pacienteActual);
      this.profesionales.set(profesionales);
      alTerminar(profesionales);
    });
  }

  abrirNuevoProcedimiento(): void {
    if (!this.puedeCrear()) {
      this.mostrarMensaje('Selecciona una empresa para registrar el procedimiento.', 'error');
      return;
    }

    const empresaId = this.esVistaSuperUsuario() ? this.filtroEmpresa() : null;

    this.modoEdicion.set(false);
    this.procedimientoEditandoId.set(null);
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

  editarProcedimiento(item: Procedimiento): void {
    if (item.estado === 'Completado' || item.estado === 'Cancelado') {
      this.mostrarMensaje('Un procedimiento completado o cancelado no se puede modificar.', 'error');
      return;
    }

    this.modoEdicion.set(true);
    this.procedimientoEditandoId.set(item.id);
    this.empresaFormulario.set(item.empresa_id);
    this.errorFormulario.set(null);

    this.formulario.set({
      pacienteId: item.paciente?.id ?? '',
      veterinarioId: item.veterinario_id ?? '',
      procedimiento: item.procedimiento,
      categoria: item.categoria,
      diagnostico: item.diagnostico ?? '',
      fecha: item.fecha,
      hora: item.hora,
      duracion: item.duracion ?? '',
      sala: item.sala,
      prioridad: item.prioridad,
      estado: item.estado,
      indicaciones: item.indicaciones ?? '',
      observaciones: item.observaciones ?? '',
    });

    const pacienteActual: OpcionPaciente | null = item.paciente
      ? {
          id: item.paciente.id,
          nombre: item.paciente.nombre,
          especie: item.paciente.especie,
          propietario: item.propietario?.nombre ?? '',
        }
      : null;

    this.cargarOpciones(item.empresa_id, pacienteActual, () => {
      this.modalFormularioAbierto.set(true);
    });
  }

  cerrarFormulario(): void {
    this.modalFormularioAbierto.set(false);
    this.errorFormulario.set(null);
  }

  alSeleccionarPaciente(paciente: Paciente): void {
    this.pacienteSeleccionado.set({
      id: paciente.id,
      nombre: paciente.nombre,
      especie: paciente.especie,
      propietario: paciente.propietario?.nombre ?? '',
    });
    this.actualizarFormulario('pacienteId', paciente.id);
  }

  quitarPaciente(): void {
    this.pacienteSeleccionado.set(null);
    this.actualizarFormulario('pacienteId', '');
  }

  actualizarFormulario(campo: keyof FormularioProcedimiento, valor: string): void {
    this.formulario.update((form) => ({ ...form, [campo]: valor }));
  }

  guardarProcedimiento(): void {
    const f = this.formulario();
    const edicion = this.modoEdicion();

    if (!edicion && !f.pacienteId) {
      this.errorFormulario.set('Selecciona un paciente.');
      return;
    }

    if (!f.veterinarioId) {
      this.errorFormulario.set('Selecciona el veterinario responsable.');
      return;
    }

    if (!f.procedimiento.trim()) {
      this.errorFormulario.set('El nombre del procedimiento es obligatorio.');
      return;
    }

    if (!f.fecha || !f.hora) {
      this.errorFormulario.set('Indica la fecha y la hora.');
      return;
    }

    if (!f.sala.trim()) {
      this.errorFormulario.set('La sala es obligatoria.');
      return;
    }

    const payload: ProcedimientoPayload = {
      ...(edicion ? {} : { paciente_id: f.pacienteId }),
      veterinario_id: f.veterinarioId,
      procedimiento: f.procedimiento.trim(),
      categoria: f.categoria,
      diagnostico: f.diagnostico.trim() || null,
      fecha: f.fecha,
      hora: f.hora,
      duracion: f.duracion.trim() || null,
      sala: f.sala.trim(),
      prioridad: f.prioridad,
      estado: f.estado,
      indicaciones: f.indicaciones.trim() || null,
      observaciones: f.observaciones.trim() || null,
    };

    const alcance = this.alcanceEmpresa(this.empresaFormulario());

    const peticion$ = edicion
      ? this.procedimientoService.actualizar(this.procedimientoEditandoId()!, payload, alcance)
      : this.procedimientoService.crear(payload, alcance);

    this.guardando.set(true);
    this.errorFormulario.set(null);

    peticion$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.cerrarFormulario();
        this.mostrarMensaje(
          edicion
            ? 'Procedimiento actualizado correctamente.'
            : 'Procedimiento registrado correctamente.',
          'success'
        );

        if (edicion) {
          this.reemplazarProcedimiento(res);
          this.cargarResumen();
        } else {
          this.recargarTodo(1);
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(
          this.mensajeError(err, 'No se pudo guardar el procedimiento. Intenta de nuevo.')
        );
      },
    });
  }

  cambiarEstado(item: Procedimiento, estado: EstadoProcedimiento): void {
    if (item.estado === estado) {
      return;
    }

    if (estado === 'Completado' || estado === 'Cancelado') {
      if (!confirm('¿Marcar el procedimiento como ' + estado.toLowerCase() + '? Ya no podrá modificarse.')) {
        return;
      }
    }

    this.procedimientoService
      .cambiarEstado(item.id, estado, this.alcanceEmpresa(item.empresa_id))
      .subscribe({
        next: (res) => {
          this.reemplazarProcedimiento(res);
          this.cargarResumen();
          this.mostrarMensaje('Estado actualizado correctamente.', 'success');
        },
        error: (err) => {
          this.mostrarMensaje(this.mensajeError(err, 'No se pudo actualizar el estado.'), 'error');
        },
      });
  }

  abrirNuevaNota(): void {
    this.formularioNota.set({
      nota: '',
    });
    this.errorNota.set(null);
    this.modalNotaAbierto.set(true);
  }

  cerrarNota(): void {
    this.modalNotaAbierto.set(false);
    this.errorNota.set(null);
  }

  actualizarNota(valor: string): void {
    this.formularioNota.set({
      nota: valor,
    });
  }

  guardarNota(): void {
    const item = this.procedimientoSeleccionado();
    const nota = this.formularioNota().nota.trim();

    if (!item) return;

    if (!nota) {
      this.errorNota.set('Escribe una nota antes de guardar.');
      return;
    }

    this.guardando.set(true);
    this.errorNota.set(null);

    this.procedimientoService
      .agregarNota(item.id, { nota }, this.alcanceEmpresa(item.empresa_id))
      .subscribe({
        next: (res) => {
          this.guardando.set(false);
          this.cerrarNota();
          this.reemplazarProcedimiento(res);
          this.cargarResumen();
          this.mostrarMensaje('Nota registrada correctamente.', 'success');
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorNota.set(
            this.mensajeError(err, 'No se pudo registrar la nota. Intenta de nuevo.')
          );
        },
      });
  }

  obtenerClaseEstado(estado: string): string {
    return (estado || '')
      .toLowerCase()
      .replaceAll(' ', '-')
      .replace('í', 'i')
      .replace('ó', 'o');
  }

  obtenerClasePrioridad(prioridad: string): string {
    return (prioridad || '')
      .toLowerCase()
      .replace('í', 'i');
  }

  formatearFecha(fecha: string): string {
    if (!fecha) {
      return '-';
    }

    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  obtenerFechaActual(): string {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');

    return ahora.getFullYear() + '-' + mes + '-' + dia;
  }

  obtenerHoraActual(): string {
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');

    return horas + ':' + minutos;
  }

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
