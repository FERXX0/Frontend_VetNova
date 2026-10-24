import { PermisoDirective } from '../../core/directives/permiso.directive';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa, EmpresaOpcion } from '../../core/models/empresa.model';
import { UsuarioService } from '../../core/services/usuario.service';
import { Usuario, UsuarioPayload } from '../../core/models/usuario.model';
import { CatalogoService } from '../../core/services/catalogo.service';
import { SessionService } from '../../core/services/session.service';
import { Rol, Modulo } from '../../core/models/auth.model';
import { SuscripcionService } from '../../core/services/suscripcion.service';
import { ModuloEmpresaService } from '../../core/services/modulo-empresa.service';

const ROLES_PLATAFORMA = ['super_admin', 'soporte'];

interface UsuarioVeterinaria {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: string;
  rolId: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  estado: 'Activo' | 'Inactivo';
  modulos: string[];
  permisos: string[];
  permisosPersonalizados: boolean;
  empresaId?: string; // solo aplica en la vista de Super Usuario
}

interface FormularioUsuario {
  nombre: string;
  correo: string;
  telefono: string;
  rolId: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  contrasena: string;
  estado: 'Activo' | 'Inactivo';
  modulos: string[];
  permisos: string[];
  empresaId: string; // solo se usa/valida en la vista de Super Usuario
}

@Component({
  selector: 'app-usuarios-empresa',
  standalone: true,
  imports: [PermisoDirective, CommonModule, FormsModule],
  templateUrl: './usuarios-empresa.component.html',
  styleUrls: ['./usuarios-empresa.component.scss']
})
export class UsuariosEmpresaComponent implements OnInit {

  private readonly router = inject(Router);
  private readonly empresaService = inject(EmpresaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly session = inject(SessionService);
  private readonly suscripcionService = inject(SuscripcionService);
  private readonly moduloEmpresaService = inject(ModuloEmpresaService);

  // =========================================================
  // CONTEXTO: esta misma pantalla se usa en /super-usuario/usuarios
  // y en /panel/usuarios. El selector de Empresa SOLO tiene sentido
  // cuando un Super Administrador está creando/editando el usuario,
  // porque en /panel el usuario ya pertenece a la empresa actual.
  // =========================================================
  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  empresasDisponibles = signal<EmpresaOpcion[]>([]);
  cargandoEmpresas = signal(false);

  // =========================================================
  // ESTADO
  // =========================================================

  modalAbierto = signal(false);
  modoEdicion = signal(false);

  usuarioEditandoId = signal<string | null>(null);

  busqueda = signal('');
  filtroRol = signal('Todos');
  filtroEstado = signal('Todos');

  mensaje = signal('');
  tipoMensaje = signal<'success' | 'error'>('success');

  cargandoUsuarios = signal(false);
  permisosCatalogo = signal<{ id: string; modulo_id: string; codigo: string; nombre: string; activo: boolean }[]>([]);
  moduloPermisosAbierto = signal<string | null>(null);
  permisosDeModulo(moduloId: string) {
    return this.permisosCatalogo().filter(p => p.activo && p.modulo_id === moduloId);
  }
  permisosSeleccionadosModulo(moduloId: string): number {
    return this.permisosDeModulo(moduloId).filter(p => this.formulario().permisos.includes(p.id)).length;
  }
  permisoSeleccionado(id: string): boolean { return this.formulario().permisos.includes(id); }
  togglePermiso(id: string): void {
    this.formulario.update(f => ({ ...f, permisos: f.permisos.includes(id) ? f.permisos.filter(x => x !== id) : [...f.permisos, id] }));
  }
  abrirPermisos(codigo: string): void {
    this.moduloPermisosAbierto.update(actual => actual === codigo ? null : codigo);
  }
  cargarPermisos(): void {
    this.usuarioService.listarPermisos().subscribe({
      next: r => this.permisosCatalogo.set(r.permisos),
      error: () => this.mostrarMensaje('No se pudo cargar el catálogo de permisos.', 'error')
    });
  }

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarPermisos();
    this.cargarCatalogoModulos();

    if (this.esVistaSuperUsuario()) {
      this.cargarEmpresas();
      this.cargarUsuarios();
    } else {
      const empresaId = this.session.usuario()?.empresa?.id;
      if (empresaId) {
        this.cargarModulosPermitidos(empresaId);
      }
    }
  }

