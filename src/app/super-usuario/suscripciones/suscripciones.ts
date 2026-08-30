import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SuscripcionService } from '../../core/services/suscripcion.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import {
  EstadoSuscripcion,
  Plan,
  PeriodoSuscripcion,
  Suscripcion,
  SuscripcionPayload,
} from '../../core/models/suscripcion.model';

@Component({
  selector: 'app-suscripciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './suscripciones.html',
  styleUrl: './suscripciones.scss',
})
export class SuscripcionesComponent implements OnInit {
  empresaId = '';

  suscripciones = signal<Suscripcion[]>([]);
  planes = signal<Plan[]>([]);
  cargando = signal(false);
  cargandoPlanes = signal(false);
  error = signal<string | null>(null);

  modalAbierto = signal(false);
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);

  form: FormGroup;

  estados: { valor: EstadoSuscripcion; etiqueta: string }[] = [
    { valor: 'prueba', etiqueta: 'Prueba' },
    { valor: 'activa', etiqueta: 'Activa' },
    { valor: 'vencida', etiqueta: 'Vencida' },
    { valor: 'en_mora', etiqueta: 'En mora' },
    { valor: 'cancelada', etiqueta: 'Cancelada' },
  ];

  periodos: { valor: PeriodoSuscripcion; etiqueta: string }[] = [
    { valor: 'mensual', etiqueta: 'Mensual' },
    { valor: 'trimestral', etiqueta: 'Trimestral' },
    { valor: 'semestral', etiqueta: 'Semestral' },
    { valor: 'anual', etiqueta: 'Anual' },
  ];

  constructor(
    private suscripcionService: SuscripcionService,
    private catalogoService: CatalogoService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      plan_id: ['', Validators.required],
      estado: ['prueba', Validators.required],
      periodo: ['mensual', Validators.required],
      monto: [0, [Validators.required, Validators.min(0)]],
      moneda: ['COP', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      inicia_en: ['', Validators.required],
      finaliza_en: [''],
      prueba_finaliza_en: [''],
    });
  }

  ngOnInit(): void {
    this.empresaId = this.route.snapshot.paramMap.get('empresaId') ?? '';
    this.cargarSuscripciones();
    this.cargarPlanes();
  }

  cargarSuscripciones(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.suscripcionService.listarPorEmpresa(this.empresaId).subscribe({
      next: (respuesta) => {
        this.suscripciones.set(respuesta.data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las suscripciones. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  cargarPlanes(): void {
    this.cargandoPlanes.set(true);

    this.catalogoService.planes().subscribe({
      next: (planes) => {
        this.planes.set(planes);
        this.cargandoPlanes.set(false);
      },
      error: () => this.cargandoPlanes.set(false),
    });
  }

  abrirModalCrear(): void {
    this.errorFormulario.set(null);
    this.form.reset({
      plan_id: '',
      estado: 'prueba',
      periodo: 'mensual',
      monto: 0,
      moneda: 'COP',
      inicia_en: '',
      finaliza_en: '',
      prueba_finaliza_en: '',
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.errorFormulario.set(null);
  }

  // Autocompleta monto y moneda según el plan/periodo elegido (el usuario puede corregirlo)
  onPlanOPeriodoCambiado(): void {
    const planId = this.form.get('plan_id')?.value;
    const plan = this.planes().find((p) => p.id === planId);
    if (!plan) return;

    this.form.patchValue({ moneda: plan.moneda });

    const periodo = this.form.get('periodo')?.value;
    if (periodo === 'mensual') {
      this.form.patchValue({ monto: Number(plan.precio_mensual) });
    } else if (periodo === 'anual' && plan.precio_anual) {
      this.form.patchValue({ monto: Number(plan.precio_anual) });
    }
  }

  guardar(): void {
    this.errorFormulario.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.value;
    const payload: SuscripcionPayload = {
      plan_id: valores.plan_id,
      estado: valores.estado,
      periodo: valores.periodo,
      monto: valores.monto,
      moneda: valores.moneda,
      inicia_en: valores.inicia_en,
    };

    if (valores.finaliza_en) payload.finaliza_en = valores.finaliza_en;
    if (valores.prueba_finaliza_en) payload.prueba_finaliza_en = valores.prueba_finaliza_en;

    this.guardando.set(true);

    this.suscripcionService.crear(this.empresaId, payload).subscribe({
      next: (nueva) => {
        this.suscripciones.update((lista) => [nueva, ...lista]);
        this.guardando.set(false);
        this.modalAbierto.set(false);
      },
      error: (err) => {
        this.guardando.set(false);
        if (err.status === 422 && err.error?.message) {
          this.errorFormulario.set(err.error.message);
        } else if (err.status === 409) {
          this.errorFormulario.set('Ya existe una suscripción activa para esta empresa.');
        } else {
          this.errorFormulario.set('No se pudo guardar la suscripción. Intenta de nuevo.');
        }
      },
    });
  }

  formatearMoneda(monto: string, moneda: string): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda || 'COP',
    }).format(Number(monto));
  }
}
