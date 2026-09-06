import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresaService } from '../../../core/services/empresa.service';
import { SuscripcionService } from '../../../core/services/suscripcion.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { CitaService } from '../../../core/services/cita.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { Empresa, EmpresaPayload, EstadoEmpresa } from '../../../core/models/empresa.model';
import { Suscripcion, SuscripcionPayload, Plan, EstadoSuscripcion, PeriodoSuscripcion } from '../../../core/models/suscripcion.model';
import { Cita, CitaPayload, EstadoCita, TipoConsulta } from '../../../core/models/cita.model';
import { Paciente, PacientePayload, EstadoPaciente } from '../../../core/models/paciente.model';
import { Modulo } from '../../../core/models/auth.model';

export type TabEmpresa = 'resumen' | 'modulos' | 'usuarios' | 'suscripciones' | 'citas' | 'pacientes';

export interface UsuarioEmpresaTenant {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  creado_en?: string;
}

@Component({
  selector: 'app-empresa-detalle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './empresa-detalle.html',
  styleUrl: './empresa-detalle.scss',
})
export class EmpresaDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly empresaService = inject(EmpresaService);
  private readonly suscripcionService = inject(SuscripcionService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly citaService = inject(CitaService);
  private readonly pacienteService = inject(PacienteService);
  private readonly fb = inject(FormBuilder);

  empresaId = signal('');
  empresa = signal<Empresa | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  tabActiva = signal<TabEmpresa>('resumen');

  // ---------- Catálogo y Aprovisionamiento de Módulos del Tenant ----------
  todosModulos = signal<Modulo[]>([
    { id: '1', codigo: 'citas', nombre: 'Agenda Médica y Citas', orden: 1, activo: true },
    { id: '2', codigo: 'clientes_pacientes', nombre: 'Pacientes y Clientes', orden: 2, activo: true },
    { id: '3', codigo: 'historias_clinicas', nombre: 'Historias Clínicas', orden: 3, activo: true },
    { id: '4', codigo: 'facturacion', nombre: 'Facturación y Cobros', orden: 4, activo: true },
    { id: '5', codigo: 'farmacia', nombre: 'Inventario / Farmacia', orden: 5, activo: true },
    { id: '6', codigo: 'usuarios', nombre: 'Gestión de Colaboradores', orden: 6, activo: true },
    { id: '7', codigo: 'reportes', nombre: 'Reportes y Métricas', orden: 7, activo: true },
  ]);

  // Módulos aprovisionados específicamente para esta empresa
  modulosHabilitados = signal<string[]>(['citas', 'clientes_pacientes', 'usuarios', 'reportes']);

  tieneModuloCitas = computed(() => this.modulosHabilitados().includes('citas'));
  tieneModuloPacientes = computed(() => this.modulosHabilitados().includes('clientes_pacientes'));

  // ---------- Usuarios de esta Empresa / Tenant ----------
  usuariosTenant = signal<UsuarioEmpresaTenant[]>([]);
  modalUsuarioTenantAbierto = signal(false);
  usuarioTenantEnEdicion = signal<UsuarioEmpresaTenant | null>(null);
  guardandoUsuarioTenant = signal(false);
  formUsuarioTenant: FormGroup;

  rolesDisponiblesTenant = ['Administrador', 'Veterinario', 'Cajero', 'Recepcionista', 'Auxiliar'];

  // ---------- Suscripciones ----------
  suscripciones = signal<Suscripcion[]>([]);
  planes = signal<Plan[]>([]);
  modalSuscripcionAbierto = signal(false);
  guardandoSuscripcion = signal(false);
  formSuscripcion: FormGroup;

  // ---------- Citas / Agenda de esta empresa ----------
  fechaCitas = signal(this.formatoFechaIso(new Date()));
  citas = signal<Cita[]>([]);
  cargandoCitas = signal(false);
  modalCitaAbierto = signal(false);
  guardandoCita = signal(false);
  formCita: FormGroup;

  // ---------- Pacientes de esta empresa ----------
  pacientes = signal<Paciente[]>([]);
  cargandoPacientes = signal(false);
  filtroEspeciePaciente = signal('todas');
  filtroTextoPaciente = signal('');
  modalPacienteAbierto = signal(false);
  guardandoPaciente = signal(false);
  formPaciente: FormGroup;

  // ---------- Modal Edición Datos Empresa ----------
  modalEditarEmpresaAbierto = signal(false);
  guardandoEmpresa = signal(false);
  formEmpresa: FormGroup;

  estadosEmpresa: { valor: EstadoEmpresa; etiqueta: string }[] = [
    { valor: 'activa', etiqueta: 'Activa' },
    { valor: 'inactiva', etiqueta: 'Inactiva' },
    { valor: 'suspendida', etiqueta: 'Suspendida' },
  ];

  constructor() {
    this.formEmpresa = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      razon_social: ['', [Validators.maxLength(150)]],
      nit: ['', [Validators.maxLength(50)]],
      correo: ['', [Validators.email, Validators.maxLength(50)]],
      zona_horaria: ['America/Bogota', [Validators.required]],
      estado: ['activa', [Validators.required]],
    });

    this.formUsuarioTenant = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      rol: ['Veterinario', [Validators.required]],
      activo: [true, [Validators.required]],
      contrasena: [''],
    });

    this.formSuscripcion = this.fb.group({
      plan_id: ['', Validators.required],
      estado: ['activa', Validators.required],
      periodo: ['mensual', Validators.required],
      monto: [0, [Validators.required, Validators.min(0)]],
      moneda: ['COP', Validators.required],
      inicia_en: [new Date().toISOString().slice(0, 16), Validators.required],
      finaliza_en: [''],
    });

    this.formCita = this.fb.group({
      paciente_id: ['', Validators.required],
      fecha: [this.formatoFechaIso(new Date()), Validators.required],
      hora_inicio: ['09:00', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(255)]],
      tipo_consulta: ['general', Validators.required],
      observaciones: [''],
    });

    this.formPaciente = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      especie: ['Canino', Validators.required],
      raza: [''],
      sexo: ['macho', Validators.required],
      fecha_nacimiento: [''],
      peso_kg: [null],
      propietario: this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(150)]],
        celular: ['', [Validators.required, Validators.maxLength(30)]],
        correo: ['', [Validators.email]],
      }),
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('empresaId') ?? '';
    this.empresaId.set(id);
    this.cargarDatosEmpresa();
    this.cargarCatalogos();
  }

  cargarDatosEmpresa(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.empresaService.listar().subscribe({
      next: (res) => {
        const encontrada = (res.data || []).find((e) => e.id === this.empresaId());
        if (encontrada) {
          this.empresa.set(encontrada);
        } else {
          this.empresa.set({
            id: this.empresaId(),
            nombre: 'Veterinaria / Empresa Registrada',
            razon_social: 'Empresa Multitenant S.A.S.',
            nit: '900.123.456-7',
            correo: 'contacto@empresa.com',
            zona_horaria: 'America/Bogota',
            estado: 'activa',
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString(),
          });
        }
        this.cargando.set(false);
        this.cargarSuscripciones();
        this.cargarUsuariosTenant();
        this.cargarCitas();
        this.cargarPacientes();
      },
      error: () => {
        this.cargando.set(false);
        this.empresa.set({
          id: this.empresaId(),
          nombre: 'Veterinaria / Empresa Registrada',
          razon_social: 'Empresa Multitenant S.A.S.',
          nit: '900.123.456-7',
          correo: 'contacto@empresa.com',
          zona_horaria: 'America/Bogota',
          estado: 'activa',
          creado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString(),
        });
        this.cargarUsuariosTenant();
      },
    });
  }

  cargarUsuariosTenant(): void {
    const emp = this.empresa();
    const dominio = emp?.correo ? emp.correo.split('@')[1] : 'veterinaria.com';
    // Usuarios iniciales del tenant
    this.usuariosTenant.set([
      {
        id: 'u-1',
        nombre: 'Dra. Camila Morales',
        correo: `cmorales@${dominio}`,
        rol: 'Administrador',
        activo: true,
        creado_en: '2026-01-15',
      },
      {
        id: 'u-2',
        nombre: 'Dr. Alejandro Ruiz',
        correo: `aruiz@${dominio}`,
        rol: 'Veterinario',
        activo: true,
        creado_en: '2026-02-01',
      },
      {
        id: 'u-3',
        nombre: 'Valeria Castro',
        correo: `recepcion@${dominio}`,
        rol: 'Recepcionista',
        activo: true,
        creado_en: '2026-02-10',
      },
    ]);
  }

  cargarCatalogos(): void {
    this.catalogoService.planes().subscribe({
      next: (planes) => this.planes.set(planes),
      error: () => {},
    });

    this.catalogoService.modulos().subscribe({
      next: (mods) => {
        if (mods && mods.length > 0) {
          this.todosModulos.set(mods);
        }
      },
      error: () => {},
    });
  }

  cargarSuscripciones(): void {
    this.suscripcionService.listarPorEmpresa(this.empresaId()).subscribe({
      next: (res) => this.suscripciones.set(res.data || []),
      error: () => {},
    });
  }

  cargarCitas(): void {
    this.cargandoCitas.set(true);
    this.citaService.listarPorFecha(this.fechaCitas()).subscribe({
      next: (lista) => {
        this.citas.set(lista || []);
        this.cargandoCitas.set(false);
      },
      error: () => this.cargandoCitas.set(false),
    });
  }

  cargarPacientes(): void {
    this.cargandoPacientes.set(true);
    this.pacienteService.listar().subscribe({
      next: (res: any) => {
        const lista = res?.data || (Array.isArray(res) ? res : []);
        this.pacientes.set(lista);
        this.cargandoPacientes.set(false);
      },
      error: () => this.cargandoPacientes.set(false),
    });
  }

  // ---------- Aprovisionamiento de módulos ----------
  toggleModulo(codigo: string): void {
    this.modulosHabilitados.update((actuales) => {
      if (actuales.includes(codigo)) {
        return actuales.filter((c) => c !== codigo);
      } else {
        return [...actuales, codigo];
      }
    });
  }

  moduloEstaHabilitado(codigo: string): boolean {
    return this.modulosHabilitados().includes(codigo);
  }

  // ---------- Gestión de Usuarios del Tenant ----------
  abrirModalCrearUsuarioTenant(): void {
    this.usuarioTenantEnEdicion.set(null);
    const emp = this.empresa();
    const dominio = emp?.correo ? emp.correo.split('@')[1] : 'empresa.com';
    this.formUsuarioTenant.reset({
      nombre: '',
      correo: `@${dominio}`,
      rol: 'Veterinario',
      activo: true,
      contrasena: 'VetNova2026*',
    });
    this.modalUsuarioTenantAbierto.set(true);
  }

  abrirModalEditarUsuarioTenant(usuario: UsuarioEmpresaTenant): void {
    this.usuarioTenantEnEdicion.set(usuario);
    this.formUsuarioTenant.reset({
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      activo: usuario.activo,
      contrasena: '',
    });
    this.modalUsuarioTenantAbierto.set(true);
  }

  cerrarModalUsuarioTenant(): void {
    this.modalUsuarioTenantAbierto.set(false);
  }

  guardarUsuarioTenant(): void {
    if (this.formUsuarioTenant.invalid) {
      this.formUsuarioTenant.markAllAsTouched();
      return;
    }
    this.guardandoUsuarioTenant.set(true);
    const val = this.formUsuarioTenant.value;
    const enEdicion = this.usuarioTenantEnEdicion();

    setTimeout(() => {
      if (enEdicion) {
        this.usuariosTenant.update((lista) =>
          lista.map((u) => (u.id === enEdicion.id ? { ...u, nombre: val.nombre, correo: val.correo, rol: val.rol, activo: val.activo } : u))
        );
      } else {
        const nuevo: UsuarioEmpresaTenant = {
          id: `u-${Date.now()}`,
          nombre: val.nombre,
          correo: val.correo,
          rol: val.rol,
          activo: val.activo,
          creado_en: this.formatoFechaIso(new Date()),
        };
        this.usuariosTenant.update((lista) => [nuevo, ...lista]);
      }
      this.guardandoUsuarioTenant.set(false);
      this.modalUsuarioTenantAbierto.set(false);
    }, 250);
  }

  toggleEstadoUsuarioTenant(usuario: UsuarioEmpresaTenant): void {
    this.usuariosTenant.update((lista) =>
      lista.map((u) => (u.id === usuario.id ? { ...u, activo: !u.activo } : u))
    );
  }

  // ---------- Modal Edición Empresa ----------
  abrirModalEditarEmpresa(): void {
    const emp = this.empresa();
    if (!emp) return;
    this.formEmpresa.reset({
      nombre: emp.nombre,
      razon_social: emp.razon_social ?? '',
      nit: emp.nit ?? '',
      correo: emp.correo ?? '',
      zona_horaria: emp.zona_horaria,
      estado: emp.estado,
    });
    this.modalEditarEmpresaAbierto.set(true);
  }

  cerrarModalEditarEmpresa(): void {
    this.modalEditarEmpresaAbierto.set(false);
  }

  guardarEdicionEmpresa(): void {
    if (this.formEmpresa.invalid) {
      this.formEmpresa.markAllAsTouched();
      return;
    }
    this.guardandoEmpresa.set(true);
    const payload: EmpresaPayload = this.formEmpresa.value;

    this.empresaService.actualizar(this.empresaId(), payload).subscribe({
      next: (actualizada) => {
        this.empresa.set(actualizada);
        this.guardandoEmpresa.set(false);
        this.modalEditarEmpresaAbierto.set(false);
      },
      error: () => {
        const emp = this.empresa();
        if (emp) {
          this.empresa.set({ ...emp, ...payload });
        }
        this.guardandoEmpresa.set(false);
        this.modalEditarEmpresaAbierto.set(false);
      },
    });
  }

  // ---------- Suscripciones ----------
  abrirModalSuscripcion(): void {
    this.formSuscripcion.reset({
      plan_id: '',
      estado: 'activa',
      periodo: 'mensual',
      monto: 0,
      moneda: 'COP',
      inicia_en: new Date().toISOString().slice(0, 16),
      finaliza_en: '',
    });
    this.modalSuscripcionAbierto.set(true);
  }

  cerrarModalSuscripcion(): void {
    this.modalSuscripcionAbierto.set(false);
  }

  onPlanSuscripcionCambiado(): void {
    const planId = this.formSuscripcion.get('plan_id')?.value;
    const plan = this.planes().find((p) => p.id === planId);
    if (!plan) return;

    this.formSuscripcion.patchValue({
      moneda: plan.moneda,
      monto: Number(plan.precio_mensual || 0),
    });
  }

  guardarSuscripcion(): void {
    if (this.formSuscripcion.invalid) {
      this.formSuscripcion.markAllAsTouched();
      return;
    }
    this.guardandoSuscripcion.set(true);
    const payload: SuscripcionPayload = this.formSuscripcion.value;

    this.suscripcionService.crear(this.empresaId(), payload).subscribe({
      next: (nueva) => {
        this.suscripciones.update((lista) => [nueva, ...lista]);
        this.guardandoSuscripcion.set(false);
        this.modalSuscripcionAbierto.set(false);
      },
      error: () => {
        this.guardandoSuscripcion.set(false);
        this.modalSuscripcionAbierto.set(false);
      },
    });
  }

  // ---------- Citas ----------
  cambiarFechaCitas(offsetDias: number): void {
    const actual = new Date(this.fechaCitas() + 'T00:00:00');
    actual.setDate(actual.getDate() + offsetDias);
    this.fechaCitas.set(this.formatoFechaIso(actual));
    this.cargarCitas();
  }

  abrirModalCita(): void {
    const pac = this.pacientes()[0];
    this.formCita.reset({
      paciente_id: pac?.id ?? '',
      fecha: this.fechaCitas(),
      hora_inicio: '10:00',
      motivo: '',
      tipo_consulta: 'general',
      observaciones: '',
    });
    this.modalCitaAbierto.set(true);
  }

  guardarCita(): void {
    if (this.formCita.invalid) {
      this.formCita.markAllAsTouched();
      return;
    }
    this.guardandoCita.set(true);
    const val = this.formCita.value;
    const pac = this.pacientes().find((p) => p.id === val.paciente_id);

    const payload: CitaPayload = {
      paciente_id: val.paciente_id,
      paciente_nombre: pac?.nombre ?? 'Paciente',
      propietario_nombre: pac?.propietario?.nombre ?? '',
      propietario_celular: pac?.propietario?.celular ?? '',
      veterinario_nombre: 'Veterinario de Sede',
      fecha: val.fecha,
      hora_inicio: val.hora_inicio,
      motivo: val.motivo,
      tipo_consulta: val.tipo_consulta,
      estado: 'confirmada',
      observaciones: val.observaciones,
    };

    this.citaService.crear(payload).subscribe({
      next: (nueva) => {
        this.citas.update((lista) => [...lista, nueva]);
        this.guardandoCita.set(false);
        this.modalCitaAbierto.set(false);
      },
      error: () => {
        this.guardandoCita.set(false);
        this.modalCitaAbierto.set(false);
      },
    });
  }

  // ---------- Pacientes ----------
  pacientesFiltrados = computed(() => {
    const especie = this.filtroEspeciePaciente();
    const texto = this.filtroTextoPaciente().toLowerCase().trim();
    let lista = this.pacientes();

    if (especie !== 'todas') {
      lista = lista.filter((p) => p.especie.toLowerCase() === especie.toLowerCase());
    }

    if (texto) {
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(texto) ||
          p.propietario.nombre.toLowerCase().includes(texto) ||
          (p.propietario.celular && p.propietario.celular.includes(texto))
      );
    }
    return lista;
  });

  abrirModalPaciente(): void {
    this.formPaciente.reset({
      nombre: '',
      especie: 'Canino',
      raza: '',
      sexo: 'macho',
      fecha_nacimiento: '',
      peso_kg: null,
      propietario: {
        nombre: '',
        celular: '',
        correo: '',
      },
    });
    this.modalPacienteAbierto.set(true);
  }

  guardarPaciente(): void {
    if (this.formPaciente.invalid) {
      this.formPaciente.markAllAsTouched();
      return;
    }
    this.guardandoPaciente.set(true);
    const payload: PacientePayload = this.formPaciente.value;

    this.pacienteService.crear(payload).subscribe({
      next: (nuevo) => {
        this.pacientes.update((lista) => [nuevo, ...lista]);
        this.guardandoPaciente.set(false);
        this.modalPacienteAbierto.set(false);
      },
      error: () => {
        this.guardandoPaciente.set(false);
        this.modalPacienteAbierto.set(false);
      },
    });
  }

  private formatoFechaIso(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatearMoneda(monto: string | number, moneda: string): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda || 'COP',
    }).format(Number(monto));
  }
}
