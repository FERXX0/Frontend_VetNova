import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicioService } from '../../core/services/servicio.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import { Servicio, ServicioPayload } from '../../core/models/servicio.model';
import { TipoConsulta } from '../../core/models/cita.model';
import { AlcanceApi } from '../../core/utils/alcance-api';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.scss',
})
export class ServiciosComponent implements OnInit {
  private readonly servicioService = inject(ServicioService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly empresaService = inject(EmpresaService);

  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  empresasDisponibles = signal<EmpresaOpcion[]>([]);
  empresaSeleccionada = signal<string>('');

  servicios = signal<Servicio[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  filtroTexto = signal('');
  filtroTipo = signal<TipoConsulta | 'todos'>('todos');
  filtroEstado = signal<'todos' | 'activos' | 'inactivos'>('todos');

  readonly tiposConsulta: { valor: TipoConsulta; etiqueta: string }[] = [
    { valor: 'general', etiqueta: 'Consulta general' },
    { valor: 'vacunacion', etiqueta: 'Vacunación' },
    { valor: 'desparasitacion', etiqueta: 'Desparasitación' },
    { valor: 'cirugia', etiqueta: 'Cirugía' },
    { valor: 'urgencia', etiqueta: 'Urgencia' },
    { valor: 'control', etiqueta: 'Control' },
    { valor: 'estetica', etiqueta: 'Estética' },
  ];

  readonly estados = [
    { valor: 'todos', etiqueta: 'Todos los estados' },
    { valor: 'activos', etiqueta: 'Activos' },
    { valor: 'inactivos', etiqueta: 'Inactivos' },
  ];

  alcance = computed<AlcanceApi | undefined>(() => {
    return this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: this.empresaSeleccionada() || null }
      : undefined;
  });

  serviciosFiltrados = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const tipo = this.filtroTipo();
    const estado = this.filtroEstado();
    const lista = this.servicios();

    return lista.filter((s) => {
      const coincideTexto =
        !texto ||
        s.nombre.toLowerCase().includes(texto) ||
        (s.descripcion && s.descripcion.toLowerCase().includes(texto));

      const coincideTipo = tipo === 'todos' || s.tipo_consulta === tipo;

      const coincideEstado =
        estado === 'todos' ||
        (estado === 'activos' && s.activo) ||
        (estado === 'inactivos' && !s.activo);

      return coincideTexto && coincideTipo && coincideEstado;
    });
  });

  modalAbierto = signal(false);
  servicioEnEdicion = signal<Servicio | null>(null);
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(255)]],
      tipo_consulta: ['general', [Validators.required]],
      duracion_minutos: [30, [Validators.required, Validators.min(5), Validators.max(480)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      activo: [true, [Validators.required]],
    });
  }

  ngOnInit(): void {
    if (this.esVistaSuperUsuario()) {
      this.empresaService.listarOpciones().subscribe({
        next: (res) => this.empresasDisponibles.set(res || []),
        error: () => {},
      });
    } else {
      this.cargarServicios();
    }
  }

  onEmpresaChange(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.empresaSeleccionada.set(valor);
    this.error.set(null);
    this.cargarServicios();
  }

  cargarServicios(): void {
    if (this.esVistaSuperUsuario() && !this.empresaSeleccionada()) {
      this.servicios.set([]);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.servicioService.listar(false, this.alcance()).subscribe({
      next: (res) => {
        this.servicios.set(res || []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(
          err?.error?.message || 'No se pudo cargar el catálogo de servicios.'
        );
      },
    });
  }

  formatearPrecio(valor: number | string): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(valor));
  }

  obtenerEtiquetaTipo(tipo: TipoConsulta): string {
    return this.tiposConsulta.find((t) => t.valor === tipo)?.etiqueta || tipo;
  }

  abrirModalCrear(): void {
    if (this.esVistaSuperUsuario() && !this.empresaSeleccionada()) {
      return;
    }
    this.servicioEnEdicion.set(null);
    this.errorFormulario.set(null);
    this.form.reset({
      nombre: '',
      descripcion: '',
      tipo_consulta: 'general',
      duracion_minutos: 30,
      precio: 0,
      activo: true,
    });
    this.modalAbierto.set(true);
  }

  abrirModalEditar(servicio: Servicio): void {
    this.servicioEnEdicion.set(servicio);
    this.errorFormulario.set(null);
    this.form.reset({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      tipo_consulta: servicio.tipo_consulta,
      duracion_minutos: servicio.duracion_minutos,
      precio: Number(servicio.precio),
      activo: servicio.activo,
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
    const val = this.form.value;
    const payload: ServicioPayload = {
      nombre: val.nombre,
      descripcion: val.descripcion || null,
      tipo_consulta: val.tipo_consulta,
      duracion_minutos: Number(val.duracion_minutos),
      precio: Number(val.precio),
      activo: val.activo,
    };

    const enEdicion = this.servicioEnEdicion();
    const req$ = enEdicion
      ? this.servicioService.actualizar(enEdicion.id, payload, this.alcance())
      : this.servicioService.crear(payload, this.alcance());

    req$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargarServicios();
      },
      error: (err) => {
        this.guardando.set(false);
        let msg = err?.error?.message;
        if (err?.error?.errors && typeof err.error.errors === 'object') {
          const primerCampo = Object.keys(err.error.errors)[0];
          if (primerCampo && err.error.errors[primerCampo]?.length > 0) {
            msg = err.error.errors[primerCampo][0];
          }
        }
        this.errorFormulario.set(msg || 'No se pudo guardar el servicio. Intenta de nuevo.');
      },
    });
  }

  eliminar(servicio: Servicio): void {
    const confirmado = confirm(
      `¿Estás seguro de eliminar el servicio "${servicio.nombre}"? Las citas ya registradas conservarán su información, pero quedarán sin servicio asociado.`
    );
    if (!confirmado) return;

    this.servicioService.eliminar(servicio.id, this.alcance()).subscribe({
      next: () => this.cargarServicios(),
      error: (err) => {
        this.error.set(
          err?.error?.message || 'No se pudo eliminar el servicio. Intenta de nuevo.'
        );
      },
    });
  }
}
