import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SessionService } from '../../core/services/session.service';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu';

interface MenuItem {
  codigo: string;
  nombre: string;
  ruta?: string;
  icono: string;
  proximamente?: boolean;
}

@Component({
  selector: 'app-panel-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, UserMenuComponent],
  templateUrl: './panel-layout.html',
  styleUrl: './panel-layout.scss',
})
export class PanelLayoutComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  sidebarAbierto = signal(false);

  readonly usuario = this.session.usuario;
  readonly empresaNombre = computed(() => this.usuario()?.empresa?.nombre || 'Mi Veterinaria');

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.sidebarAbierto.set(false);
    });
  }

  toggleSidebar(): void {
    this.sidebarAbierto.update((v) => !v);
  }

  cerrarSidebar(): void {
    this.sidebarAbierto.set(false);
  }

  // Catálogo completo con sus rutas e iconos
  readonly catalogoModulos: MenuItem[] = [
    { codigo: 'citas', nombre: 'Agenda Médica', ruta: '/panel/agenda', icono: 'agenda' },
    { codigo: 'clientes_pacientes', nombre: 'Pacientes', ruta: '/panel/pacientes', icono: 'pacientes' },
    { codigo: 'usuarios', nombre: 'Usuarios', ruta: '/panel/usuarios', icono: 'usuarios' },
    { codigo: 'reportes', nombre: 'Reportes', ruta: '/panel/reportes', icono: 'reportes' },
    { codigo: 'historias_clinicas', nombre: 'Historias Clínicas', icono: 'historia', proximamente: true },
    { codigo: 'esquema_v_d', nombre: 'Vacunación y Desp.', icono: 'vacuna', proximamente: true },
    { codigo: 'hospitalizacion', nombre: 'Hospitalización', icono: 'hospital', proximamente: true },
    { codigo: 'procedimientos', nombre: 'Procedimientos', icono: 'procedimiento', proximamente: true },
    { codigo: 'laboratorio', nombre: 'Laboratorio', icono: 'laboratorio', proximamente: true },
    { codigo: 'formulaciones', nombre: 'Formulaciones', icono: 'receta', proximamente: true },
    { codigo: 'farmacia', nombre: 'Farmacia', icono: 'farmacia', proximamente: true },
    { codigo: 'servicios', nombre: 'Servicios', icono: 'servicios', proximamente: true },
    { codigo: 'facturacion', nombre: 'Facturación', icono: 'facturacion', proximamente: true },
    { codigo: 'configuracion', nombre: 'Configuración', ruta: '/panel/perfil', icono: 'configuracion' },
  ];

  /** Códigos asignados al usuario actual */
  readonly modulosAsignadosCodigos = computed(() => {
    const user = this.usuario();
    if (!user) return new Set<string>();
    if (user.es_super_administrador) {
      return new Set(this.catalogoModulos.map((m) => m.codigo));
    }
    return new Set((user.modulos || []).map((m) => m.codigo));
  });

  /** Lista de ítems a renderizar en el sidebar */
  readonly menuItems = computed(() => {
    const asignados = this.modulosAsignadosCodigos();
    return this.catalogoModulos.map((item) => ({
      ...item,
      // Si el código está en modulos asignados o es superadmin, se habilita (a menos que sea 'proximamente')
      habilitado: (asignados.has(item.codigo) || item.codigo === 'usuarios' || item.codigo === 'reportes') && !item.proximamente,
      asignado: asignados.has(item.codigo) || item.codigo === 'usuarios' || item.codigo === 'reportes',
    }));
  });
}
