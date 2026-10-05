import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpresaService } from '../../core/services/empresa.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { SuscripcionService } from '../../core/services/suscripcion.service';
import { EmpresaPayload } from '../../core/models/empresa.model';
import { Plan, SuscripcionPayload } from '../../core/models/suscripcion.model';

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

  modalAltaAbierto = signal(false);
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);

  planes = signal<Plan[]>([]);
  cargandoPlanes = signal(false);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      razon_social: ['', [Validators.maxLength(150)]],
      nit: ['', [Validators.pattern(/^\d{9}-\d$/)]],
      correo: ['', [Validators.email, Validators.maxLength(50)]],
      zona_horaria: ['America/Bogota', [Validators.required]],
      plan_id: ['', [Validators.required]],
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

  abrirModalAlta(): void {
    this.errorFormulario.set(null);
    this.form.reset({
      nombre: '',
      razon_social: '',
      nit: '',
      correo: '',
      zona_horaria: 'America/Bogota',
      plan_id: '',
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
      next: (empresa) => this.asignarPlan(empresa.id, valores.plan_id),
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(
          err?.error?.message ?? 'No se pudo registrar la empresa. Revisa los datos.'
        );
      },
    });
  }

  private asignarPlan(empresaId: string, planId: string): void {
    const plan = this.planes().find((p) => p.id === planId);

    const payload: SuscripcionPayload = {
      plan_id: planId,
      estado: 'activa',
      periodo: 'mensual',
      ciclo_facturacion: 'mensual',
      monto: plan ? Number(plan.precio_mensual) : 0,
      moneda: plan?.moneda ?? 'COP',
      inicia_en: new Date().toISOString().slice(0, 10),
    };

    this.suscripcionService.crear(empresaId, payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAltaAbierto.set(false);
        this.router.navigate(['/super-usuario/usuarios'], {
          queryParams: { empresaId, nuevoUsuario: 1 },
        });
      },
      error: () => {
        this.guardando.set(false);
        this.router.navigate(['/super-usuario/empresas', empresaId, 'suscripciones']);
      },
    });
  }
}