import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa } from '../../core/models/empresa.model';
import { UsuarioService } from '../../core/services/usuario.service';
import { Usuario } from '../../core/models/usuario.model';

interface UsuarioVeterinaria {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
  modulos: string[];
  empresaId?: string; // solo aplica en la vista de Super Usuario
}

interface FormularioUsuario {
  nombre: string;
  correo: string;
  telefono: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
  modulos: string[];
  empresaId: string; // solo se usa/valida en la vista de Super Usuario
}

interface ModuloDisponible {
  codigo: string;
  nombre: string;
  icono: string;
}

@Component({
  selector: 'app-usuarios-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-empresa.component.html',
  styleUrls: ['./usuarios-empresa.component.scss']
})
export class UsuariosEmpresaComponent implements OnInit {

  private readonly router = inject(Router);
  private readonly empresaService = inject(EmpresaService);
  private readonly usuarioService = inject(UsuarioService);

  // =========================================================
  // CONTEXTO: esta misma pantalla se usa en /super-usuario/usuarios
  // y en /panel/usuarios. El selector de Empresa SOLO tiene sentido
  // cuando un Super Administrador está creando/editando el usuario,
  // porque en /panel el usuario ya pertenece a la empresa actual.
  // =========================================================
  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  empresasDisponibles = signal<Empresa[]>([]);
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

  ngOnInit(): void {
    if (this.esVistaSuperUsuario()) {
      this.cargarEmpresas();
      this.cargarUsuarios();
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
      estado: u.activo ? 'Activo' : 'Inactivo',
      modulos: [], // el backend aún no expone módulos por usuario
      empresaId: u.empresa_id,
    };
  }

  cargarEmpresas(): void {
    this.cargandoEmpresas.set(true);
    this.empresaService.listar().subscribe({
      next: (respuesta) => {
        this.empresasDisponibles.set(respuesta.data);
        this.cargandoEmpresas.set(false);
      },
      error: () => this.cargandoEmpresas.set(false),
    });
  }

  // =========================================================
  // ROLES
  // =========================================================

  readonly roles = [
    'Administrador',
    'Veterinario',
    'Recepción',
    'Auxiliar Veterinario',
    'Contabilidad'
  ];

  // =========================================================
  // MÓDULOS DISPONIBLES
  // =========================================================

  readonly modulosDisponibles: ModuloDisponible[] = [
    {
      codigo: 'citas',
      nombre: 'Agenda Médica',
      icono: 'agenda'
    },
    {
      codigo: 'clientes_pacientes',
      nombre: 'Pacientes',
      icono: 'pacientes'
    },
    {
      codigo: 'usuarios',
      nombre: 'Usuarios',
      icono: 'usuarios'
    },
    {
      codigo: 'reportes',
      nombre: 'Reportes',
      icono: 'reportes'
    },
    {
      codigo: 'historias_clinicas',
      nombre: 'Historias Clínicas',
      icono: 'historia'
    },
    {
      codigo: 'esquema_v_d',
      nombre: 'Vacunación y Desparasitación',
      icono: 'vacuna'
    },
    {
      codigo: 'hospitalizacion',
      nombre: 'Hospitalización',
      icono: 'hospital'
    },
    {
      codigo: 'procedimientos',
      nombre: 'Procedimientos',
      icono: 'procedimiento'
    },
    {
      codigo: 'laboratorio',
      nombre: 'Laboratorio',
      icono: 'laboratorio'
    },
    {
      codigo: 'formulaciones',
      nombre: 'Formulaciones',
      icono: 'receta'
    },
    {
      codigo: 'farmacia',
      nombre: 'Farmacia',
      icono: 'farmacia'
    },
    {
      codigo: 'servicios',
      nombre: 'Servicios',
      icono: 'servicios'
    },
    {
      codigo: 'facturacion',
      nombre: 'Facturación',
      icono: 'facturacion'
    }
  ];

  // =========================================================
  // FORMULARIO
  // =========================================================

  formulario = signal<FormularioUsuario>({
    nombre: '',
    correo: '',
    telefono: '',
    rol: 'Veterinario',
    estado: 'Activo',
    modulos: [],
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
      rol: 'Veterinario',
      estado: 'Activo',
      modulos: [], // el plan define los módulos: todos empiezan desactivados
      empresaId: ''
    });

    this.modalAbierto.set(true);
  }

  editarUsuario(usuario: UsuarioVeterinaria): void {
    this.modoEdicion.set(true);
    this.usuarioEditandoId.set(usuario.id);

    this.formulario.set({
      nombre: usuario.nombre,
      correo: usuario.correo,
      telefono: usuario.telefono,
      rol: usuario.rol,
      estado: usuario.estado,
      modulos: [...usuario.modulos],
      empresaId: usuario.empresaId ?? ''
    });

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

    this.formulario.update(formulario => ({
      ...formulario,
      [campo]: valor
    }));
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

      return {
        ...formulario,
        modulos: existe
          ? formulario.modulos.filter(modulo => modulo !== codigo)
          : [...formulario.modulos, codigo]
      };
    });
  }

  seleccionarTodosLosModulos(): void {
    this.formulario.update(formulario => ({
      ...formulario,
      modulos: this.modulosDisponibles.map(modulo => modulo.codigo)
    }));
  }

  quitarTodosLosModulos(): void {
    this.formulario.update(formulario => ({
      ...formulario,
      modulos: []
    }));
  }

  // =========================================================
  // GUARDAR
  // =========================================================

  guardarUsuario(): void {

    const formulario = this.formulario();

    if (!formulario.nombre.trim()) {
      this.mostrarMensaje('Ingresa el nombre del usuario.', 'error');
      return;
    }

    if (!formulario.correo.trim()) {
      this.mostrarMensaje('Ingresa el correo electrónico.', 'error');
      return;
    }

    if (!this.validarCorreo(formulario.correo)) {
      this.mostrarMensaje('Ingresa un correo electrónico válido.', 'error');
      return;
    }

    if (!formulario.rol) {
      this.mostrarMensaje('Selecciona un rol.', 'error');
      return;
    }

    if (this.esVistaSuperUsuario() && !formulario.empresaId) {
      this.mostrarMensaje('Selecciona la empresa a la que pertenece el usuario.', 'error');
      return;
    }

    if (formulario.modulos.length === 0) {
      this.mostrarMensaje(
        'Debes asignar al menos un módulo al usuario.',
        'error'
      );
      return;
    }

    // EDITAR
    if (this.modoEdicion()) {

      const id = this.usuarioEditandoId();

      this.usuarios.update(usuarios =>
        usuarios.map(usuario =>
          usuario.id === id
            ? {
                ...usuario,
                ...formulario,
                nombre: formulario.nombre.trim(),
                correo: formulario.correo.trim().toLowerCase()
              }
            : usuario
        )
      );

      this.mostrarMensaje('Usuario actualizado correctamente.', 'success');

    } else {

      // CREAR
      const nuevoUsuario: UsuarioVeterinaria = {
        id: this.generarId(),
        nombre: formulario.nombre.trim(),
        correo: formulario.correo.trim().toLowerCase(),
        telefono: formulario.telefono.trim(),
        rol: formulario.rol,
        estado: formulario.estado,
        modulos: [...formulario.modulos]
      };

      this.usuarios.update(usuarios => [
        ...usuarios,
        nuevoUsuario
      ]);

      this.mostrarMensaje('Usuario creado correctamente.', 'success');
    }

    this.cerrarModal();
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