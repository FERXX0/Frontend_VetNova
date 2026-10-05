import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../../core/services/catalogo.service';
import { PlanService } from '../../core/services/plan.service';
import { Modulo } from '../../core/models/auth.model';
import { Plan, PlanPayload } from '../../core/models/suscripcion.model';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './planes.html',
  styleUrl: './planes.scss',
})
export class PlanesComponent implements OnInit {
  private readonly planService = inject(PlanService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly fb = inject(FormBuilder);

  planes = signal<Plan[]>([]);
  modulosCatalogo = signal<Modulo[]>([]);

  cargando = signal(false);
  error = signal<string | null>(null);
  mensaje = signal<string | null>(null);

  pagina = signal(1);
  ultimaPagina = signal(1);

  modalAbierto = signal(false);
  editandoId = signal<string | null>(null);
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);
  modulosSeleccionados = signal<string[]>([]);

  form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(80)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    precio_mensual: [0, [Validators.required, Validators.min(0)]],
    precio_anual: [null as number | null, [Validators.min(0)]],
    moneda: ['COP', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    maximo_usuarios: [null as number | null, [Validators.min(1)]],
    activo: [true],
  });

  ngOnInit(): void {
    this.catalogoService.modulos().subscribe({
      next: (modulos) => this.modulosCatalogo.set(modulos),
      error: () => this.error.set('No se pudo cargar el catálogo de módulos.'),
    });
    this.cargarPlanes();
  }

  // ---------------------------------------------------------
  // LISTADO
  // ---------------------------------------------------------

  cargarPlanes(pagina = this.pagina()): void {
    this.cargando.set(true);
    this.error.set(null);

    this.planService.listar(pagina).subscribe({
      next: (respuesta) => {
        this.planes.set(respuesta.data);
        this.pagina.set(respuesta.current_page);
        this.ultimaPagina.set(respuesta.last_page);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los planes.');
        this.cargando.set(false);
      },
    });
  }

  paginaAnterior(): void {
    if (this.pagina() > 1) this.cargarPlanes(this.pagina() - 1);
  }

  paginaSiguiente(): void {
    if (this.pagina() < this.ultimaPagina()) this.cargarPlanes(this.pagina() + 1);
  }

  formatearMoneda(valor: string | number | null, moneda: string): string {
    if (valor === null || valor === undefined || valor === '') return '—';
    return `${moneda} ${Number(valor).toLocaleString('es-CO')}`;
  }

  // ---------------------------------------------------------
  // MODAL
  // ---------------------------------------------------------

  abrirCrear(): void {
    this.editandoId.set(null);
    this.errorFormulario.set(null);
    this.form.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      precio_mensual: 0,
      precio_anual: null,
      moneda: 'COP',
      maximo_usuarios: null,
      activo: true,
    });
    this.modulosSeleccionados.set([]);
    this.modalAbierto.set(true);
  }

  abrirEditar(plan: Plan): void {
    this.editandoId.set(plan.id);
    this.errorFormulario.set(null);
    this.form.reset({
      codigo: plan.codigo,
      nombre: plan.nombre,
      descripcion: plan.descripcion ?? '',
      precio_mensual: Number(plan.precio_mensual),
      precio_anual: plan.precio_anual === null ? null : Number(plan.precio_anual),
      moneda: plan.moneda,
      maximo_usuarios: plan.maximo_usuarios,
      activo: plan.activo,
    });
    this.modulosSeleccionados.set((plan.modulos ?? []).map((m) => m.id));
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  // ---------------------------------------------------------
  // MÓDULOS DEL PLAN
  // ---------------------------------------------------------

  moduloSeleccionado(id: string): boolean {
    return this.modulosSeleccionados().includes(id);
  }

  toggleModulo(id: string): void {
    this.modulosSeleccionados.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  seleccionarTodos(): void {
    this.modulosSeleccionados.set(this.modulosCatalogo().map((m) => m.id));
  }

  quitarTodos(): void {
    this.modulosSeleccionados.set([]);
  }

  // ---------------------------------------------------------
  // GUARDAR / ELIMINAR
  // ---------------------------------------------------------

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    const payload: PlanPayload = {
      codigo: v.codigo.trim(),
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      precio_mensual: Number(v.precio_mensual),
      precio_anual: v.precio_anual ?? null,
      moneda: v.moneda.trim().toUpperCase(),
      maximo_usuarios: v.maximo_usuarios ?? null,
      activo: v.activo,
      modulos: this.modulosSeleccionados(),
    };

    const id = this.editandoId();
    const peticion = id
      ? this.planService.actualizar(id, payload)
      : this.planService.crear(payload);

    this.guardando.set(true);
    this.errorFormulario.set(null);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando.set(false);
        this.cerrarModal();
        this.mostrarMensaje(respuesta.message);
        this.cargarPlanes();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(this.extraerError(err, 'No se pudo guardar el plan.'));
      },
    });
  }

  eliminar(plan: Plan): void {
    if (!window.confirm(`¿Eliminar el plan "${plan.nombre}"?`)) return;

    this.planService.eliminar(plan.id).subscribe({
      next: (respuesta) => {
        this.mostrarMensaje(respuesta.message);
        // si era el único de la última página, retrocede una
        if (this.planes().length === 1 && this.pagina() > 1) {
          this.cargarPlanes(this.pagina() - 1);
        } else {
          this.cargarPlanes();
        }
      },
      error: (err) => {
        this.error.set(
          this.extraerError(err, 'No se pudo eliminar el plan. Puede tener suscripciones asociadas.')
        );
      },
    });
  }

  // ---------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------

  private extraerError(err: any, porDefecto: string): string {
    const errores = err?.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0] as string[] | undefined;
      if (primero?.length) return primero[0];
    }
    return err?.error?.message ?? porDefecto;
  }

  private mostrarMensaje(texto: string): void {
    this.mensaje.set(texto);
    setTimeout(() => this.mensaje.set(null), 3000);
  }
}