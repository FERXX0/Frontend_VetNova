import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpresaService } from '../../core/services/empresa.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { SuscripcionService } from '../../core/services/suscripcion.service';
import { Empresa, EmpresaOpcion, EmpresaPayload } from '../../core/models/empresa.model';
import { PeriodoSuscripcion, Plan, SuscripcionPayload } from '../../core/models/suscripcion.model';
import {
  calcularFechaFin,
  calcularMontoPeriodo,
  cicloFacturacionDe,
  fechaHoyIso,
  finDelDiaIso,
  inicioDelDiaIso,
} from '../../core/utils/periodo-suscripcion';

@Component({
  selector: 'app-configuracion-global',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracion-global.html',
  styleUrl: './configuracion-global.scss'
})
export class ConfiguracionGlobalComponent implements OnInit {

  private readonly empresaService = inject(EmpresaService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly suscripcionService = inject(SuscripcionService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly periodos: { valor: PeriodoSuscripcion; etiqueta: string }[] = [
    { valor: 'mensual', etiqueta: 'Mensual' },
    { valor: 'trimestral', etiqueta: 'Trimestral' },
    { valor: 'semestral', etiqueta: 'Semestral' },
    { valor: 'anual', etiqueta: 'Anual' },
  ];

  modalAltaAbierto = signal(false);
  modalPlanAbierto = signal(false);
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);
  mensaje = signal<string | null>(null);

  planes = signal<Plan[]>([]);
  cargandoPlanes = signal(false);

  empresas = signal<EmpresaOpcion[]>([]);
  cargandoEmpresas = signal(false);

  form: FormGroup;
  formPlan: FormGroup;

  constructor() {
    const hoy = fechaHoyIso();

    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      razon_social: ['', [Validators.maxLength(150)]],
      nit: ['', [Validators.pattern(/^\d{9}-\d$/)]],
      correo: ['', [Validators.email, Validators.maxLength(50)]],
      zona_horaria: ['America/Bogota', [Validators.required]],
      plan_id: ['', [Validators.required]],
      periodo: ['mensual', [Validators.required]],
      inicia_en: [hoy, [Validators.required]],
      finaliza_en: [calcularFechaFin(hoy, 'mensual'), [Validators.required]],
    });

