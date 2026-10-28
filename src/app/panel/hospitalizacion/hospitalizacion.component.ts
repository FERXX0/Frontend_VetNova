import { PermisoDirective } from '../../core/directives/permiso.directive';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { BuscadorPacienteComponent } from '../../shared/components/buscador-paciente/buscador-paciente';
import { Paciente } from '../../core/models/paciente.model';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { HospitalizacionService } from '../../core/services/hospitalizacion.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { SessionService } from '../../core/services/session.service';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import { Profesional } from '../../core/models/cita.model';
import { AlcanceApi } from '../../core/utils/alcance-api';
import {
  EstadoEvolucion,
  Hospitalizacion,
  HospitalizacionPayload,
  PrioridadHospitalizacion,
  ResumenHospitalizacion,
} from '../../core/models/hospitalizacion.model';

interface OpcionPaciente {
  id: string;
  nombre: string;
  especie: string;
  propietario: string;
}

interface FormularioHospitalizacion {
  pacienteId: string;
  veterinarioId: string;
  motivo: string;
  diagnostico: string;
  fechaIngreso: string;
  horaIngreso: string;
  fechaSalidaEstimada: string;
  ubicacion: string;
  prioridad: PrioridadHospitalizacion;
  estado: 'Hospitalizado' | 'En observación' | 'Listo para salida';
  observaciones: string;
}

interface FormularioEvolucion {
  estado: EstadoEvolucion | '';
  observaciones: string;
}

@Component({
  selector: 'app-hospitalizacion',
  standalone: true,
  imports: [PermisoDirective, CommonModule, FormsModule, BuscadorPacienteComponent],
  templateUrl: './hospitalizacion.component.html',
  styleUrl: './hospitalizacion.component.scss',
})
export class HospitalizacionComponent implements OnInit {
  private readonly hospitalizacionService = inject(HospitalizacionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  readonly empresasDisponibles = signal<EmpresaOpcion[]>([]);
  readonly filtroEmpresa = signal('');

  readonly hospitalizaciones = signal<Hospitalizacion[]>([]);
  readonly resumen = signal<ResumenHospitalizacion | null>(null);
  readonly paginaActual = signal(1);
  readonly totalPaginas = signal(1);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('Todos');
  readonly filtroPrioridad = signal('Todas');
  readonly filtroEspecie = signal('Todas');

  readonly modalDetalleAbierto = signal(false);
  readonly modalHospitalizacionAbierto = signal(false);
  readonly modalEvolucionAbierto = signal(false);

  readonly hospitalizacionSeleccionada = signal<Hospitalizacion | null>(null);

  readonly modoEdicion = signal(false);
  readonly hospitalizacionEditandoId = signal<string | null>(null);
  readonly empresaFormulario = signal<string | null>(null);

  readonly pacienteSeleccionado = signal<OpcionPaciente | null>(null);
  readonly alcanceFormulario = computed(() => this.alcanceEmpresa(this.empresaFormulario()));
  readonly profesionales = signal<Profesional[]>([]);

  readonly guardando = signal(false);
  readonly errorFormulario = signal<string | null>(null);
  readonly errorEvolucion = signal<string | null>(null);

  readonly mensaje = signal('');
  readonly tipoMensaje = signal<'success' | 'error'>('success');

  readonly formulario = signal<FormularioHospitalizacion>(this.formularioInicial());
  readonly formularioEvolucion = signal<FormularioEvolucion>({
    estado: '',
    observaciones: '',
  });

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly alcanceListado = computed<AlcanceApi | undefined>(() =>
    this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: this.filtroEmpresa() || null }
      : undefined
  );

  readonly totalHospitalizados = computed(() => this.resumen()?.hospitalizados ?? 0);
  readonly totalObservacion = computed(() => this.resumen()?.en_observacion ?? 0);
  readonly totalListosSalida = computed(() => this.resumen()?.listos_salida ?? 0);
  readonly totalCriticos = computed(() => this.resumen()?.criticos ?? 0);
  readonly totalEvoluciones = computed(() => this.resumen()?.total_evoluciones ?? 0);

  readonly puedeCrear = computed(() => !this.esVistaSuperUsuario() || !!this.filtroEmpresa());

  readonly hospitalizacionActiva = computed(
    () => this.hospitalizacionSeleccionada()?.estado !== 'Finalizado'
  );

  ngOnInit(): void {
    if (this.esVistaSuperUsuario()) {
      this.empresaService.listarOpciones().subscribe({
        next: (res) => this.empresasDisponibles.set(res || []),
        error: () => {},
      });
    }

    this.cargarHospitalizaciones(1);
    this.cargarResumen();
  }

