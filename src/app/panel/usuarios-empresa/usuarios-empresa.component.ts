import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface UsuarioVeterinaria {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
  modulos: string[];
}

interface FormularioUsuario {
  nombre: string;
  correo: string;
  telefono: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
  modulos: string[];
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
export class UsuariosEmpresaComponent {

  // =========================================================
  // ESTADO
  // =========================================================

  modalAbierto = signal(false);
  modoEdicion = signal(false);

  usuarioEditandoId = signal<number | null>(null);

  busqueda = signal('');
  filtroRol = signal('Todos');
  filtroEstado = signal('Todos');

  mensaje = signal('');
  tipoMensaje = signal<'success' | 'error'>('success');

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
    modulos: []
  });

  // =========================================================
  // DATOS MOCK
  // =========================================================

  usuarios = signal<UsuarioVeterinaria[]>([
    {
      id: 1,
      nombre: 'Laura Martínez',
      correo: 'laura.martinez@vetnova.com',
      telefono: '300 456 7890',
      rol: 'Administrador',
      estado: 'Activo',
      modulos: [
        'citas',
        'clientes_pacientes',
        'usuarios',
        'reportes',
        'historias_clinicas',
        'esquema_v_d',
        'hospitalizacion',
        'procedimientos',
        'laboratorio',
        'formulaciones',
        'farmacia',
        'servicios',
        'facturacion'
      ]
    },
    {
      id: 2,
      nombre: 'Carlos Rodríguez',
      correo: 'carlos.rodriguez@vetnova.com',
      telefono: '311 234 5678',
      rol: 'Veterinario',
      estado: 'Activo',
      modulos: [
        'citas',
        'clientes_pacientes',
        'historias_clinicas',
        'esquema_v_d',
        'hospitalizacion',
        'procedimientos',
        'laboratorio',
        'formulaciones'
      ]
    },
    {
      id: 3,
      nombre: 'Mariana López',
      correo: 'mariana.lopez@vetnova.com',
      telefono: '320 987 6543',
      rol: 'Recepción',
      estado: 'Activo',
      modulos: [
        'citas',
        'clientes_pacientes'
      ]
    },
    {
      id: 4,
      nombre: 'Andrés Gómez',
      correo: 'andres.gomez@vetnova.com',
      telefono: '315 654 3210',
      rol: 'Auxiliar Veterinario',
      estado: 'Activo',
      modulos: [
        'citas',
        'clientes_pacientes',
        'esquema_v_d',
        'hospitalizacion',
        'procedimientos'
      ]
    },
    {
      id: 5,
      nombre: 'Sofía Torres',
      correo: 'sofia.torres@vetnova.com',
      telefono: '301 222 3344',
      rol: 'Contabilidad',
      estado: 'Inactivo',
      modulos: [
        'reportes',
        'facturacion'
      ]
    }
  ]);

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
      modulos: [] // el plan define los módulos: todos empiezan desactivados
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
      modulos: [...usuario.modulos]
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

  private generarId(): number {
    const usuarios = this.usuarios();

    if (usuarios.length === 0) {
      return 1;
    }

    return Math.max(...usuarios.map(usuario => usuario.id)) + 1;
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