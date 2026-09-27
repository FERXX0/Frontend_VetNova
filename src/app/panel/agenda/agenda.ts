import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CitaService } from '../../core/services/cita.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa } from '../../core/models/empresa.model';
import { UsuarioService } from '../../core/services/usuario.service';
import { PacienteService } from '../../core/services/paciente.service';
import { ServicioService } from '../../core/services/servicio.service';
import { Cita, CitaPayload, EstadoCita, TipoConsulta } from '../../core/models/cita.model';
import { Paciente } from '../../core/models/paciente.model';
import { Servicio } from '../../core/models/servicio.model';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class AgendaComponent implements OnInit {
  private readonly citaService = inject(CitaService);
  private readonly pacienteService = inject(PacienteService);
  private readonly servicioService = inject(ServicioService);
  private readonly empresaService = inject(EmpresaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Esta misma pantalla se usa en /super-usuario/agenda y en /panel/agenda.
  // Los filtros de Empresa y Usuario Profesional SOLO aplican en Super Usuario.
  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  empresasDisponibles = signal<Empresa[]>([]);
  profesionalesDisponibles = signal<string[]>([]);
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
    { valor: 'atendida', etiqueta: 'Atendida' },
    { valor: 'cancelada', etiqueta: 'Cancelada' },
  ];

  readonly veterinarios = [
    'Dr. Alejandro Gómez',
    'Dra. Valentina Restrepo',
    'Dr. Felipe Castro',
    'Dra. Camila Torres',
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
      const coincideProfesional = profesional === 'todos' || c.veterinario_nombre === profesional;
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

  constructor() {
    this.form = this.fb.group({
      empresa_id: [''],
      paciente_id: ['', [Validators.required]],
      servicio_id: [''],
      veterinario_nombre: ['Dr. Alejandro Gómez', [Validators.required]],
      fecha: [this.fechaSeleccionada(), [Validators.required]],
      hora_inicio: ['09:00', [Validators.required]],
      hora_fin: ['09:30'],
      tipo_consulta: ['general', [Validators.required]],
      motivo: ['', [Validators.required, Validators.maxLength(200)]],
      estado: ['confirmada', [Validators.required]],
      observaciones: ['', [Validators.maxLength(300)]],
    });
  }

  ngOnInit(): void {
    this.cargarPacientes();
    this.cargarServicios();
    this.cargarCitas();

    if (this.esVistaSuperUsuario()) {
      this.empresaService.listar().subscribe({
        next: (respuesta) => this.empresasDisponibles.set(respuesta.data),
        error: () => {},
      });

      // Solo roles que atienden pacientes directamente (no Administrador,
      // Contabilidad, Recepción, etc.). Ajusta esta lista si agregan roles nuevos.
      const rolesQueAtienden = ['veterinario', 'auxiliar_veterinara'];

      this.usuarioService.listarGlobal().subscribe({
        next: (respuesta) => {
          const nombres = [
            ...new Set(
              respuesta.data
                .filter((u) => rolesQueAtienden.includes(u.rol?.codigo ?? ''))
                .map((u) => u.nombre)
            ),
          ];
          this.profesionalesDisponibles.set(nombres);
        },
        error: () => {},
      });
    }
  }

  cargarServicios(): void {
    this.servicioService.listar(true).subscribe({
      next: (res) => {
        this.servicios.set(res || []);
      },
      error: () => {
        // Fallback demostrativo ante backend no disponible
        this.servicios.set([
          { id: 's-001', nombre: 'Consulta General', tipo_consulta: 'general', duracion_minutos: 30, precio: 0, activo: true },
          { id: 's-002', nombre: 'Vacunación', tipo_consulta: 'vacunacion', duracion_minutos: 20, precio: 0, activo: true },
          { id: 's-003', nombre: 'Desparasitación', tipo_consulta: 'desparasitacion', duracion_minutos: 20, precio: 0, activo: true },
          { id: 's-004', nombre: 'Cirugía', tipo_consulta: 'cirugia', duracion_minutos: 90, precio: 0, activo: true },
          { id: 's-005', nombre: 'Urgencia', tipo_consulta: 'urgencia', duracion_minutos: 30, precio: 0, activo: true },
          { id: 's-006', nombre: 'Control / Seguimiento', tipo_consulta: 'control', duracion_minutos: 20, precio: 0, activo: true },
          { id: 's-007', nombre: 'Peluquería / Estética', tipo_consulta: 'estetica', duracion_minutos: 45, precio: 0, activo: true },
        ]);
      },
    });
  }

  /**
   * Al elegir un servicio, se auto-completa el tipo de consulta y (si el
   * usuario no ha tocado la hora fin) se sugiere la hora fin según la
   * duración configurada en el servicio. El usuario puede seguir editando
   * ambos campos manualmente después.
   */
  onServicioSeleccionado(servicioId: string): void {
    const servicio = this.servicios().find((s) => s.id === servicioId);
    if (!servicio) return;

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
    this.pacienteService.listar().subscribe({
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

    this.citaService.listar().subscribe({
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


  // Navegación de Fechas
  irAHoy(): void {
    this.fechaSeleccionada.set(this.formatoFechaIso(new Date()));
  }

  cambiarDia(delta: number): void {
    const [anio, mes, dia] = this.fechaSeleccionada().split('-').map(Number);
    const date = new Date(anio, mes - 1, dia);
    date.setDate(date.getDate() + delta);
    this.fechaSeleccionada.set(this.formatoFechaIso(date));
  }

  onFechaInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    if (valor) {
      this.fechaSeleccionada.set(valor);
    }
  }

  // Citas por franja horaria
  citasEnFranja(hora: string): Cita[] {
    const horaNum = parseInt(hora.split(':')[0], 10);
    return this.citasDelDia().filter((c) => {
      const citaHoraNum = parseInt(c.hora_inicio.split(':')[0], 10);
      return citaHoraNum === horaNum;
    });
  }

  // Modal Crear / Editar
  abrirModalCrear(horaInicial?: string): void {
    this.citaEnEdicion.set(null);
    this.errorFormulario.set(null);
    this.form.reset({
      empresa_id: '',
      paciente_id: this.pacientes()[0]?.id || '',
      servicio_id: '',
      veterinario_nombre: 'Dr. Alejandro Gómez',
      fecha: this.fechaSeleccionada(),
      hora_inicio: horaInicial || '09:00',
      hora_fin: '09:30',
      tipo_consulta: 'general',
      motivo: '',
      estado: 'confirmada',
      observaciones: '',
    });
    this.modalAbierto.set(true);
  }

  abrirModalEditar(cita: Cita): void {
    this.citaEnEdicion.set(cita);
    this.errorFormulario.set(null);
    this.form.reset({
      empresa_id: cita.empresa_id || '',
      paciente_id: cita.paciente_id,
      servicio_id: cita.servicio_id || '',
      veterinario_nombre: cita.veterinario_nombre,
      fecha: cita.fecha,
      hora_inicio: cita.hora_inicio,
      hora_fin: cita.hora_fin || '',
      tipo_consulta: cita.tipo_consulta,
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
    const formVal = this.form.value;
    const pacienteSeleccionado = this.pacientes().find((p) => p.id === formVal.paciente_id);

    const payload: CitaPayload = {
      ...formVal,
      servicio_id: formVal.servicio_id || null,
      paciente_nombre: pacienteSeleccionado?.nombre || 'Paciente',
      propietario_nombre: pacienteSeleccionado?.propietario?.nombre || 'Propietario',
      propietario_celular: pacienteSeleccionado?.propietario?.celular || '',
    };

    const enEdicion = this.citaEnEdicion();
    const req$ = enEdicion
      ? this.citaService.actualizar(enEdicion.id, payload)
      : this.citaService.crear(payload);

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
    this.citaService.cambiarEstado(cita.id, nuevoEstado).subscribe({
      next: () => this.cargarCitas(),
      error: () => this.error.set('No se pudo actualizar el estado de la cita.'),
    });
  }

  eliminarCita(cita: Cita): void {
    const confirmado = confirm(`¿Cancelar y eliminar la cita de "${cita.paciente_nombre}"?`);
    if (!confirmado) return;

    this.citaService.eliminar(cita.id).subscribe({
      next: () => this.cargarCitas(),
      error: () => this.error.set('No se pudo eliminar la cita en el servidor.'),
    });
  }

  private formatoFechaIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}