  cargarUsuarios(): void {
    this.cargandoUsuarios.set(true);
    this.usuarioService.listarGlobal().subscribe({
      next: (respuesta) => {
        this.usuarios.set(respuesta.data.map((u) => this.mapearUsuario(u)));
        this.cargandoUsuarios.set(false);
      },
      error: () => {
        this.mostrarMensaje('No se pudieron cargar los usuarios.', 'error');
        this.cargandoUsuarios.set(false);
      },
    });
  }

  private mapearUsuario(u: Usuario): UsuarioVeterinaria {
    return {
      id: u.id,
      nombre: u.nombre,
      correo: u.correo,
      telefono: u.celular || '',
      rol: u.rol?.nombre || '—',
      rolId: u.rol_id,
      tipoIdentificacion: u.tipo_identificacion,
      numeroIdentificacion: u.numero_identificacion,
      estado: u.activo ? 'Activo' : 'Inactivo',
      modulos: (u.modulos || []).map((modulo) => modulo.codigo),
      permisos: (u.permisos || []).map(p => p.id),
      permisosPersonalizados: !!u.permisos_personalizados,
      empresaId: u.empresa_id,
    };
  }

  cargarEmpresas(): void {
    if (!this.esVistaSuperUsuario()) return;

    this.cargandoEmpresas.set(true);
    this.empresaService.listarOpciones().subscribe({
      next: (respuesta) => {
        this.empresasDisponibles.set(respuesta || []);
        this.cargandoEmpresas.set(false);
      },
      error: () => this.cargandoEmpresas.set(false),
    });
  }

  // =========================================================
  // ROLES
  // =========================================================

  rolesCatalogo = signal<Rol[]>([]);

  // Para el filtro de la tabla (nombres)
  roles = computed(() => this.rolesCatalogo().map(r => r.nombre));

  // Para el select del formulario
  rolesDisponibles = computed(() => {
    const roles = this.rolesCatalogo();

    // Vista de Super Usuario: todos los roles para cualquier empresa.
    // Vista /panel (admin de una veterinaria): sin roles de plataforma.
    return this.esVistaSuperUsuario()
      ? roles
      : roles.filter(r => !ROLES_PLATAFORMA.includes(r.codigo));
  });

  esRolPlataforma(rolId: string): boolean {
    const rol = this.rolesCatalogo().find(r => r.id === rolId);
    return !!rol && ROLES_PLATAFORMA.includes(rol.codigo);
  }

  cargarRoles(): void {
    this.catalogoService.roles().subscribe({
      next: (roles) => this.rolesCatalogo.set(roles),
      error: () => this.mostrarMensaje('No se pudieron cargar los roles.', 'error'),
    });
  }

  // =========================================================
  // MÓDULOS: catálogo real + filtro por plan/adicionales de la empresa
  // =========================================================

  // Catálogo completo (GET /api/catalogos/modulos), fuente real de id+codigo.
  private readonly catalogoModulos = signal<Modulo[]>([]);

  // Códigos de módulo que el PLAN (o los módulos adicionales) de la
  // empresa seleccionada realmente incluye. Se recalcula cada vez que
  // cambia la empresa (en la vista de Super Usuario) o al iniciar
  // (en /panel, con la empresa de la sesión).
  private readonly modulosPermitidosEmpresa = signal<Set<string>>(new Set());
  cargandoModulosPermitidos = signal(false);

  // Lo que realmente se pinta en el checklist del modal: solo los
  // módulos del catálogo que la empresa tiene incluidos en su plan
  // o como módulo adicional activo.
  readonly modulosDisponibles = computed(() => {
    const permitidos = this.modulosPermitidosEmpresa();
    return this.catalogoModulos().filter((modulo) => permitidos.has(modulo.codigo));
  });

  cargarCatalogoModulos(): void {
    this.catalogoService.modulos().subscribe({
      next: (modulos) => this.catalogoModulos.set(modulos),
      error: () => this.mostrarMensaje('No se pudo cargar el catálogo de módulos.', 'error'),
    });
  }

