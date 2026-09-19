import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  NavigationEnd
} from '@angular/router';
import { filter } from 'rxjs';
import { SessionService } from '../../core/services/session.service';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu';

interface NavItem {
  ruta: string;
  nombre: string;
  icono: string;
}

@Component({
  selector: 'app-super-usuario-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    UserMenuComponent
  ],
  templateUrl: './super-usuario-layout.html',
  styleUrl: './super-usuario-layout.scss',
})
export class SuperUsuarioLayoutComponent {

  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  sidebarAbierto = signal(false);
  modulosAbiertos = signal(false);

  readonly tituloActual = signal('Inicio');
  readonly usuario = this.session.usuario;

  /**
   * Menú propio de la administración de la plataforma.
   *
   * Estos elementos NO dependen de los módulos de una veterinaria.
   * Por eso Usuarios, Empresas y Configuración permanecen aquí.
   */
  readonly navPrincipal: NavItem[] = [
    {
      ruta: '/super-usuario/dashboard',
      nombre: 'Inicio',
      icono: 'dashboard'
    },
    {
      ruta: '/super-usuario/empresas',
      nombre: 'Empresas Registradas',
      icono: 'veterinarias'
    },
    {
      ruta: '/super-usuario/usuarios',
      nombre: 'Usuarios',
      icono: 'usuarios'
    },
    {
      ruta: '/super-usuario/configuracion',
      nombre: 'Configuración Global',
      icono: 'configuracion'
    },
  ];

  /**
   * Catálogo de módulos funcionales de VetNova.
   *
   * IMPORTANTE:
   * `usuarios` NO está aquí porque no es uno de los módulos
   * funcionales entregados por el backend.
   *
   * `inicio` sí está aquí porque representa el módulo Inicio
   * del sistema.
   */
  readonly catalogoModulos = [
    {
      codigo: 'inicio',
      nombre: 'Inicio',
      ruta: '/panel/dashboard',
      icono: 'dashboard'
    },
    {
      codigo: 'citas',
      nombre: 'Agenda Médica',
      ruta: '/panel/agenda',
      icono: 'agenda'
    },
    {
      codigo: 'clientes_pacientes',
      nombre: 'Pacientes',
      ruta: '/panel/pacientes',
      icono: 'pacientes'
    },
    {
      codigo: 'reportes',
      nombre: 'Reportes',
      ruta: '/panel/reportes',
      icono: 'reportes'
    },
    {
      codigo: 'historias_clinicas',
      nombre: 'Historias Clínicas',
      ruta: '/panel/historias-clinicas',
      icono: 'historia'
    },
    {
      codigo: 'esquema_v_d',
      nombre: 'Vacunación y Desparasitación',
      ruta: '/panel/esquema-v-d',
      icono: 'vacuna'
    },
    {
      codigo: 'hospitalizacion',
      nombre: 'Hospitalización',
      ruta: '/panel/hospitalizacion',
      icono: 'hospital'
    },
    {
      codigo: 'procedimientos',
      nombre: 'Procedimientos',
      ruta: '/panel/procedimientos',
      icono: 'procedimiento'
    },
    {
      codigo: 'laboratorio',
      nombre: 'Laboratorio',
      ruta: '/panel/laboratorio',
      icono: 'laboratorio'
    },
    {
      codigo: 'formulaciones',
      nombre: 'Formulaciones',
      ruta: '/panel/formulaciones',
      icono: 'receta'
    },
    {
      codigo: 'farmacia',
      nombre: 'Farmacia',
      ruta: '/panel/farmacia',
      icono: 'farmacia'
    },
    {
      codigo: 'servicios',
      nombre: 'Servicios',
      icono: 'servicios',
      proximamente: true
    },
    {
      codigo: 'facturacion',
      nombre: 'Facturación',
      icono: 'facturacion',
      proximamente: true
    },
    {
      codigo: 'configuracion',
      nombre: 'Configuración',
      ruta: '/panel/perfil',
      icono: 'configuracion'
    },
  ];

  /**
   * Códigos de módulos que tiene actualmente el usuario.
   *
   * Superadministrador:
   * puede acceder a todos los módulos.
   *
   * Usuario normal:
   * solamente recibe los módulos enviados por Laravel
   * dentro de usuario.modulos.
   */
  readonly modulosAsignadosCodigos = computed(() => {
    const user = this.usuario();

    if (!user) {
      return new Set<string>();
    }

    if (user.es_super_administrador) {
      return new Set(
        this.catalogoModulos.map((modulo) => modulo.codigo)
      );
    }

    return new Set(
      (user.modulos || []).map((modulo) => modulo.codigo)
    );
  });

  /**
   * Módulos que se mostrarán en el menú.
   *
   * Solamente aparecen los módulos que el usuario realmente tiene.
   */
  readonly menuItems = computed(() => {
    const asignados = this.modulosAsignadosCodigos();

    return this.catalogoModulos
      .filter((item) => asignados.has(item.codigo))
      .map((item) => ({
        ...item,
        habilitado: !item.proximamente,
        asignado: true,
      }));
  });

  private readonly rutaTitulos: Record<string, string> = {
    '/super-usuario/dashboard': 'Inicio',
    '/super-usuario/empresas': 'Gestión de Empresas',
    '/super-usuario/usuarios': 'Usuarios de Plataforma',
    '/super-usuario/configuracion': 'Configuración Global',

    '/panel/dashboard': 'Inicio',
    '/panel/agenda': 'Agenda Médica',
    '/panel/pacientes': 'Pacientes',
    '/panel/reportes': 'Reportes',
    '/panel/historias-clinicas': 'Historias Clínicas',
    '/panel/esquema-v-d': 'Vacunación y Desparasitación',
    '/panel/hospitalizacion': 'Hospitalización',
    '/panel/procedimientos': 'Procedimientos',
    '/panel/laboratorio': 'Laboratorio',
    '/panel/formulaciones': 'Formulaciones',
    '/panel/farmacia': 'Farmacia',
    '/panel/perfil': 'Mi Perfil',
  };

  constructor() {
    this.router.events
      .pipe(
        filter(
          (e): e is NavigationEnd =>
            e instanceof NavigationEnd
        )
      )
      .subscribe((e) => {

        const url = e.urlAfterRedirects;

        const titulo =
          this.rutaTitulos[url] ??
          Object.entries(this.rutaTitulos)
            .find(([ruta]) => url.startsWith(ruta))?.[1] ??
          'Inicio';

        this.tituloActual.set(titulo);
        this.sidebarAbierto.set(false);
      });
  }

  toggleSidebar(): void {
    this.sidebarAbierto.update((v) => !v);
  }

  toggleModulos(): void {
    this.modulosAbiertos.update((v) => !v);
  }

  cerrarSidebar(): void {
    this.sidebarAbierto.set(false);
  }
}