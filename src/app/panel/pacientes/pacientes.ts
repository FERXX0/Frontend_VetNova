import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa } from '../../core/models/empresa.model';
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
  private readonly router = inject(Router);
  private readonly empresaService = inject(EmpresaService);

  // Esta misma pantalla se usa en /super-usuario/pacientes y en /panel/pacientes.
  // El selector de Empresa SOLO aplica en la vista de Super Usuario.
  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  empresasDisponibles = signal<Empresa[]>([]);
  filtroEmpresa = signal<string>('todas');

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
      const empresa = this.filtroEmpresa();
      const coincideEmpresa = empresa === 'todas' || p.empresa_id === empresa;

      return coincideTexto && coincideEspecie && coincideEstado && coincideEmpresa;
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
      // Empresa (solo se valida/envía en la vista de Super Usuario)
      empresa_id: [''],

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
    if (this.esVistaSuperUsuario()) {
      this.empresaService.listar().subscribe({
        next: (respuesta) => this.empresasDisponibles.set(respuesta.data),
        error: () => {},
      });
    }
  }

  cargarPacientes(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.pacienteService.listar().subscribe({
      next: (res) => {
        this.pacientes.set(res.data || []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(
          err?.error?.message || 'No se pudo cargar el listado de pacientes. Verifica tu conexión con el servidor.'
        );
      },
    });
  }

  abrirModalCrear(): void {
    this.pacienteEnEdicion.set(null);
    this.errorFormulario.set(null);
    this.form.reset({
      empresa_id: '',
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
      empresa_id: paciente.empresa_id ?? '',
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

    if (this.esVistaSuperUsuario() && !this.form.value.empresa_id) {
      this.errorFormulario.set('Selecciona la empresa a la que pertenece el paciente.');
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
        this.errorFormulario.set(
          err?.error?.message || 'No se pudo guardar la información del paciente. Intenta de nuevo.'
        );
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
      error: (err) => {
        this.error.set(
          err?.error?.message || 'No se pudo eliminar el paciente. Intenta de nuevo.'
        );
      },
    });
  }
}