  /** Códigos de módulo incluidos en el plan activo/prueba de la empresa, más sus módulos adicionales vigentes. */
  cargarModulosPermitidos(empresaId: string): void {
    this.cargandoModulosPermitidos.set(true);

    forkJoin({
      suscripciones: this.suscripcionService.listarPorEmpresa(empresaId),
      adicionales: this.moduloEmpresaService.listar(empresaId),
    }).subscribe({
      next: ({ suscripciones, adicionales }) => {
        const codigos = new Set<string>();

        const ahora = new Date();

        suscripciones.data
          .filter((suscripcion) =>
            (suscripcion.estado === 'activa' || suscripcion.estado === 'prueba') &&
            (!suscripcion.finaliza_en || new Date(suscripcion.finaliza_en) > ahora)
          )
          .forEach((suscripcion) =>
            (suscripcion.plan.modulos || []).forEach((modulo) => codigos.add(modulo.codigo))
          );

        adicionales
          .filter((registro) =>
            registro.activo &&
            (!registro.vence_en || new Date(registro.vence_en) > ahora)
          )
          .forEach((registro) => {
            if (registro.modulo) codigos.add(registro.modulo.codigo);
          });

        this.modulosPermitidosEmpresa.set(codigos);
        this.cargandoModulosPermitidos.set(false);
      },
      error: () => {
        this.modulosPermitidosEmpresa.set(new Set());
        this.cargandoModulosPermitidos.set(false);
      },
    });
  }

  // =========================================================
  // FORMULARIO
  // =========================================================

  formulario = signal<FormularioUsuario>({
    nombre: '',
    correo: '',
    telefono: '',
    rolId: '',
    tipoIdentificacion: 'CC',
    numeroIdentificacion: '',
    contrasena: '',
    estado: 'Activo',
    modulos: [],
    permisos: [],
    empresaId: ''
  });

  // =========================================================
  // DATOS MOCK
  // =========================================================

  // Se carga desde UsuarioService.listarGlobal() en ngOnInit (solo Super Usuario).
  // En /panel/usuarios queda vacío hasta que exista un endpoint por empresa propio.
  usuarios = signal<UsuarioVeterinaria[]>([]);

  // =========================================================
  // FILTRADO
  // =========================================================

  usuariosFiltrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const rol = this.filtroRol();
    const estado = this.filtroEstado();

    return this.usuarios().filter(usuario => {

      const coincideBusqueda =
        !texto ||
        usuario.nombre.toLowerCase().includes(texto) ||
        usuario.correo.toLowerCase().includes(texto);

      const coincideRol =
        rol === 'Todos' ||
        usuario.rol === rol;

      const coincideEstado =
        estado === 'Todos' ||
        usuario.estado === estado;

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  });

  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  totalUsuarios = computed(() => this.usuarios().length);

  usuariosActivos = computed(() =>
    this.usuarios().filter(usuario => usuario.estado === 'Activo').length
  );

  usuariosInactivos = computed(() =>
    this.usuarios().filter(usuario => usuario.estado === 'Inactivo').length
  );

  administradores = computed(() =>
    this.usuarios().filter(usuario => usuario.rol === 'Administrador').length
  );

  // =========================================================
  // MODAL
  // =========================================================

  abrirNuevoUsuario(): void {
    this.modoEdicion.set(false);
    this.usuarioEditandoId.set(null);

    this.formulario.set({
      nombre: '',
      correo: '',
      telefono: '',
      rolId: '',
      tipoIdentificacion: '',
      numeroIdentificacion: '',
      contrasena: '',
      estado: 'Activo',
      modulos: [],
      permisos: [],
      empresaId: '',
    });

    if (this.esVistaSuperUsuario()) {
      // Hasta que no se elija una empresa no sabemos qué módulos puede tener.
      this.modulosPermitidosEmpresa.set(new Set());
    }

    this.modalAbierto.set(true);
  }

