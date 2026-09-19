import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { Usuario, UsuarioPayload } from '../../core/models/usuario.model';
import { Empresa } from '../../core/models/empresa.model';
import { Rol } from '../../core/models/auth.model';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class UsuariosAdminComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly empresaService = inject(EmpresaService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly fb = inject(FormBuilder);

  private esEmpresaSistema(empresaId: string): boolean {
    const empresa = this.empresas().find(
      e => e.id === empresaId
    );

    return empresa?.es_empresa_sistema === true;
  }

  usuarios = signal<Usuario[]>([]);
  empresas = signal<Empresa[]>([]);
  roles = signal<Rol[]>([]);
  rolesDisponibles = signal<Rol[]>([]);

  cargando = signal(false);
  error = signal<string | null>(null);

  // Paginación (server-side, tal como la devuelve Laravel)
  paginaActual = signal(1);
  totalPaginas = signal(1);
  total = signal(0);

  // ---------- Filtros ----------
  filtroBuscar = signal('');
  filtroEmpresaId = signal('');
  filtroRolId = signal('');
  filtroActivo = signal<'' | '1' | '0'>('');

  // ---------- Modal crear/editar ----------
  modalAbierto = signal(false);
  usuarioEnEdicion = signal<Usuario | null>(null);
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      empresa_id: ['', [Validators.required]],
      rol_id: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      tipo_identificacion: ['CC', [Validators.required]],
      numero_identificacion: ['', [Validators.required, Validators.maxLength(30)]],
      celular: ['', [Validators.maxLength(10)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      contrasena: ['', [Validators.minLength(8)]],
      activo: [true],
    });
  }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarUsuarios();
  }

  private cargarCatalogos(): void {
    this.empresaService.listar().subscribe({
      next: (res) => this.empresas.set(res.data || []),
      error: () => this.empresas.set([]),
    });

    this.catalogoService.roles().subscribe({
      next: (res) => this.roles.set(res || []),
      error: () => this.roles.set([]),
    });
  }

  cargarUsuarios(pagina = 1): void {
    this.cargando.set(true);
    this.error.set(null);

    this.usuarioService
      .listarGlobal({
        buscar: this.filtroBuscar() || undefined,
        empresa_id: this.filtroEmpresaId() || undefined,
        rol_id: this.filtroRolId() || undefined,
        activo: this.filtroActivo() || undefined,
        page: pagina,
      })
      .subscribe({
        next: (res) => {
          this.usuarios.set(res.data);
          this.paginaActual.set(res.current_page);
          this.totalPaginas.set(res.last_page);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los usuarios. Verifica tu conexión con el backend.');
          this.cargando.set(false);
        },
      });
  }

  aplicarFiltros(): void {
    this.cargarUsuarios(1);
  }

  limpiarFiltros(): void {
    this.filtroBuscar.set('');
    this.filtroEmpresaId.set('');
    this.filtroRolId.set('');
    this.filtroActivo.set('');
    this.cargarUsuarios(1);
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.cargarUsuarios(pagina);
  }

  abrirModalCrear(): void {
    this.usuarioEnEdicion.set(null);
    this.errorFormulario.set(null);

    const empresaId = this.empresas()[0]?.id || '';

    this.form.reset({
      empresa_id: empresaId,
      rol_id: '',
      nombre: '',
      tipo_identificacion: 'CC',
      numero_identificacion: '',
      celular: '',
      correo: '',
      contrasena: '',
      activo: true,
    });

    this.actualizarRolesDisponibles(empresaId);

    this.form
      .get('contrasena')
      ?.setValidators([
        Validators.required,
        Validators.minLength(8)
      ]);

    this.form
      .get('contrasena')
      ?.updateValueAndValidity();

    this.form.get('empresa_id')?.enable();

    this.modalAbierto.set(true);
  }

  abrirModalEditar(usuario: Usuario): void {
    this.usuarioEnEdicion.set(usuario);
    this.errorFormulario.set(null);
    this.form.reset({
      empresa_id: usuario.empresa_id,
      rol_id: usuario.rol_id,
      nombre: usuario.nombre,
      tipo_identificacion: usuario.tipo_identificacion,
      numero_identificacion: usuario.numero_identificacion,
      celular: usuario.celular || '',
      correo: usuario.correo,
      contrasena: '',
      activo: usuario.activo,
    });

    this.actualizarRolesDisponibles(usuario.empresa_id);
    
    // La contraseña es opcional al editar; y la empresa no se puede reasignar
    // desde aquí (el backend la resuelve por la ruta /empresas/{empresa}/usuarios/{usuario}).
    this.form.get('contrasena')?.setValidators([Validators.minLength(8)]);
    this.form.get('contrasena')?.updateValueAndValidity();
    this.form.get('empresa_id')?.disable();
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
    const formVal = this.form.getRawValue();
    const enEdicion = this.usuarioEnEdicion();

    const payload: UsuarioPayload = {
      rol_id: formVal.rol_id,
      nombre: formVal.nombre,
      tipo_identificacion: formVal.tipo_identificacion,
      numero_identificacion: formVal.numero_identificacion,
      celular: formVal.celular || null,
      correo: formVal.correo,
      activo: formVal.activo,
    };
    if (formVal.contrasena) {
      payload.contrasena = formVal.contrasena;
    }

    const empresaId = enEdicion ? enEdicion.empresa_id : formVal.empresa_id;

    const request$ = enEdicion
      ? this.usuarioService.actualizar(empresaId, enEdicion.id, payload)
      : this.usuarioService.crear(empresaId, payload);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargarUsuarios(this.paginaActual());
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(
          err?.error?.message ?? 'No se pudo guardar el usuario. Revisa los datos.'
        );
      },
    });
  }

  eliminar(usuario: Usuario): void {
    const confirmado = confirm(`¿Eliminar al usuario "${usuario.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    this.usuarioService.eliminar(usuario.empresa_id, usuario.id).subscribe({
      next: () => this.cargarUsuarios(this.paginaActual()),
      error: () => this.error.set('No se pudo eliminar el usuario.'),
    });
  }

  cambioEmpresa(): void {
    const empresaId = this.form.get('empresa_id')?.value;

    if (!empresaId) {
      this.rolesDisponibles.set([]);
      this.form.get('rol_id')?.setValue('');
      return;
    }

    this.actualizarRolesDisponibles(empresaId);

    const rolActual = this.form.get('rol_id')?.value;

    const rolValido = this.rolesDisponibles().some(
      rol => rol.id === rolActual
    );

    if (!rolValido) {
      this.form.get('rol_id')?.setValue('');
    }
  }

  private actualizarRolesDisponibles(empresaId: string): void {
    const empresaSistema = this.esEmpresaSistema(empresaId);

    if (empresaSistema) {
      this.rolesDisponibles.set(
        this.roles().filter(
          rol =>
            rol.codigo === 'soporte' ||
            rol.codigo === 'super_admin'
        )
      );

      return;
    }

    this.rolesDisponibles.set(
      this.roles().filter(
        rol => rol.codigo !== 'super_admin'
      )
    );
  }
}
