import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa, EmpresaPayload, EstadoEmpresa } from '../../core/models/empresa.model';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './empresas.html',
  styleUrl: './empresas.scss',
})
export class EmpresasComponent implements OnInit {
  empresas = signal<Empresa[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  // Filtro por estado (todo el listado se trae de una vez; Laravel pagina server-side,
  // pero el filtro por estado aquí es client-side sobre la página actual)
  filtroEstado = signal<EstadoEmpresa | 'todas'>('todas');

  empresasFiltradas = computed(() => {
    const filtro = this.filtroEstado();
    const lista = this.empresas();
    return filtro === 'todas' ? lista : lista.filter((e) => e.estado === filtro);
  });

  // ---------- Modal crear/editar ----------
  modalAbierto = signal(false);
  empresaEnEdicion = signal<Empresa | null>(null);
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);

  form: FormGroup;

  estados: { valor: EstadoEmpresa; etiqueta: string }[] = [
    { valor: 'activa', etiqueta: 'Activa' },
    { valor: 'inactiva', etiqueta: 'Inactiva' },
    { valor: 'suspendida', etiqueta: 'Suspendida' },
  ];

  constructor(
    private empresaService: EmpresaService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      razon_social: ['', [Validators.maxLength(150)]],
      nit: ['', [Validators.maxLength(50)]],
      correo: ['', [Validators.email, Validators.maxLength(50)]],
      zona_horaria: ['America/Bogota', [Validators.required]],
      estado: ['activa', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  cargarEmpresas(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.empresaService.listar().subscribe({
      next: (respuesta) => {
        this.empresas.set(respuesta.data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las veterinarias. Verifica tu conexión con el backend.');
        this.cargando.set(false);
      },
    });
  }

  abrirModalCrear(): void {
    this.empresaEnEdicion.set(null);
    this.errorFormulario.set(null);
    this.form.reset({
      nombre: '',
      razon_social: '',
      nit: '',
      correo: '',
      zona_horaria: 'America/Bogota',
      estado: 'activa',
    });
    this.modalAbierto.set(true);
  }

  abrirModalEditar(empresa: Empresa): void {
    this.empresaEnEdicion.set(empresa);
    this.errorFormulario.set(null);
    this.form.reset({
      nombre: empresa.nombre,
      razon_social: empresa.razon_social ?? '',
      nit: empresa.nit ?? '',
      correo: empresa.correo ?? '',
      zona_horaria: empresa.zona_horaria,
      estado: empresa.estado,
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
    const payload: EmpresaPayload = this.form.value;
    const enEdicion = this.empresaEnEdicion();

    const request$ = enEdicion
      ? this.empresaService.actualizar(enEdicion.id, payload)
      : this.empresaService.crear(payload);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargarEmpresas();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(
          err?.error?.message ?? 'No se pudo guardar la veterinaria. Revisa los datos.'
        );
      },
    });
  }

  eliminar(empresa: Empresa): void {
    const confirmado = confirm(`¿Eliminar la veterinaria "${empresa.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    this.empresaService.eliminar(empresa.id).subscribe({
      next: () => this.cargarEmpresas(),
      error: () => this.error.set('No se pudo eliminar la veterinaria.'),
    });
  }
}