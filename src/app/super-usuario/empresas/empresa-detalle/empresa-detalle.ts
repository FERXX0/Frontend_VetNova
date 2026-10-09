import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresaService } from '../../../core/services/empresa.service';
import { SuscripcionService } from '../../../core/services/suscripcion.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { CitaService } from '../../../core/services/cita.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { ModuloEmpresaService, ModuloEmpresaRegistro } from '../../../core/services/modulo-empresa.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Empresa, EmpresaPayload, EstadoEmpresa } from '../../../core/models/empresa.model';
import { Suscripcion, SuscripcionPayload, Plan, EstadoSuscripcion, PeriodoSuscripcion } from '../../../core/models/suscripcion.model';
import { Cita, CitaPayload, EstadoCita, Profesional, TipoConsulta } from '../../../core/models/cita.model';
import { Paciente, PacientePayload, EstadoPaciente } from '../../../core/models/paciente.model';
import { Modulo } from '../../../core/models/auth.model';
import { AlcanceApi } from '../../../core/utils/alcance-api';

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
  private readonly moduloEmpresaService = inject(ModuloEmpresaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly fb = inject(FormBuilder);

  empresaId = signal('');
  alcance = computed<AlcanceApi>(() => ({ plataforma: true, empresaId: this.empresaId() }));
  empresa = signal<Empresa | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  tabActiva = signal<TabEmpresa>('resumen');

  // ---------- Catálogo y Aprovisionamiento de Módulos del Tenant ----------
  todosModulos = signal<Modulo[]>([]);

  // Módulos realmente aprovisionados para esta empresa (cargados del backend).
  modulosEmpresaRegistros = signal<ModuloEmpresaRegistro[]>([]);
  modulosPlan = signal<Modulo[]>([]);
  cargandoModulos = signal(false);
  guardandoModuloCodigo = signal<string | null>(null);

  modulosIncluidosPlan = computed(() =>
    new Set(this.modulosPlan().map((modulo) => modulo.codigo))
  );

  modulosAdicionalesActivos = computed(() =>
    new Set(
      this.modulosEmpresaRegistros()
        .filter((registro) => registro.activo)
        .map((registro) => registro.modulo?.codigo)
        .filter((codigo): codigo is string => !!codigo)
    )
  );

  modulosHabilitados = computed(() =>
    this.todosModulos()
      .filter((modulo) =>
        this.modulosIncluidosPlan().has(modulo.codigo) ||
        this.modulosAdicionalesActivos().has(modulo.codigo)
      )
      .map((modulo) => modulo.codigo)
  );

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
  profesionales = signal<Profesional[]>([]);
  errorCita = signal<string | null>(null);
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
  errorPaciente = signal<string | null>(null);
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
      ciclo_facturacion: ['mensual', Validators.required],
      monto: [0, [Validators.required, Validators.min(0)]],
      moneda: ['COP', Validators.required],
      inicia_en: [new Date().toISOString().slice(0, 16), Validators.required],
      finaliza_en: [''],
    });

    this.formCita = this.fb.group({
      paciente_id: ['', Validators.required],
      veterinario_id: ['', Validators.required],
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
      estado: ['activo', Validators.required],
      propietario_nombre: ['', [Validators.required, Validators.maxLength(150)]],
      propietario_celular: ['', [Validators.required, Validators.maxLength(30)]],
      propietario_correo: ['', [Validators.email]],
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

    this.empresaService.obtener(this.empresaId()).subscribe({
      next: (emp) => {
        this.empresa.set(emp);
        this.cargando.set(false);
        this.cargarSuscripciones();
        this.cargarUsuariosTenant();
        this.cargarCitas();
        this.cargarPacientes();
        this.cargarModulosEmpresa();
      },
      error: (err) => {
        this.cargando.set(false);
        this.empresa.set(null);
        this.error.set(err?.error?.message || 'No se pudo obtener la empresa.');
      },
    });
  }

  cargarModulosEmpresa(): void {
    this.cargandoModulos.set(true);
    this.moduloEmpresaService.listar(this.empresaId()).subscribe({
      next: (registros) => {
        this.modulosEmpresaRegistros.set(registros || []);
        this.cargandoModulos.set(false);
      },
      error: () => {
        this.modulosEmpresaRegistros.set([]);
        this.cargandoModulos.set(false);
      },
    });
  }

  cargarUsuariosTenant(): void {
    this.usuarioService.listarGlobal({ empresa_id: this.empresaId() }).subscribe({
      next: (respuesta) => {
        this.usuariosTenant.set(
          (respuesta.data || []).map((u) => ({
            id: u.id,
            nombre: u.nombre,
            correo: u.correo,
            rol: u.rol?.nombre || '—',
            activo: u.activo,
            creado_en: u.creado_en,
          }))
        );
      },
      error: () => this.usuariosTenant.set([]),
    });
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
      next: (res) => {
        const lista = res.data || [];
        this.suscripciones.set(lista);

        const ahora = new Date();
        const vigente = lista.find((suscripcion) =>
          (suscripcion.estado === 'activa' || suscripcion.estado === 'prueba') &&
          (!suscripcion.finaliza_en || new Date(suscripcion.finaliza_en) > ahora)
        );

        this.modulosPlan.set(vigente?.plan?.modulos || []);
      },
      error: () => {
        this.suscripciones.set([]);
        this.modulosPlan.set([]);
      },
    });
  }

  cargarCitas(): void {
    this.cargandoCitas.set(true);
    this.citaService.listarPorFecha(this.fechaCitas(), this.alcance()).subscribe({
      next: (lista) => {
        this.citas.set(lista || []);
        this.cargandoCitas.set(false);
      },
      error: () => this.cargandoCitas.set(false),
    });
  }

  cargarPacientes(): void {
    this.cargandoPacientes.set(true);
    this.pacienteService.listar({ per_page: 100 }, this.alcance()).subscribe({
      next: (res: any) => {
        const lista = res?.data || (Array.isArray(res) ? res : []);
        this.pacientes.set(lista);
        this.cargandoPacientes.set(false);
      },
      error: () => this.cargandoPacientes.set(false),
    });
  }

  // ---------- Aprovisionamiento de módulos ----------
  /** Busca el registro de aprovisionamiento existente para un módulo del catálogo, si lo hay. */
  private registroDeModulo(moduloId: string): ModuloEmpresaRegistro | undefined {
    return this.modulosEmpresaRegistros().find((r) => r.modulo_id === moduloId);
  }

  moduloEstaHabilitado(codigo: string): boolean {
    return this.modulosHabilitados().includes(codigo);
  }

  /** Para los botones que solo conocen el código (no el objeto Modulo completo). */
  habilitarModuloPorCodigo(codigo: string): void {
    const modulo = this.todosModulos().find((m) => m.codigo === codigo);
    if (modulo) {
      this.toggleModulo(modulo);
    }
  }

  toggleModulo(modulo: Modulo): void {
    if (this.guardandoModuloCodigo()) return;

    // Los módulos incluidos en el plan siempre están habilitados y no se
    // administran como adiciones. Solo los que están fuera del plan pueden
    // adquirirse/desactivarse como módulo adicional.
    if (this.modulosIncluidosPlan().has(modulo.codigo)) {
      return;
    }

    const registroActual = this.registroDeModulo(modulo.id);
    const nuevoActivo = !(registroActual?.activo ?? false);

    this.guardandoModuloCodigo.set(modulo.codigo);

    this.moduloEmpresaService
      .guardar(this.empresaId(), {
        modulo_id: modulo.id,
        activo: nuevoActivo,
        monto_mensual: Number(registroActual?.monto_mensual ?? 0),
        moneda: registroActual?.moneda || 'COP',
        vence_en: registroActual?.vence_en ?? null,
      })
      .subscribe({
        next: (registroGuardado) => {
          this.modulosEmpresaRegistros.update((lista) => {
            const existe = lista.some((r) => r.modulo_id === modulo.id);
            return existe
              ? lista.map((r) => (r.modulo_id === modulo.id ? registroGuardado : r))
              : [...lista, registroGuardado];
          });
          this.guardandoModuloCodigo.set(null);
        },
        error: (err) => {
          this.error.set(err?.error?.errors?.modulo_id?.[0] || `No se pudo actualizar el módulo "${modulo.nombre}". Intenta de nuevo.`);
          this.guardandoModuloCodigo.set(null);
        },
      });
  }

  moduloIncluidoEnPlan(codigo: string): boolean {
    return this.modulosIncluidosPlan().has(codigo);
  }

  moduloEsAdicion(codigo: string): boolean {
    return !this.moduloIncluidoEnPlan(codigo) && this.modulosAdicionalesActivos().has(codigo);
  }

  moduloDisponible(codigo: string): boolean {
    return this.moduloIncluidoEnPlan(codigo) || this.moduloEsAdicion(codigo);
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
      ciclo_facturacion: 'mensual',
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
        this.modulosPlan.set(nueva.plan?.modulos || []);
        this.cargarModulosEmpresa();
        this.guardandoSuscripcion.set(false);
        this.modalSuscripcionAbierto.set(false);
      },
      error: (err) => {
        this.guardandoSuscripcion.set(false);
        window.alert(err?.error?.message ?? 'No se pudo guardar la suscripción.');
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
    this.errorCita.set(null);
    this.citaService.listarProfesionales(this.alcance()).subscribe({
      next: (profs) => this.profesionales.set(profs || []),
      error: () => this.profesionales.set([]),
    });
    this.formCita.reset({
      paciente_id: pac?.id ?? '',
      veterinario_id: '',
      fecha: this.fechaCitas(),
      hora_inicio: '10:00',
      motivo: '',
      tipo_consulta: 'general',
      observaciones: '',
    });
    this.modalCitaAbierto.set(true);
  }

  guardarCita(): void {
    this.errorCita.set(null);
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
      veterinario_id: val.veterinario_id,
      fecha: val.fecha,
      hora_inicio: val.hora_inicio,
      motivo: val.motivo,
      tipo_consulta: val.tipo_consulta,
      estado: 'confirmada',
      observaciones: val.observaciones,
    };

    this.citaService.crear(payload, this.alcance()).subscribe({
      next: (nueva) => {
        this.citas.update((lista) => [...lista, nueva]);
        this.guardandoCita.set(false);
        this.modalCitaAbierto.set(false);
      },
      error: (err) => {
        this.guardandoCita.set(false);
        this.errorCita.set(err?.error?.message || 'No se pudo guardar la cita.');
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
    this.errorPaciente.set(null);
    this.formPaciente.reset({
      nombre: '',
      especie: 'Canino',
      raza: '',
      sexo: 'macho',
      fecha_nacimiento: '',
      peso_kg: null,
      estado: 'activo',
      propietario_nombre: '',
      propietario_celular: '',
      propietario_correo: '',
    });
    this.modalPacienteAbierto.set(true);
  }

  guardarPaciente(): void {
    this.errorPaciente.set(null);
    if (this.formPaciente.invalid) {
      this.formPaciente.markAllAsTouched();
      return;
    }
    this.guardandoPaciente.set(true);
    const payload: PacientePayload = this.formPaciente.value;

    this.pacienteService.crear(payload, this.alcance()).subscribe({
      next: (nuevo) => {
        this.pacientes.update((lista) => [nuevo, ...lista]);
        this.guardandoPaciente.set(false);
        this.modalPacienteAbierto.set(false);
      },
      error: (err) => {
        this.guardandoPaciente.set(false);
        this.errorPaciente.set(err?.error?.message || 'No se pudo registrar el paciente.');
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