  editarUsuario(usuario: UsuarioVeterinaria): void {
    this.modoEdicion.set(true);
    this.usuarioEditandoId.set(usuario.id);

    this.formulario.set({
      nombre: usuario.nombre,
      correo: usuario.correo,
      telefono: usuario.telefono,
      rolId: usuario.rolId,
      tipoIdentificacion: usuario.tipoIdentificacion,
      numeroIdentificacion: usuario.numeroIdentificacion,
      contrasena: '',
      estado: usuario.estado,
      modulos: [...usuario.modulos],
      permisos: [...usuario.permisos],
      empresaId: usuario.empresaId ?? ''
    });

    if (this.esVistaSuperUsuario() && usuario.empresaId) {
      this.cargarModulosPermitidos(usuario.empresaId);
    }

    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  // =========================================================
  // FORMULARIO
  // =========================================================

  actualizarCampo(
    campo: keyof FormularioUsuario,
    valor: string
  ): void {
    this.formulario.update(f => ({
      ...f,
      [campo]: valor,
      // al cambiar de empresa se limpia el rol y los módulos, porque ambas
      // listas dependen de la empresa elegida
      ...(campo === 'empresaId' ? { rolId: '', modulos: [], permisos: [] } : {})
    }));

    if (campo === 'empresaId') {
      if (valor) {
        this.cargarModulosPermitidos(valor);
      } else {
        this.modulosPermitidosEmpresa.set(new Set());
      }
    }
  }

  /** Deja solo dígitos en el campo de texto indicado y limita su longitud mientras se escribe. */
  soloNumeros(event: Event, campo: keyof FormularioUsuario, max = 10): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value.replace(/\D/g, '').slice(0, max);

    input.value = valor;
    this.actualizarCampo(campo, valor);
  }

  // =========================================================
  // MÓDULOS
  // =========================================================

  moduloSeleccionado(codigo: string): boolean {
    return this.formulario().modulos.includes(codigo);
  }

  toggleModulo(codigo: string): void {
    this.formulario.update(formulario => {

      const existe = formulario.modulos.includes(codigo);
      const modulo = this.catalogoModulos().find(m => m.codigo === codigo);
      const idsPermisos = this.permisosDeModulo(modulo?.id || '').map(p => p.id);

      return {
        ...formulario,
        modulos: existe
          ? formulario.modulos.filter(modulo => modulo !== codigo)
          : [...formulario.modulos, codigo],
        permisos: existe ? formulario.permisos.filter(id => !idsPermisos.includes(id)) : [...formulario.permisos, ...this.permisosDeModulo(modulo?.id || '').filter(p => p.codigo.endsWith('.ver')).map(p => p.id)]
      };
    });
  }

  seleccionarTodosLosModulos(): void {
    this.formulario.update(formulario => ({
      ...formulario,
      modulos: this.modulosDisponibles().map(modulo => modulo.codigo),
      permisos: this.permisosCatalogo().filter(p => p.codigo.endsWith('.ver') && this.modulosDisponibles().some(m => m.id === p.modulo_id)).map(p => p.id)
    }));
  }

  quitarTodosLosModulos(): void {
    this.formulario.update(formulario => ({
      ...formulario,
      modulos: [],
      permisos: []
    }));
  }