  alcanceEmpresa(empresaId: string | null | undefined): AlcanceApi | undefined {
    return this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: empresaId ?? null }
      : undefined;
  }

  cargarHospitalizaciones(pagina = 1): void {
    this.cargando.set(true);
    this.error.set(null);

    const params: {
      buscar?: string;
      estado?: string;
      prioridad?: string;
      especie?: string;
      page?: number;
      per_page?: number;
    } = {
      buscar: this.busqueda().trim() || undefined,
      estado: this.filtroEstado() === 'Todos' ? undefined : this.filtroEstado(),
      prioridad: this.filtroPrioridad() === 'Todas' ? undefined : this.filtroPrioridad(),
      especie: this.filtroEspecie() === 'Todas' ? undefined : this.filtroEspecie(),
      page: pagina,
      per_page: 15,
    };

    this.hospitalizacionService.listar(params, this.alcanceListado()).subscribe({
      next: (res) => {
        this.hospitalizaciones.set(res.data || []);
        this.paginaActual.set(res.current_page || 1);
        this.totalPaginas.set(res.last_page || 1);
        this.total.set(res.total || 0);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message || 'No se pudo cargar el listado de hospitalizaciones.');
      },
    });
  }

  cargarResumen(): void {
    this.hospitalizacionService.resumen(this.alcanceListado()).subscribe({
      next: (res) => this.resumen.set(res),
      error: () => {},
    });
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.cargarHospitalizaciones(pagina);
    }
  }

  private recargarTodo(pagina = this.paginaActual()): void {
    this.cargarHospitalizaciones(pagina);
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

    this.debounceTimer = setTimeout(() => this.cargarHospitalizaciones(1), 350);
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
    this.cargarHospitalizaciones(1);
  }

  cambiarFiltroPrioridad(valor: string): void {
    this.filtroPrioridad.set(valor);
    this.cargarHospitalizaciones(1);
  }

  cambiarFiltroEspecie(valor: string): void {
    this.filtroEspecie.set(valor);
    this.cargarHospitalizaciones(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('Todos');
    this.filtroPrioridad.set('Todas');
    this.filtroEspecie.set('Todas');
    this.filtroEmpresa.set('');
    this.recargarTodo(1);
  }

  abrirDetalle(item: Hospitalizacion): void {
    this.hospitalizacionSeleccionada.set(item);
    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.hospitalizacionSeleccionada.set(null);
  }

  private reemplazarHospitalizacion(actualizada: Hospitalizacion): void {
    this.hospitalizaciones.update((lista) =>
      lista.map((item) => (item.id === actualizada.id ? actualizada : item))
    );

    if (this.hospitalizacionSeleccionada()?.id === actualizada.id) {
      this.hospitalizacionSeleccionada.set(actualizada);
    }
  }

  formularioInicial(): FormularioHospitalizacion {
    return {
      pacienteId: '',
      veterinarioId: '',
      motivo: '',
      diagnostico: '',
      fechaIngreso: this.obtenerFechaActual(),
      horaIngreso: this.obtenerHoraActual(),
      fechaSalidaEstimada: '',
      ubicacion: '',
      prioridad: 'Media',
      estado: 'Hospitalizado',
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
      profesionales: this.hospitalizacionService
        .profesionales(alcance)
        .pipe(catchError(() => of([] as Profesional[]))),
    }).subscribe(({ profesionales }) => {
      this.pacienteSeleccionado.set(pacienteActual);
      this.profesionales.set(profesionales);
      alTerminar(profesionales);
    });
  }

  abrirNuevaHospitalizacion(): void {
    if (!this.puedeCrear()) {
      this.mostrarMensaje('Selecciona una empresa para registrar el ingreso.', 'error');
      return;
    }

    const empresaId = this.esVistaSuperUsuario() ? this.filtroEmpresa() : null;

    this.modoEdicion.set(false);
    this.hospitalizacionEditandoId.set(null);
    this.empresaFormulario.set(empresaId);
    this.errorFormulario.set(null);
    this.formulario.set(this.formularioInicial());

    this.cargarOpciones(empresaId, null, (profesionales) => {
      const usuarioId = this.session.obtenerUsuario()?.id;

      if (usuarioId && profesionales.some((p) => p.id === usuarioId)) {
        this.actualizarFormulario('veterinarioId', usuarioId);
      }

      this.modalHospitalizacionAbierto.set(true);
    });
  }

  editarHospitalizacion(item: Hospitalizacion): void {
    if (item.estado === 'Finalizado') {
      this.mostrarMensaje('Una hospitalización finalizada no se puede modificar.', 'error');
      return;
    }

    this.modoEdicion.set(true);
    this.hospitalizacionEditandoId.set(item.id);
    this.empresaFormulario.set(item.empresa_id);
    this.errorFormulario.set(null);

    this.formulario.set({
      pacienteId: item.paciente?.id ?? '',
      veterinarioId: item.veterinario_id ?? '',
      motivo: item.motivo,
      diagnostico: item.diagnostico ?? '',
      fechaIngreso: item.fecha_ingreso,
      horaIngreso: item.hora_ingreso,
      fechaSalidaEstimada: item.fecha_salida_estimada,
      ubicacion: item.ubicacion,
      prioridad: item.prioridad,
      estado: item.estado,
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
      this.modalHospitalizacionAbierto.set(true);
    });
  }

  cerrarHospitalizacion(): void {
    this.modalHospitalizacionAbierto.set(false);
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

  actualizarFormulario(campo: keyof FormularioHospitalizacion, valor: string): void {
    this.formulario.update((form) => ({ ...form, [campo]: valor }));
  }

  guardarHospitalizacion(): void {
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

    if (!f.motivo.trim()) {
      this.errorFormulario.set('El motivo es obligatorio.');
      return;
    }

    if (!f.fechaIngreso || !f.horaIngreso) {
      this.errorFormulario.set('Indica la fecha y hora de ingreso.');
      return;
    }

    if (!f.fechaSalidaEstimada) {
      this.errorFormulario.set('Indica la fecha estimada de salida.');
      return;
    }

    if (f.fechaSalidaEstimada < f.fechaIngreso) {
      this.errorFormulario.set('La fecha estimada de salida no puede ser anterior al ingreso.');
      return;
    }

    if (!f.ubicacion.trim()) {
      this.errorFormulario.set('La ubicación es obligatoria.');
      return;
    }

    const payload: HospitalizacionPayload = {
      ...(edicion ? {} : { paciente_id: f.pacienteId }),
      veterinario_id: f.veterinarioId,
      motivo: f.motivo.trim(),
      diagnostico: f.diagnostico.trim() || null,
      fecha_ingreso: f.fechaIngreso,
      hora_ingreso: f.horaIngreso,
      fecha_salida_estimada: f.fechaSalidaEstimada,
      ubicacion: f.ubicacion.trim(),
      prioridad: f.prioridad,
      estado: f.estado,
      observaciones: f.observaciones.trim() || null,
    };

    const alcance = this.alcanceEmpresa(this.empresaFormulario());

    const peticion$ = edicion
      ? this.hospitalizacionService.actualizar(this.hospitalizacionEditandoId()!, payload, alcance)
      : this.hospitalizacionService.crear(payload, alcance);

    this.guardando.set(true);
    this.errorFormulario.set(null);

    peticion$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.cerrarHospitalizacion();
        this.mostrarMensaje(
          edicion
            ? 'Hospitalización actualizada correctamente.'
            : 'Hospitalización registrada correctamente.',
          'success'
        );

        if (edicion) {
          this.reemplazarHospitalizacion(res);
          this.cargarResumen();
        } else {
          this.recargarTodo(1);
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(
          this.mensajeError(err, 'No se pudo guardar la hospitalización. Intenta de nuevo.')
        );
      },
    });
  }

  registrarSalida(item: Hospitalizacion): void {
    const nombre = item.paciente?.nombre ?? 'el paciente';
    if (!confirm(`¿Registrar salida de ${nombre}?`)) {
      return;
    }

    this.hospitalizacionService
      .darAlta(item.id, this.alcanceEmpresa(item.empresa_id))
      .subscribe({
        next: (res) => {
          this.reemplazarHospitalizacion(res);
          this.cargarResumen();
          this.mostrarMensaje('Salida registrada correctamente.', 'success');
        },
        error: (err) => {
          this.mostrarMensaje(this.mensajeError(err, 'No se pudo registrar la salida.'), 'error');
        },
      });
  }

  abrirNuevaEvolucion(): void {
    this.formularioEvolucion.set({
      estado: '',
      observaciones: '',
    });
    this.errorEvolucion.set(null);
    this.modalEvolucionAbierto.set(true);
  }

  cerrarEvolucion(): void {
    this.modalEvolucionAbierto.set(false);
    this.errorEvolucion.set(null);
  }

  actualizarFormularioEvolucion(campo: keyof FormularioEvolucion, valor: string): void {
    this.formularioEvolucion.update((form) => ({ ...form, [campo]: valor }));
  }

  guardarEvolucion(): void {
    const item = this.hospitalizacionSeleccionada();
    const f = this.formularioEvolucion();

    if (!item) return;

    if (!f.estado) {
      this.errorEvolucion.set('Selecciona el estado.');
      return;
    }

    if (!f.observaciones.trim()) {
      this.errorEvolucion.set('Escribe las observaciones.');
      return;
    }

    this.guardando.set(true);
    this.errorEvolucion.set(null);

    this.hospitalizacionService
      .agregarEvolucion(
        item.id,
        {
          estado: f.estado as EstadoEvolucion,
          observaciones: f.observaciones.trim(),
        },
        this.alcanceEmpresa(item.empresa_id)
      )
      .subscribe({
        next: (res) => {
          this.guardando.set(false);
          this.cerrarEvolucion();
          this.reemplazarHospitalizacion(res);
          this.cargarResumen();
          this.mostrarMensaje('Evolución registrada correctamente.', 'success');
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorEvolucion.set(
            this.mensajeError(err, 'No se pudo registrar la evolución. Intenta de nuevo.')
          );
        },
      });
  }

  obtenerClaseEstado(estado: string): string {
    return (estado || '')
      .toLowerCase()
      .replaceAll(' ', '-')
      .replace('ó', 'o');
  }

  obtenerClasePrioridad(prioridad: string): string {
    return (prioridad || '')
      .toLowerCase()
      .replace('í', 'i');
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
