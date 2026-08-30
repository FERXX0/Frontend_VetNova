import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
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
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, UserMenuComponent],
  templateUrl: './super-usuario-layout.html',
  styleUrl: './super-usuario-layout.scss',
})
export class SuperUsuarioLayoutComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  sidebarAbierto = signal(false);
  readonly tituloActual = signal('Dashboard');

  readonly navPrincipal: NavItem[] = [
    { ruta: '/super-usuario/dashboard', nombre: 'Dashboard', icono: 'dashboard' },
    { ruta: '/super-usuario/empresas', nombre: 'Empresas Registradas', icono: 'veterinarias' },
    { ruta: '/super-usuario/usuarios', nombre: 'Usuarios', icono: 'usuarios' },
    { ruta: '/super-usuario/monitoreo', nombre: 'Monitoreo', icono: 'monitoreo' },
    { ruta: '/super-usuario/soporte', nombre: 'Soporte', icono: 'soporte' },
    { ruta: '/super-usuario/reportes', nombre: 'Reportes Globales', icono: 'reportes' },
    { ruta: '/super-usuario/configuracion', nombre: 'Configuración Global', icono: 'configuracion' },
  ];

  private readonly rutaTitulos: Record<string, string> = {
    '/super-usuario/dashboard': 'Dashboard de Plataforma',
    '/super-usuario/empresas': 'Gestión de Empresas',
    '/super-usuario/usuarios': 'Usuarios de Plataforma',
    '/super-usuario/monitoreo': 'Monitoreo del Sistema',
    '/super-usuario/soporte': 'Centro de Soporte',
    '/super-usuario/reportes': 'Reportes Globales',
    '/super-usuario/configuracion': 'Configuración Global',
    '/super-usuario/perfil': 'Mi Perfil',
  };

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      const url = e.urlAfterRedirects;
      const titulo = this.rutaTitulos[url] ??
        Object.entries(this.rutaTitulos).find(([ruta]) => url.startsWith(ruta))?.[1] ??
        'Dashboard';
      this.tituloActual.set(titulo);
      this.sidebarAbierto.set(false);
    });
  }

  toggleSidebar(): void {
    this.sidebarAbierto.update((v) => !v);
  }

  cerrarSidebar(): void {
    this.sidebarAbierto.set(false);
  }
}
