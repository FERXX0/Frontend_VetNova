import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { CitaService } from '../../core/services/cita.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa, EmpresaOpcion } from '../../core/models/empresa.model';
import { PacienteService } from '../../core/services/paciente.service';
import { ServicioService } from '../../core/services/servicio.service';
import { Cita, CitaPayload, EstadoCita, Profesional, TipoConsulta } from '../../core/models/cita.model';
import { Paciente } from '../../core/models/paciente.model';
import { Servicio } from '../../core/models/servicio.model';
import { AlcanceApi } from '../../core/utils/alcance-api';
import { SessionService } from '../../core/services/session.service';
import { AtencionCitaService } from '../../core/services/atencion-cita.service';
import { AtencionCitaPayload, AtencionCitaResponse, HistorialAgendaItem, MedicamentoAtencion, MedicamentoAtencionPayload } from '../../core/models/atencion-cita.model';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class AgendaComponent implements OnInit {
  private readonly citaService = inject(CitaService);
  private readonly pacienteService = inject(PacienteService);
  private readonly servicioService = inject(ServicioService);
  private readonly empresaService = inject(EmpresaService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionService = inject(SessionService);
  private readonly atencionCitaService = inject(AtencionCitaService);

  // Esta misma pantalla se usa en /super-usuario/agenda y en /panel/agenda.
  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  empresasDisponibles = signal<EmpresaOpcion[]>([]);
  profesionales = signal<Profesional[]>([]);
  profesionalesFormulario = signal<Profesional[]>([]);
  opcionesProfesionales = computed(() => this.esVistaSuperUsuario() ? this.profesionalesFormulario() : this.profesionales());
  filtroEmpresa = signal<string>('todas');
  filtroProfesional = signal<string>('todos');

  // Fecha seleccionada en formato YYYY-MM-DD
  fechaSeleccionada = signal(this.formatoFechaIso(new Date()));
  vistaModo = signal<'dia' | 'lista'>('dia');
  filtroEstado = signal<EstadoCita | 'todos'>('todos');

  citas = signal<Cita[]>([]);
  pacientes = signal<Paciente[]>([]);
  servicios = signal<Servicio[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  // Franjas horarias de atención (8:00 AM a 6:00 PM)
  readonly franjasHorarias = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  ];

  readonly tiposConsulta: { valor: TipoConsulta; etiqueta: string }[] = [
    { valor: 'general', etiqueta: 'Consulta General' },
    { valor: 'vacunacion', etiqueta: 'Vacunación' },
    { valor: 'desparasitacion', etiqueta: 'Desparasitación' },
    { valor: 'control', etiqueta: 'Control / Seguimiento' },
    { valor: 'cirugia', etiqueta: 'Cirugía' },
    { valor: 'urgencia', etiqueta: 'Urgencia' },
    { valor: 'estetica', etiqueta: 'Peluquería / Estética' },
  ];

  readonly estados: { valor: EstadoCita; etiqueta: string }[] = [
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'confirmada', etiqueta: 'Confirmada' },
    { valor: 'cumplida', etiqueta: 'Cumplida' },
    { valor: 'atendida', etiqueta: 'Atendida' },
    { valor: 'cancelada', etiqueta: 'Cancelada' },
  ];

  // Citas filtradas por fecha seleccionada y estado
  citasDelDia = computed(() => {
    const fecha = this.fechaSeleccionada();
    const estado = this.filtroEstado();
    const empresa = this.filtroEmpresa();
    const profesional = this.filtroProfesional();
    return this.citas().filter((c) => {
      const coincideFecha = c.fecha === fecha;
      const coincideEstado = estado === 'todos' || c.estado === estado;
      const coincideEmpresa = empresa === 'todas' || c.empresa_id === empresa;
      const coincideProfesional = profesional === 'todos' || c.veterinario_id === profesional;
      return coincideFecha && coincideEstado && coincideEmpresa && coincideProfesional;
    });
  });

  // Estadísticas del día
  statsDia = computed(() => {
    const fecha = this.fechaSeleccionada();
    const todasDelDia = this.citas().filter((c) => c.fecha === fecha);
    return {
      total: todasDelDia.length,
      confirmadas: todasDelDia.filter((c) => c.estado === 'confirmada').length,
      pendientes: todasDelDia.filter((c) => c.estado === 'pendiente').length,
      cumplidas: todasDelDia.filter((c) => c.estado === 'cumplida').length,
      atendidas: todasDelDia.filter((c) => c.estado === 'atendida').length,
    };
  });

  // Fecha formateada en español legible
  fechaLegible = computed(() => {
    const [anio, mes, dia] = this.fechaSeleccionada().split('-').map(Number);
    const date = new Date(anio, mes - 1, dia);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  // ---------- Modal Agendar / Editar Cita ----------
  modalAbierto = signal(false);
  citaEnEdicion = signal<Cita | null>(null);
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);

  form: FormGroup;

  // ---------- Atención clínica desde la cita ----------
  modalAtencionAbierto = signal(false);
  atencionCargando = signal(false);
  atencionGuardando = signal(false);
  atencionError = signal<string | null>(null);
  atencionCita = signal<Cita | null>(null);
  tipoFormatoAtencion = signal<AtencionCitaResponse['tipo_formato']>('general');
  medicamentosDisponibles = signal<MedicamentoAtencion[]>([]);
  historialAgendaAtencion = signal<HistorialAgendaItem[]>([]);
  medicamentosAtencion = signal<MedicamentoAtencionPayload[]>([]);

  atencion = signal({
    fecha: this.formatoFechaIso(new Date()),
    motivo: '',
    peso_kg: null as number | null,
    temperatura_c: null as number | null,
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
    evolucion: '',
    detalles: {
      procedimiento: '',
      categoria: '',
      duracion: '',
      sala: '',
      prioridad: 'Media',
      indicaciones: '',
    },
    vacunacion: {
      nombre: '',
      tipo: 'Otra' as 'Antirrábica' | 'Polivalente' | 'Refuerzo' | 'Otra',
      lote: '',
      fecha_aplicacion: this.formatoFechaIso(new Date()),
      proxima_fecha: '',
      observaciones: '',
    },
    desparasitacion: {
      producto: '',
      tipo: 'Interna' as 'Interna' | 'Externa' | 'Interna y Externa',
      fecha_aplicacion: this.formatoFechaIso(new Date()),
      proxima_fecha: '',
      observaciones: '',
    },
  });

  readonly esRecepcionista = computed(() => this.sessionService.codigoRol() === 'recepcionista');
  readonly esVeterinario = computed(() => this.sessionService.codigoRol() === 'veterinario');
  readonly puedeAgendar = computed(() => !this.esVeterinario());

  constructor() {
    this.form = this.fb.group({
      empresa_id: [''],
      paciente_id: ['', [Validators.required]],
      servicio_id: ['', [Validators.required]],
      veterinario_id: ['', [Validators.required]],
      fecha: [this.fechaSeleccionada(), [Validators.required]],
      hora_inicio: ['09:00', [Validators.required]],
      hora_fin: ['09:30'],
      tipo_consulta: [{ value: 'general', disabled: true }, [Validators.required]],
      motivo: ['', [Validators.required, Validators.maxLength(200)]],
      estado: ['confirmada', [Validators.required]],
      observaciones: ['', [Validators.maxLength(300)]],
    });
  }

  ngOnInit(): void {
    if (!this.esVistaSuperUsuario()) {
      this.cargarPacientes();
      this.cargarServicios();
    }

    this.cargarCitas();
    this.cargarProfesionales();

    if (this.esVistaSuperUsuario()) {
      this.empresaService.listarOpciones().subscribe({
        next: (respuesta) => this.empresasDisponibles.set(respuesta || []),
        error: () => {},
      });

      this.form.get('empresa_id')!.valueChanges.pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((empresaId) => {
        this.cargarOpcionesFormulario(empresaId);
      });
    }
  }

  private alcanceListado(): AlcanceApi | undefined {
    if (!this.esVistaSuperUsuario()) {
      return undefined;
    }

    const empresa = this.filtroEmpresa();
    return { plataforma: true, empresaId: empresa === 'todas' ? null : empresa };
  }

  private alcanceEscritura(empresaId?: string | null): AlcanceApi | undefined {
    return this.esVistaSuperUsuario() ? { plataforma: true, empresaId } : undefined;
  }

  private cargarOpcionesFormulario(empresaId?: string | null): void {
    if (!empresaId) {
      this.pacientes.set([]);
      this.servicios.set([]);
      this.profesionalesFormulario.set([]);
      return;
    }

    const alcance = this.alcanceEscritura(empresaId);

    this.pacienteService.listar({ per_page: 100 }, alcance).subscribe({
      next: (res) => this.pacientes.set(res.data || []),
      error: () => this.pacientes.set([]),
    });

    this.servicioService.listar(true, alcance).subscribe({
      next: (res) => this.servicios.set(res || []),
      error: () => this.servicios.set([]),
    });

    this.citaService.listarProfesionales(alcance).subscribe({
      next: (res) => this.profesionalesFormulario.set(res || []),
      error: () => this.profesionalesFormulario.set([]),
    });
  }

  cargarProfesionales(): void {
    this.citaService.listarProfesionales(this.alcanceListado()).subscribe({
      next: (res) => this.profesionales.set(res || []),
      error: () => this.profesionales.set([]),
    });
  }

  onFiltroEmpresaChange(empresaId: string): void {
    this.filtroEmpresa.set(empresaId);
    this.filtroProfesional.set('todos');
    this.cargarCitas();
    this.cargarProfesionales();
  }

  cargarServicios(): void {
    this.servicioService.listar(true).subscribe({
      next: (res) => {
        this.servicios.set(res || []);
      },
      error: () => {
        this.servicios.set([]);
      },
    });
  }

  onServicioSeleccionado(servicioId: string): void {
    const servicio = this.servicios().find((s) => s.id === servicioId);
    if (!servicio) {
      this.form.patchValue({ tipo_consulta: 'general', hora_fin: '' });
      return;
    }

    this.form.patchValue({ tipo_consulta: servicio.tipo_consulta });

    const horaInicio = this.form.get('hora_inicio')?.value as string;
    if (horaInicio) {
      this.form.patchValue({ hora_fin: this.sumarMinutos(horaInicio, servicio.duracion_minutos) });
    }
  }

  private sumarMinutos(horaHHmm: string, minutos: number): string {
    const [h, m] = horaHHmm.split(':').map(Number);
    const total = h * 60 + m + minutos;
    const horaFin = Math.floor((total % (24 * 60)) / 60);
    const minFin = total % 60;
    return `${String(horaFin).padStart(2, '0')}:${String(minFin).padStart(2, '0')}`;
  }

  cargarPacientes(): void {
    this.pacienteService.listar({ per_page: 100 }).subscribe({
      next: (res) => {
        this.pacientes.set(res.data || []);
      },
      error: () => {
        this.pacientes.set([]);
      },
    });
  }

  cargarCitas(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.citaService.listarPorFecha(this.fechaSeleccionada(), this.alcanceListado()).subscribe({
      next: (data) => {
        this.citas.set(data || []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.citas.set([]);
        this.error.set(
          err?.error?.message || 'No se pudieron cargar las citas desde el servidor.'
        );
      },
    });
  }

  irAHoy(): void {
    this.fechaSeleccionada.set(this.formatoFechaIso(new Date()));
    this.cargarCitas();
  }

  cambiarDia(delta: number): void {
    const [anio, mes, dia] = this.fechaSeleccionada().split('-').map(Number);
    const date = new Date(anio, mes - 1, dia);
    date.setDate(date.getDate() + delta);
    this.fechaSeleccionada.set(this.formatoFechaIso(date));
    this.cargarCitas();
  }

  onFechaInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    if (valor) {
      this.fechaSeleccionada.set(valor);
      this.cargarCitas();
    }
  }

  citasEnFranja(hora: string): Cita[] {
    const horaNum = parseInt(hora.split(':')[0], 10);
    return this.citasDelDia().filter((c) => {
      const citaHoraNum = parseInt(c.hora_inicio.split(':')[0], 10);
      return citaHoraNum === horaNum;
    });
  }

  abrirModalCrear(horaInicial?: string): void {
    if (!this.puedeAgendar()) {
      this.error.set('Los veterinarios no pueden agendar citas.');
      return;
    }

    this.citaEnEdicion.set(null);
    this.errorFormulario.set(null);
    if (this.esVistaSuperUsuario()) {
      this.pacientes.set([]);
      this.servicios.set([]);
      this.profesionalesFormulario.set([]);
      this.form.reset({
        empresa_id: '',
        paciente_id: '',
        servicio_id: '',
        veterinario_id: '',
        fecha: this.fechaSeleccionada(),
        hora_inicio: horaInicial || '09:00',
        hora_fin: '09:30',
        tipo_consulta: { value: 'general', disabled: true },
        motivo: '',
        estado: 'confirmada',
        observaciones: '',
      });
    } else {
      this.form.reset({
        empresa_id: '',
        paciente_id: this.pacientes()[0]?.id || '',
        servicio_id: '',
        veterinario_id: this.profesionales()[0]?.id ?? '',
        fecha: this.fechaSeleccionada(),
        hora_inicio: horaInicial || '09:00',
        hora_fin: '09:30',
        tipo_consulta: { value: 'general', disabled: true },
        motivo: '',
        estado: 'confirmada',
        observaciones: '',
      });
    }
    this.modalAbierto.set(true);
  }

  abrirModalEditar(cita: Cita): void {
    this.citaEnEdicion.set(cita);
    this.errorFormulario.set(null);
    if (this.esVistaSuperUsuario() && cita.empresa_id) {
      this.cargarOpcionesFormulario(cita.empresa_id);
    }
    this.form.reset({
      empresa_id: cita.empresa_id || '',
      paciente_id: cita.paciente_id,
      servicio_id: cita.servicio_id || '',
      veterinario_id: cita.veterinario_id ?? '',
      fecha: cita.fecha,
      hora_inicio: cita.hora_inicio,
      hora_fin: cita.hora_fin || '',
      tipo_consulta: { value: cita.tipo_consulta, disabled: true },
      motivo: cita.motivo,
      estado: cita.estado,
      observaciones: cita.observaciones || '',
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  guardar(): void {
    if (!this.puedeAgendar() && !this.citaEnEdicion()) {
      this.errorFormulario.set('Los veterinarios no pueden agendar citas.');
      return;
    }

    this.errorFormulario.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.esVistaSuperUsuario() && !this.form.value.empresa_id) {
      this.errorFormulario.set('Selecciona la empresa a la que pertenece la cita.');
      return;
    }

    this.guardando.set(true);
    const formVal = this.form.getRawValue();
    const { empresa_id, ...restoForm } = formVal;
    const pacienteSeleccionado = this.pacientes().find((p) => p.id === restoForm.paciente_id);

    const payload: CitaPayload = {
      ...restoForm,
      servicio_id: restoForm.servicio_id || null,
      paciente_nombre: pacienteSeleccionado?.nombre || 'Paciente',
      propietario_nombre: pacienteSeleccionado?.propietario?.nombre || 'Propietario',
      propietario_celular: pacienteSeleccionado?.propietario?.celular || '',
    };

    const enEdicion = this.citaEnEdicion();
    const alcance = enEdicion
      ? this.alcanceEscritura(enEdicion.empresa_id)
      : this.alcanceEscritura(empresa_id);

    const req$ = enEdicion
      ? this.citaService.actualizar(enEdicion.id, payload, alcance)
      : this.citaService.crear(payload, alcance);

    req$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargarCitas();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(
          err?.error?.message || 'No se pudo guardar la cita en el servidor.'
        );
      },
    });
  }

  cambiarEstadoCita(cita: Cita, nuevoEstado: EstadoCita): void {
    this.citaService.cambiarEstado(cita.id, nuevoEstado, this.alcanceEscritura(cita.empresa_id)).subscribe({
      next: () => this.cargarCitas(),
      error: () => this.error.set('No se pudo actualizar el estado de la cita.'),
    });
  }

  eliminarCita(cita: Cita): void {
    const confirmado = confirm(`¿Cancelar y eliminar la cita de "${cita.paciente_nombre}"?`);
    if (!confirmado) return;

    this.citaService.eliminar(cita.id, this.alcanceEscritura(cita.empresa_id)).subscribe({
      next: () => this.cargarCitas(),
      error: () => this.error.set('No se pudo eliminar la cita en el servidor.'),
    });
  }

  marcarLlegada(cita: Cita): void {
    this.citaService.cambiarEstado(cita.id, 'cumplida', this.alcanceEscritura(cita.empresa_id)).subscribe({
      next: () => this.cargarCitas(),
      error: (err) => this.error.set(err?.error?.message || 'No se pudo registrar la llegada del paciente.'),
    });
  }

  abrirAtencion(cita: Cita): void {
    if (cita.estado !== 'cumplida') {
      this.error.set('La cita debe ser marcada como cumplida por recepción antes de iniciar la atención.');
      return;
    }

    this.atencionCargando.set(true);
    this.atencionError.set(null);
    this.atencionCita.set(cita);

    this.atencionCitaService.obtener(cita.id, this.alcanceEscritura(cita.empresa_id)).subscribe({
      next: (respuesta) => {
        this.tipoFormatoAtencion.set(respuesta.tipo_formato);
        this.medicamentosDisponibles.set(respuesta.medicamentos || []);
        this.historialAgendaAtencion.set(respuesta.historial_agenda || []);
        this.inicializarAtencion(cita);
        this.modalAtencionAbierto.set(true);
        this.atencionCargando.set(false);
      },
      error: (err) => {
        this.atencionCargando.set(false);
        this.atencionError.set(err?.error?.message || 'No se pudo cargar el formato de atención.');
      },
    });
  }

  private inicializarAtencion(cita: Cita): void {
    const hoy = this.formatoFechaIso(new Date());
    this.atencion.set({
      fecha: hoy,
      motivo: cita.motivo || '',
      peso_kg: null,
      temperatura_c: null,
      diagnostico: '',
      tratamiento: '',
      observaciones: cita.observaciones || '',
      evolucion: '',
      detalles: {
        procedimiento: '', categoria: '', duracion: '', sala: '', prioridad: 'Media', indicaciones: '',
      },
      vacunacion: {
        nombre: '', tipo: 'Otra', lote: '', fecha_aplicacion: hoy, proxima_fecha: '', observaciones: '',
      },
      desparasitacion: {
        producto: '', tipo: 'Interna', fecha_aplicacion: hoy, proxima_fecha: '', observaciones: '',
      },
    });
    this.medicamentosAtencion.set([]);
    this.historialAgendaAtencion.set([]);
  }

  cerrarAtencion(): void {
    if (this.atencionGuardando()) return;
    this.modalAtencionAbierto.set(false);
    this.atencionCita.set(null);
    this.historialAgendaAtencion.set([]);
  }

  actualizarAtencion<K extends keyof ReturnType<typeof this.atencion>>(campo: K, valor: ReturnType<typeof this.atencion>[K]): void {
    this.atencion.update((actual) => ({ ...actual, [campo]: valor }));
  }

  actualizarDetalle(campo: keyof ReturnType<typeof this.atencion>['detalles'], valor: string): void {
    this.atencion.update((actual) => ({
      ...actual,
      detalles: { ...actual.detalles, [campo]: valor },
    }));
  }

  actualizarVacunacion(campo: keyof ReturnType<typeof this.atencion>['vacunacion'], valor: string): void {
    this.atencion.update((actual) => ({
      ...actual,
      vacunacion: { ...actual.vacunacion, [campo]: valor },
    }));
  }

  actualizarDesparasitacion(campo: keyof ReturnType<typeof this.atencion>['desparasitacion'], valor: string): void {
    this.atencion.update((actual) => ({
      ...actual,
      desparasitacion: { ...actual.desparasitacion, [campo]: valor },
    }));
  }

  agregarMedicamentoAtencion(): void {
    this.medicamentosAtencion.update((lista) => [
      ...lista,
      {
        medicamento_id: '',
        dosis_cantidad: 1,
        dosis_unidad: 'dosis',
        frecuencia_horas: 8,
        duracion_dias: 1,
        via: 'Oral',
        indicaciones: null,
      },
    ]);
  }

  eliminarMedicamentoAtencion(index: number): void {
    this.medicamentosAtencion.update((lista) => lista.filter((_, i) => i !== index));
  }

  actualizarMedicamentoAtencion(index: number, campo: keyof MedicamentoAtencionPayload, valor: string | number | null): void {
    this.medicamentosAtencion.update((lista) => lista.map((item, i) => i === index ? { ...item, [campo]: valor } : item));
  }

  medicamentoSeleccionado(id: string): MedicamentoAtencion | undefined {
    return this.medicamentosDisponibles().find((med) => med.id === id);
  }

  cantidadMedicamento(index: number): number {
    const item = this.medicamentosAtencion()[index];
    if (!item) return 0;
    const administracionesDia = item.frecuencia_horas ? 24 / item.frecuencia_horas : 1;
    return Number((item.dosis_cantidad * administracionesDia * item.duracion_dias).toFixed(2));
  }

  guardarAtencion(): void {
    const cita = this.atencionCita();
    const tipo = this.tipoFormatoAtencion();
    const datos = this.atencion();

    if (!cita) return;

    if ((tipo !== 'vacunacion' && tipo !== 'desparasitacion') && !datos.diagnostico.trim()) {
      this.atencionError.set('El diagnóstico es obligatorio para este tipo de atención.');
      return;
    }

    if (tipo === 'vacunacion' && (!datos.vacunacion.nombre || !datos.vacunacion.proxima_fecha)) {
      this.atencionError.set('Completa la vacuna y la próxima fecha.');
      return;
    }

    if (tipo === 'desparasitacion' && (!datos.desparasitacion.producto || !datos.desparasitacion.proxima_fecha)) {
      this.atencionError.set('Completa el producto y la próxima fecha.');
      return;
    }

    if (tipo === 'cirugia' && (!datos.detalles.procedimiento || !datos.detalles.categoria || !datos.detalles.duracion || !datos.detalles.sala || !datos.detalles.indicaciones)) {
      this.atencionError.set('Completa los datos requeridos del procedimiento quirúrgico.');
      return;
    }

    if (this.medicamentosAtencion().some((med) => !med.medicamento_id || !med.dosis_cantidad || !med.duracion_dias || !med.via)) {
      this.atencionError.set('Completa todos los datos requeridos de los medicamentos.');
      return;
    }

    const payload: AtencionCitaPayload = {
      fecha: datos.fecha,
      motivo: datos.motivo,
      peso_kg: datos.peso_kg,
      temperatura_c: datos.temperatura_c,
      diagnostico: datos.diagnostico || null,
      tratamiento: datos.tratamiento || null,
      observaciones: datos.observaciones || null,
      evolucion: datos.evolucion || null,
      detalles: datos.detalles,
      medicamentos: this.medicamentosAtencion(),
    };

    if (tipo === 'vacunacion') payload.vacunacion = { ...datos.vacunacion, lote: datos.vacunacion.lote || null, observaciones: datos.vacunacion.observaciones || null };
    if (tipo === 'desparasitacion') payload.desparasitacion = { ...datos.desparasitacion, observaciones: datos.desparasitacion.observaciones || null };

    this.atencionGuardando.set(true);
    this.atencionError.set(null);


    this.atencionCitaService.registrar(cita.id, payload, this.alcanceEscritura(cita.empresa_id)).subscribe({
      next: () => {
        // La atención clínica se guardó correctamente.
        // Ahora marcamos la cita como atendida.
        this.citaService.cambiarEstado(
          cita.id,
          'atendida',
        this.alcanceEscritura(cita.empresa_id)).subscribe({
          next: () => {
            this.atencionGuardando.set(false);
            this.modalAtencionAbierto.set(false);
            this.atencionCita.set(null);
            this.historialAgendaAtencion.set([]);

            // Recargar la agenda para reflejar el nuevo estado.
            this.cargarCitas();
          },
          error: (err) => {
            this.atencionGuardando.set(false);
            this.atencionError.set(
              err?.error?.message ||
              'La atención se guardó, pero no se pudo actualizar el estado de la cita.'
            );
          },
        });
      },
      error: (err) => {
        this.atencionGuardando.set(false);
        this.atencionError.set(
          err?.error?.message ||
          'No se pudo guardar la atención clínica.'
        );
      },
    });
  }

  private formatoFechaIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}