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

  readonly tituloActual = signal('Dashboard');
  readonly usuario = this.session.usuario;



  readonly navPrincipal: NavItem[] = [
    {
      ruta: '/super-usuario/dashboard',
      nombre: 'Dashboard',
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

  readonly catalogoModulos = [
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
      codigo: 'usuarios',
      nombre: 'Usuarios',
      ruta: '/panel/usuarios',
      icono: 'usuarios'
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
      icono: 'historia',
    },
    {
      codigo: 'esquema_v_d',
      nombre: 'Vacunación y Desp.',
      icono: 'vacuna',
      ruta: '/panel/esquema-v-d',

    },
    {
      codigo: 'hospitalizacion',
      nombre: 'Hospitalización',
      icono: 'hospital',
      ruta:'/panel/hospitalizacion',
    },
    {
      codigo: 'procedimientos',
      nombre: 'Procedimientos',
      icono: 'procedimiento',
      ruta: '/panel/procedimientos'
    },
    {
      codigo: 'laboratorio',
      nombre: 'Laboratorio',
      icono: 'laboratorio',
      ruta: '/panel/laboratorio'
    },
    {
      codigo: 'formulaciones',
      nombre: 'Formulaciones',
      icono: 'receta',
      ruta: '/panel/formulaciones'
    },
    {
      codigo: 'farmacia',
      nombre: 'Farmacia',
      icono: 'farmacia',
      ruta: '/panel/farmacia'
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

  readonly modulosAsignadosCodigos = computed(() => {
  const user = this.usuario();

  if (!user) {
    return new Set<string>();
  }

  // Super Admin puede acceder a todos los módulos
  if (user.es_super_administrador) {
    return new Set(
      this.catalogoModulos.map((modulo) => modulo.codigo)
    );
  }

  // Usuario normal: solamente los módulos asignados
  return new Set(
    (user.modulos || []).map((modulo) => modulo.codigo)
  );
});

readonly menuItems = computed(() => {
  const asignados = this.modulosAsignadosCodigos();

  return this.catalogoModulos.map((item) => ({
    ...item,
    habilitado:
      asignados.has(item.codigo) &&
      !item.proximamente,
    asignado:
      asignados.has(item.codigo),
  }));
});

private readonly rutaTitulos: Record<string, string> = {
  '/super-usuario/dashboard': 'Dashboard de Plataforma',
  '/super-usuario/empresas': 'Gestión de Empresas',
  '/super-usuario/usuarios': 'Usuarios de Plataforma',
  '/super-usuario/configuracion': 'Configuración Global',

  '/panel/agenda': 'Agenda Médica',
  '/panel/pacientes': 'Pacientes',
  '/panel/usuarios': 'Usuarios',
  '/panel/reportes': 'Reportes',
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
          'Dashboard';

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