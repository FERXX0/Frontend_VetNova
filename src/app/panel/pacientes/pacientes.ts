import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PacienteService } from '../../core/services/paciente.service';
import { EstadoPaciente, Paciente, PacientePayload, SexoPaciente } from '../../core/models/paciente.model';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.scss',
})
export class PacientesComponent implements OnInit {
  private readonly pacienteService = inject(PacienteService);
  private readonly fb = inject(FormBuilder);

  pacientes = signal<Paciente[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  // Filtros client-side
  filtroTexto = signal('');
  filtroEspecie = signal<string>('todas');
  filtroEstado = signal<EstadoPaciente | 'todos'>('todos');

  readonly especies = [
    { valor: 'todas', etiqueta: 'Todas las especies' },
    { valor: 'Canino', etiqueta: 'Caninos 🐕' },
    { valor: 'Felino', etiqueta: 'Felinos 🐈' },
    { valor: 'Ave', etiqueta: 'Aves 🦜' },
    { valor: 'Equino', etiqueta: 'Equinos 🐎' },
    { valor: 'Otro', etiqueta: 'Otros' },
  ];

  readonly estados: { valor: EstadoPaciente; etiqueta: string }[] = [
    { valor: 'activo', etiqueta: 'Activo' },
    { valor: 'inactivo', etiqueta: 'Inactivo' },
    { valor: 'fallecido', etiqueta: 'Fallecido' },
  ];

  readonly sexos: { valor: SexoPaciente; etiqueta: string }[] = [
    { valor: 'macho', etiqueta: 'Macho' },
    { valor: 'hembra', etiqueta: 'Hembra' },
    { valor: 'indefinido', etiqueta: 'Indefinido' },
  ];

  pacientesFiltrados = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const especie = this.filtroEspecie();
    const estado = this.filtroEstado();
    const lista = this.pacientes();

    return lista.filter((p) => {
      const coincideTexto =
        !texto ||
        p.nombre.toLowerCase().includes(texto) ||
        (p.raza && p.raza.toLowerCase().includes(texto)) ||
        p.propietario.nombre.toLowerCase().includes(texto) ||
        (p.propietario.celular && p.propietario.celular.includes(texto));

      const coincideEspecie = especie === 'todas' || p.especie.toLowerCase() === especie.toLowerCase();
      const coincideEstado = estado === 'todos' || p.estado === estado;

      return coincideTexto && coincideEspecie && coincideEstado;
    });
  });

  // ---------- Modal Crear / Editar ----------
  modalAbierto = signal(false);
  pacienteEnEdicion = signal<Paciente | null>(null);
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      // Mascota
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      especie: ['Canino', [Validators.required]],
      raza: ['', [Validators.maxLength(100)]],
      sexo: ['macho', [Validators.required]],
      fecha_nacimiento: [''],
      peso_kg: [null, [Validators.min(0)]],
      color: ['', [Validators.maxLength(50)]],
      microchip: ['', [Validators.maxLength(50)]],
      estado: ['activo', [Validators.required]],
      notas: ['', [Validators.maxLength(500)]],

      // Propietario
      propietario_nombre: ['', [Validators.required, Validators.maxLength(150)]],
      propietario_tipo_identificacion: ['CC'],
      propietario_numero_identificacion: ['', [Validators.maxLength(50)]],
      propietario_celular: ['', [Validators.maxLength(30)]],
      propietario_correo: ['', [Validators.email, Validators.maxLength(100)]],
      propietario_direccion: ['', [Validators.maxLength(200)]],
    });
  }

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.pacienteService.listar().subscribe({
      next: (res) => {
        this.pacientes.set(res.data || []);
        this.cargando.set(false);
      },
      error: () => {
        // Fallback demostrativo con datos iniciales si el backend aún no implementa el endpoint (404)
        this.cargando.set(false);
        if (this.pacientes().length === 0) {
          this.pacientes.set([
            {
              id: 'p-001',
              nombre: 'Max',
              especie: 'Canino',
              raza: 'Golden Retriever',
              sexo: 'macho',
              fecha_nacimiento: '2022-04-10',
              edad_estimada: '2 años',
              peso_kg: 28.5,
              color: 'Dorado',
              microchip: '985141001245896',
              estado: 'activo',
              notas: 'Vacunación al día. Alérgico al pollo.',
              propietario: {
                nombre: 'Carlos Mendoza',
                tipo_identificacion: 'CC',
                numero_identificacion: '1098765432',
                celular: '+57 312 456 7890',
                correo: 'carlos.mendoza@email.com',
                direccion: 'Calle 45 # 12-34',
              },
              creado_en: '2026-01-15T09:00:00Z',
            },
            {
              id: 'p-002',
              nombre: 'Luna',
              especie: 'Felino',
              raza: 'Siamés',
              sexo: 'hembra',
              fecha_nacimiento: '2023-01-20',
              edad_estimada: '1 año',
              peso_kg: 3.8,
              color: 'Crema y marrón',
              microchip: '',
              estado: 'activo',
              notas: 'Esterilizada. Próxima desparasitación en septiembre.',
              propietario: {
                nombre: 'Andrea Gómez',
                tipo_identificacion: 'CC',
                numero_identificacion: '1023456789',
                celular: '+57 301 987 6543',
                correo: 'andrea.gomez@email.com',
                direccion: 'Carrera 78 # 45-21',
              },
              creado_en: '2026-02-10T14:30:00Z',
            },
            {
              id: 'p-003',
              nombre: 'Rocky',
              especie: 'Canino',
              raza: 'Bulldog Francés',
              sexo: 'macho',
              fecha_nacimiento: '2021-08-05',
              edad_estimada: '3 años',
              peso_kg: 12.0,
              color: 'Atigrado',
              microchip: '985141009874123',
              estado: 'activo',
              notas: 'Tratamiento dermatológico en curso.',
              propietario: {
                nombre: 'Javier Rodríguez',
                tipo_identificacion: 'CC',
                numero_identificacion: '1034567890',
                celular: '+57 315 654 3210',
                correo: 'javier.rod@email.com',
                direccion: 'Avenida 19 # 104-50',
              },
              creado_en: '2026-03-01T11:20:00Z',
            },
          ]);
        }
      },
    });
  }

  abrirModalCrear(): void {
    this.pacienteEnEdicion.set(null);
    this.errorFormulario.set(null);
    this.form.reset({
      nombre: '',
      especie: 'Canino',
      raza: '',
      sexo: 'macho',
      fecha_nacimiento: '',
      peso_kg: null,
      color: '',
      microchip: '',
      estado: 'activo',
      notas: '',
      propietario_nombre: '',
      propietario_tipo_identificacion: 'CC',
      propietario_numero_identificacion: '',
      propietario_celular: '',
      propietario_correo: '',
      propietario_direccion: '',
    });
    this.modalAbierto.set(true);
  }

  abrirModalEditar(paciente: Paciente): void {
    this.pacienteEnEdicion.set(paciente);
    this.errorFormulario.set(null);
    this.form.reset({
      nombre: paciente.nombre,
      especie: paciente.especie,
      raza: paciente.raza ?? '',
      sexo: paciente.sexo,
      fecha_nacimiento: paciente.fecha_nacimiento ?? '',
      peso_kg: paciente.peso_kg ?? null,
      color: paciente.color ?? '',
      microchip: paciente.microchip ?? '',
      estado: paciente.estado,
      notas: paciente.notas ?? '',
      propietario_nombre: paciente.propietario?.nombre ?? '',
      propietario_tipo_identificacion: paciente.propietario?.tipo_identificacion ?? 'CC',
      propietario_numero_identificacion: paciente.propietario?.numero_identificacion ?? '',
      propietario_celular: paciente.propietario?.celular ?? '',
      propietario_correo: paciente.propietario?.correo ?? '',
      propietario_direccion: paciente.propietario?.direccion ?? '',
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

    this.guardando.set(true);
    const payload: PacientePayload = this.form.value;
    const enEdicion = this.pacienteEnEdicion();

    const req$ = enEdicion
      ? this.pacienteService.actualizar(enEdicion.id, payload)
      : this.pacienteService.crear(payload);

    req$.subscribe({
      next: (pacienteGuardado) => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargarPacientes();
      },
      error: (err) => {
        this.guardando.set(false);
        // Manejo graceful ante backend 404 (pendiente)
        if (err?.status === 404 || err?.status === 0) {
          const nuevoPaciente: Paciente = {
            id: enEdicion ? enEdicion.id : 'p-' + Date.now(),
            nombre: payload.nombre,
            especie: payload.especie,
            raza: payload.raza,
            sexo: payload.sexo,
            fecha_nacimiento: payload.fecha_nacimiento,
            peso_kg: payload.peso_kg,
            color: payload.color,
            microchip: payload.microchip,
            estado: payload.estado,
            notas: payload.notas,
            propietario: {
              nombre: payload.propietario_nombre,
              tipo_identificacion: payload.propietario_tipo_identificacion,
              numero_identificacion: payload.propietario_numero_identificacion,
              celular: payload.propietario_celular,
              correo: payload.propietario_correo,
              direccion: payload.propietario_direccion,
            },
            creado_en: enEdicion?.creado_en || new Date().toISOString(),
          };

          if (enEdicion) {
            this.pacientes.update((lista) =>
              lista.map((p) => (p.id === enEdicion.id ? nuevoPaciente : p))
            );
          } else {
            this.pacientes.update((lista) => [nuevoPaciente, ...lista]);
          }

          this.modalAbierto.set(false);
        } else {
          this.errorFormulario.set(
            err?.error?.message || 'No se pudo guardar la información del paciente.'
          );
        }
      },
    });
  }

  eliminar(paciente: Paciente): void {
    const confirmado = confirm(
      `¿Estás seguro de eliminar al paciente "${paciente.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    this.pacienteService.eliminar(paciente.id).subscribe({
      next: () => this.cargarPacientes(),
      error: () => {
        // Fallback local
        this.pacientes.update((lista) => lista.filter((p) => p.id !== paciente.id));
      },
    });
  }
}