  // =========================================================
  // GUARDAR
  // =========================================================
  // 
  guardarUsuario(): void {
    const f = this.formulario();
    
    if (!f.nombre.trim()) { this.mostrarMensaje('Ingresa el nombre del usuario.', 'error'); return; }
    if (!f.correo.trim()) { this.mostrarMensaje('Ingresa el correo electrónico.', 'error'); return; }
    if (!this.validarCorreo(f.correo)) { this.mostrarMensaje('Ingresa un correo electrónico válido.', 'error'); return; }
    if (this.esVistaSuperUsuario() && !f.empresaId) { this.mostrarMensaje('Selecciona la empresa a la que pertenece el usuario.', 'error'); return; }
    if (!f.rolId) { this.mostrarMensaje('Selecciona un rol.', 'error'); return; }
    if (!f.numeroIdentificacion.trim()) { this.mostrarMensaje('Ingresa el número de identificación.', 'error'); return; }
    if (!this.modoEdicion() && f.contrasena.length < 8) { this.mostrarMensaje('La contraseña debe tener al menos 8 caracteres.', 'error'); return; }
    if (!this.esRolPlataforma(f.rolId) && f.modulos.length === 0) {
      this.mostrarMensaje('Debes asignar al menos un módulo al usuario.', 'error');
      return;
    }

    const empresaId = this.esVistaSuperUsuario()
      ? f.empresaId
      : this.session.usuario()?.empresa?.id ?? '';

    const payload: UsuarioPayload = {
      rol_id: f.rolId,
      nombre: f.nombre.trim(),
      tipo_identificacion: f.tipoIdentificacion,
      numero_identificacion: f.numeroIdentificacion.trim(),
      celular: f.telefono.trim() || null,
      correo: f.correo.trim().toLowerCase(),
      activo: f.estado === 'Activo',
    };
    if (f.contrasena) payload.contrasena = f.contrasena;

    if (!this.esRolPlataforma(f.rolId)) {
      const catalogo = this.catalogoModulos();
      const ids = f.modulos
        .map((codigo) => catalogo.find((modulo) => modulo.codigo === codigo)?.id)
        .filter((id): id is string => !!id);

      if (ids.length !== f.modulos.length) {
        this.mostrarMensaje('No se pudo identificar algún módulo seleccionado. Recarga la página e inténtalo de nuevo.', 'error');
        return;
      }

      payload.modulos = ids;
      const permitidos = new Set(this.permisosCatalogo().filter(p =>
        f.modulos.some(codigo => this.catalogoModulos().find(m => m.codigo === codigo)?.id === p.modulo_id)
      ).map(p => p.id));
      payload.permisos = f.permisos.filter(id => permitidos.has(id));
      payload.permisos_personalizados = true;
    }

    const peticion = this.modoEdicion()
      ? this.usuarioService.actualizar(empresaId, this.usuarioEditandoId()!, payload)
      : this.usuarioService.crear(empresaId, payload);

    peticion.subscribe({
      next: () => {
        this.mostrarMensaje(
          this.modoEdicion() ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.',
          'success'
        );
        this.cerrarModal();
        if (this.esVistaSuperUsuario()) this.cargarUsuarios();
      },
      error: (err) => {
        const detalle = err?.error?.errors
          ? (Object.values(err.error.errors)[0] as string[])[0]
          : err?.error?.message;
        this.mostrarMensaje(detalle || 'No se pudo guardar el usuario.', 'error');
      },
    });
  }

  // =========================================================
  // ACTIVAR / DESACTIVAR
  // =========================================================

  cambiarEstado(usuario: UsuarioVeterinaria): void {

    const nuevoEstado =
      usuario.estado === 'Activo'
        ? 'Inactivo'
        : 'Activo';

    this.usuarios.update(usuarios =>
      usuarios.map(item =>
        item.id === usuario.id
          ? {
              ...item,
              estado: nuevoEstado
            }
          : item
      )
    );

    this.mostrarMensaje(
      `Usuario ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'} correctamente.`,
      'success'
    );
  }

  // =========================================================
  // ELIMINAR
  // =========================================================

  eliminarUsuario(usuario: UsuarioVeterinaria): void {

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar a ${usuario.nombre}?`
    );

    if (!confirmar) {
      return;
    }

    if (this.esVistaSuperUsuario() && usuario.empresaId) {
      this.usuarioService.eliminar(usuario.empresaId, usuario.id).subscribe({
        next: () => {
          this.usuarios.update(usuarios => usuarios.filter(item => item.id !== usuario.id));
          this.mostrarMensaje('Usuario eliminado correctamente.', 'success');
        },
        error: () => this.mostrarMensaje('No se pudo eliminar el usuario.', 'error'),
      });
      return;
    }

    this.usuarios.update(usuarios =>
      usuarios.filter(item => item.id !== usuario.id)
    );

    this.mostrarMensaje('Usuario eliminado correctamente.', 'success');
  }

  // =========================================================
  // UTILIDADES
  // =========================================================

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroRol.set('Todos');
    this.filtroEstado.set('Todos');
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  cambiarFiltroRol(valor: string): void {
    this.filtroRol.set(valor);
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
  }

  obtenerIniciales(nombre: string): string {
    const partes = nombre
      .trim()
      .split(' ')
      .filter(Boolean);

    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }

    return (
      partes[0][0] +
      partes[partes.length - 1][0]
    ).toUpperCase();
  }

  obtenerCantidadModulos(usuario: UsuarioVeterinaria): number {
    return usuario.modulos.length;
  }

  private generarId(): string {
    return 'local-' + Date.now().toString();
  }

  private validarCorreo(correo: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  }

  private mostrarMensaje(
    mensaje: string,
    tipo: 'success' | 'error'
  ): void {
    this.mensaje.set(mensaje);
    this.tipoMensaje.set(tipo);

    setTimeout(() => {
      this.mensaje.set('');
    }, 3000);
  }
}