    this.formPlan = this.fb.group({
      empresa_id: ['', [Validators.required]],
      plan_id: ['', [Validators.required]],
      periodo: ['mensual', [Validators.required]],
      inicia_en: [hoy, [Validators.required]],
      finaliza_en: [calcularFechaFin(hoy, 'mensual'), [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.cargarPlanes();
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

  private cargarEmpresas(): void {
    this.cargandoEmpresas.set(true);
    this.empresaService.listarOpciones().subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
        this.cargandoEmpresas.set(false);
      },
      error: () => this.cargandoEmpresas.set(false),
    });
  }

  // ---------------------------------------------------------
  // FECHAS Y MONTO DEL PLAN
  // ---------------------------------------------------------

  /** Recalcula la fecha de fin a partir del periodo y la fecha de inicio. */
  recalcularFin(grupo: FormGroup): void {
    const inicio = grupo.get('inicia_en')?.value as string;
    const periodo = grupo.get('periodo')?.value as PeriodoSuscripcion;

    if (!inicio || !periodo) {
      return;
    }

    grupo.patchValue({ finaliza_en: calcularFechaFin(inicio, periodo) });
  }

  resumenMonto(grupo: FormGroup): string {
    const plan = this.planes().find((p) => p.id === grupo.get('plan_id')?.value);

    if (!plan) {
      return 'Selecciona un plan';
    }

    const periodo = grupo.get('periodo')?.value as PeriodoSuscripcion;

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: plan.moneda || 'COP',
    }).format(calcularMontoPeriodo(plan, periodo));
  }

  private validarFechas(grupo: FormGroup): string | null {
    const { inicia_en, finaliza_en } = grupo.value;

    if (!inicia_en || !finaliza_en) {
      return 'Indica la fecha de inicio y la fecha de fin del plan.';
    }

    if (finaliza_en <= inicia_en) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio.';
    }

    return null;
  }

  private construirPayload(grupo: FormGroup): SuscripcionPayload | null {
    const valores = grupo.value;
    const plan = this.planes().find((p) => p.id === valores.plan_id);

    if (!plan) {
      return null;
    }

    const periodo = valores.periodo as PeriodoSuscripcion;

    return {
      plan_id: plan.id,
      estado: 'activa',
      periodo,
      ciclo_facturacion: cicloFacturacionDe(periodo),
      monto: calcularMontoPeriodo(plan, periodo),
      moneda: plan.moneda,
      inicia_en: inicioDelDiaIso(valores.inicia_en),
      finaliza_en: finDelDiaIso(valores.finaliza_en),
    };
  }

  private extraerError(err: any, porDefecto: string): string {
    const errores = err?.error?.errors;

    if (errores) {
      const primero = Object.values(errores)[0] as string[] | undefined;

      if (primero?.length) {
        return primero[0];
      }
    }

    return err?.error?.message ?? porDefecto;
  }

  private mostrarMensaje(texto: string): void {
    this.mensaje.set(texto);
    setTimeout(() => this.mensaje.set(null), 4000);
  }

  // ---------------------------------------------------------
  // ALTA DE EMPRESA CON PLAN
  // ---------------------------------------------------------

  abrirModalAlta(): void {
    const hoy = fechaHoyIso();

    this.errorFormulario.set(null);
    this.form.reset({
      nombre: '',
      razon_social: '',
      nit: '',
      correo: '',
      zona_horaria: 'America/Bogota',
      plan_id: '',
      periodo: 'mensual',
      inicia_en: hoy,
      finaliza_en: calcularFechaFin(hoy, 'mensual'),
    });
    this.modalAltaAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAltaAbierto.set(false);
    this.errorFormulario.set(null);
  }

  formatearNit(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '').slice(0, 10);
    const valor = digitos.length > 9
      ? `${digitos.slice(0, 9)}-${digitos.slice(9)}`
      : digitos;

    input.value = valor;
    this.form.get('nit')?.setValue(valor, { emitEvent: false });
  }

  guardar(): void {
    this.errorFormulario.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const errorFechas = this.validarFechas(this.form);

    if (errorFechas) {
      this.errorFormulario.set(errorFechas);
      return;
    }

    this.guardando.set(true);

    const valores = this.form.value;
    const empresaPayload: EmpresaPayload = {
      nombre: valores.nombre,
      razon_social: valores.razon_social || null,
      nit: valores.nit || null,
      correo: valores.correo || null,
      zona_horaria: valores.zona_horaria,
      estado: 'activa',
    };

    this.empresaService.crear(empresaPayload).subscribe({
      next: (empresa) => this.asignarPlanAlta(empresa),
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(
          this.extraerError(err, 'No se pudo registrar la empresa. Revisa los datos.')
        );
      },
    });
  }

  private asignarPlanAlta(empresa: Empresa): void {
    const payload = this.construirPayload(this.form);

    if (!payload) {
      this.guardando.set(false);
      this.errorFormulario.set('Selecciona un plan válido.');
      return;
    }

    this.suscripcionService.crear(empresa.id, payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAltaAbierto.set(false);
        this.router.navigate(['/super-usuario/usuarios'], {
          queryParams: { empresaId: empresa.id, nuevoUsuario: 1 },
        });
      },
      error: (err) => {
        this.guardando.set(false);
        this.modalAltaAbierto.set(false);
        this.empresas.update((lista) => [
          ...lista,
          { id: empresa.id, nombre: empresa.nombre, estado: empresa.estado },
        ]);
        this.abrirModalPlan(empresa.id);
        this.errorFormulario.set(
          this.extraerError(
            err,
            'La empresa se registró, pero no se pudo asignar el plan. Inténtalo de nuevo.'
          )
        );
      },
    });
  }

  // ---------------------------------------------------------
  // ASIGNAR O CAMBIAR EL PLAN DE UNA EMPRESA EXISTENTE
  // ---------------------------------------------------------

  abrirModalPlan(empresaId = ''): void {
    const hoy = fechaHoyIso();

    this.errorFormulario.set(null);
    this.formPlan.reset({
      empresa_id: empresaId,
      plan_id: '',
      periodo: 'mensual',
      inicia_en: hoy,
      finaliza_en: calcularFechaFin(hoy, 'mensual'),
    });
    this.cargarEmpresas();
    this.modalPlanAbierto.set(true);
  }

  cerrarModalPlan(): void {
    this.modalPlanAbierto.set(false);
    this.errorFormulario.set(null);
  }

  guardarPlan(): void {
    this.errorFormulario.set(null);

    if (this.formPlan.invalid) {
      this.formPlan.markAllAsTouched();
      return;
    }

    const errorFechas = this.validarFechas(this.formPlan);

    if (errorFechas) {
      this.errorFormulario.set(errorFechas);
      return;
    }

    const payload = this.construirPayload(this.formPlan);

    if (!payload) {
      this.errorFormulario.set('Selecciona un plan válido.');
      return;
    }

    this.guardando.set(true);

    this.suscripcionService.crear(this.formPlan.value.empresa_id, payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalPlanAbierto.set(false);
        this.mostrarMensaje('Plan asignado correctamente. Las suscripciones anteriores quedaron canceladas.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(
          this.extraerError(err, 'No se pudo asignar el plan. Revisa los datos.')
        );
      },
    });
  }
}