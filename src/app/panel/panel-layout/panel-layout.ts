import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  NavigationEnd,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
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
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    UserMenuComponent
  ],
  templateUrl: './panel-layout.html',
  styleUrl: './panel-layout.scss',
})
export class PanelLayoutComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  sidebarAbierto = signal(false);

  readonly usuario = this.session.usuario;

  readonly empresaNombre = computed(
    () => this.usuario()?.empresa?.nombre || 'Mi Veterinaria'
  );

  constructor() {
    this.router.events
      .pipe(
        filter(
          (e): e is NavigationEnd => e instanceof NavigationEnd
        )
      )
      .subscribe(() => {
        this.sidebarAbierto.set(false);
      });
  }

  toggleSidebar(): void {
    this.sidebarAbierto.update((v) => !v);
  }

  cerrarSidebar(): void {
    this.sidebarAbierto.set(false);
  }

  // ==========================================================
  // CATÁLOGO DE MÓDULOS DEL PANEL DE LA VETERINARIA
  // ==========================================================

  readonly catalogoModulos: MenuItem[] = [
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
      icono: 'historia',
      proximamente: true
    },
    {
      codigo: 'esquema_v_d',
      nombre: 'Vacunación y Desp.',
      icono: 'vacuna',
      proximamente: true
    },
    {
      codigo: 'hospitalizacion',
      nombre: 'Hospitalización',
      icono: 'hospital',
      proximamente: true
    },
    {
      codigo: 'procedimientos',
      nombre: 'Procedimientos',
      icono: 'procedimiento',
      proximamente: true
    },
    {
      codigo: 'laboratorio',
      nombre: 'Laboratorio',
      icono: 'laboratorio',
      proximamente: true
    },
    {
      codigo: 'formulaciones',
      nombre: 'Formulaciones',
      icono: 'receta',
      proximamente: true
    },
    {
      codigo: 'farmacia',
      nombre: 'Farmacia',
      icono: 'farmacia',
      proximamente: true
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
    }
  ];

  // ==========================================================
  // CÓDIGOS DE MÓDULOS ASIGNADOS AL USUARIO
  // ==========================================================

  readonly modulosAsignadosCodigos = computed(() => {
    const user = this.usuario();

    if (!user) {
      return new Set<string>();
    }

    return new Set(
      (user.modulos || [])
        .filter((modulo) => modulo.activo !== false)
        .map((modulo) => modulo.codigo)
    );
  });

  // ==========================================================
  // MENÚ DEL USUARIO
  // SOLO APARECEN MÓDULOS ASIGNADOS
  // ==========================================================

  readonly menuItems = computed(() => {
    const asignados = this.modulosAsignadosCodigos();

    return this.catalogoModulos
      .filter((item) => asignados.has(item.codigo))
      .map((item) => ({
        ...item,
        habilitado: !item.proximamente,
        asignado: true
      }));
  });
}