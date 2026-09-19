import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DashboardService } from '../../core/services/dashboard.service';

import {
  PlanDashboard,
  ResumenDashboard
} from '../../core/models/dashboard.model';

interface KpiCard {
  icono: 'agregar' | 'admin' | 'suscripcion' | 'empresas';
  valor: number;
  etiqueta: string;
  colorFondo: string;
  colorIcono: string;
  ruta: string;
}

interface StatCard {
  titulo: string;
  valor: string;
  conSparkline?: boolean;
}

interface ReporteLabel {
  hora: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {

  private readonly dashboardService = inject(DashboardService);

  // =========================================================
  // PLANES
  // =========================================================

  planes = signal<PlanDashboard[]>([]);

  planSeleccionado = signal<PlanDashboard | null>(null);

  modalPlanAbierto = signal(false);

  // =========================================================
  // FECHA ACTUAL
  // =========================================================

  fechaActual = signal(
    this.formatearFecha(new Date())
  );

  // =========================================================
  // KPI SUPERIORES
  // =========================================================

  kpiCards = signal<KpiCard[]>([
    {
      icono: 'agregar',
      valor: 0,
      etiqueta: 'Agregar veterinaria',
      colorFondo: '#e8f1fd',
      colorIcono: '#3b82f6',
      ruta: '/super-usuario/empresas'
    },
    {
      icono: 'admin',
      valor: 0,
      etiqueta: 'Crear Administrador',
      colorFondo: '#fef6e0',
      colorIcono: '#f2b90c',
      ruta: '/super-usuario/usuarios'
    },
    {
      icono: 'suscripcion',
      valor: 0,
      etiqueta: 'Gestionar Suscripción',
      colorFondo: '#fdeaea',
      colorIcono: '#e05a5a',
      ruta: '/super-usuario/empresas'
    },
    {
      icono: 'empresas',
      valor: 0,
      etiqueta: 'Ver empresas',
      colorFondo: '#e9f9ef',
      colorIcono: '#2fbf6e',
      ruta: '/super-usuario/empresas'
    }
  ]);

  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  statCards = signal<StatCard[]>([
    {
      titulo: 'Veterinarias Registradas',
      valor: '0'
    },
    {
      titulo: 'Usuarios por mes',
      valor: '0'
    },
    {
      titulo: 'Uso plataforma',
      valor: '0m 0s'
    },
    {
      titulo: 'Crecimiento empresas',
      valor: '0%'
    },
    {
      titulo: 'Veterinarias activas',
      valor: '0%',
      conSparkline: true
    },
    {
      titulo: 'Distribución planes',
      valor: '0%',
      conSparkline: true
    }
  ]);

  // =========================================================
  // GRÁFICA DE REPORTES
  // =========================================================

  hayDatosReporte = signal(false);

  puntosReporte = signal<number[]>([
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ]);

  reporteLabels = signal<ReporteLabel[]>([
    { hora: '10am' },
    { hora: '11am' },
    { hora: '12pm' },
    { hora: '01pm' },
    { hora: '02pm' },
    { hora: '03pm' },
    { hora: '04pm' },
    { hora: '05pm' },
    { hora: '06pm' },
    { hora: '07pm' }
  ]);

  // =========================================================
  // INICIO
  // =========================================================

  ngOnInit(): void {
    this.cargarResumen();
  }

  // =========================================================
  // RESUMEN DEL DASHBOARD
  // =========================================================

  cargarResumen(): void {

    this.dashboardService.resumen().subscribe({

      next: (res: ResumenDashboard) => {

        if (!res) {
          return;
        }

        // -----------------------------------------------------
        // EMPRESAS
        // -----------------------------------------------------

        const totalEmpresas =
          res.empresas?.total ?? 0;

        const empresasActivas =
          res.empresas?.activas ?? 0;

        const nuevasEmpresas =
          res.empresas?.nuevas_este_mes ?? 0;

        // -----------------------------------------------------
        // USUARIOS
        // -----------------------------------------------------

        const totalUsuarios =
          res.usuarios?.total ?? 0;

        // -----------------------------------------------------
        // SUSCRIPCIONES
        // -----------------------------------------------------

        const suscripcionesActivas =
          res.suscripciones?.activas ?? 0;

        // -----------------------------------------------------
        // PLANES
        // -----------------------------------------------------

        const planes =
          res.planes ?? [];

        this.planes.set(planes);

        // -----------------------------------------------------
        // PORCENTAJE EMPRESAS ACTIVAS
        // -----------------------------------------------------

        const porcentajeActivas =
          totalEmpresas > 0
            ? Math.round(
                (empresasActivas / totalEmpresas) * 100
              )
            : 0;

        // -----------------------------------------------------
        // DISTRIBUCIÓN DE PLANES
        // -----------------------------------------------------

        const empresasConPlan =
          planes.reduce(
            (
              total: number,
              plan: PlanDashboard
            ) => {
              return total +
                (Number(plan.empresas_suscritas) || 0);
            },
            0
          );

        const porcentajePlanes =
          totalEmpresas > 0
            ? Math.round(
                (empresasConPlan / totalEmpresas) * 100
              )
            : 0;

        // -----------------------------------------------------
        // CRECIMIENTO EMPRESAS
        // -----------------------------------------------------

        const porcentajeCrecimiento =
          totalEmpresas > 0
            ? Math.round(
                (nuevasEmpresas / totalEmpresas) * 100
              )
            : 0;

        // -----------------------------------------------------
        // ACTUALIZAR KPI
        // -----------------------------------------------------

        this.kpiCards.update((cards) =>
          cards.map((card) => {

            switch (card.icono) {

              case 'agregar':
              case 'empresas':
                return {
                  ...card,
                  valor: totalEmpresas
                };

              case 'admin':
                return {
                  ...card,
                  valor: totalUsuarios
                };

              case 'suscripcion':
                return {
                  ...card,
                  valor: suscripcionesActivas
                };

              default:
                return card;
            }

          })
        );

        // -----------------------------------------------------
        // ACTUALIZAR ESTADÍSTICAS
        // -----------------------------------------------------

        this.statCards.update((cards) =>
          cards.map((card) => {

            switch (card.titulo) {

              case 'Veterinarias Registradas':
                return {
                  ...card,
                  valor: String(totalEmpresas)
                };

              case 'Usuarios por mes':
                return {
                  ...card,
                  valor: String(totalUsuarios)
                };

              case 'Crecimiento empresas':
                return {
                  ...card,
                  valor: `${porcentajeCrecimiento}%`
                };

              case 'Veterinarias activas':
                return {
                  ...card,
                  valor: `${porcentajeActivas}%`
                };

              case 'Distribución planes':
                return {
                  ...card,
                  valor: `${porcentajePlanes}%`
                };

              default:
                return card;
            }

          })
        );

      },

      error: (error: unknown) => {

        console.error(
          'Error cargando resumen del dashboard:',
          error
        );

      }

    });
  }

  // =========================================================
  // MODAL DETALLE DEL PLAN
  // =========================================================

  abrirDetallePlan(
    plan: PlanDashboard
  ): void {

    this.planSeleccionado.set(plan);

    this.modalPlanAbierto.set(true);
  }

  cerrarDetallePlan(): void {

    this.modalPlanAbierto.set(false);

    this.planSeleccionado.set(null);
  }

  // =========================================================
  // FORMATEAR MONEDA
  // =========================================================

  formatearMoneda(
    valor: number | null | undefined
  ): string {

    if (
      valor === null ||
      valor === undefined
    ) {
      return '$ 0';
    }

    return new Intl.NumberFormat(
      'es-CO',
      {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }
    ).format(valor);
  }

  // =========================================================
  // COLOR DE LOS PLANES
  // =========================================================

  obtenerColorPlan(
    indice: number
  ): string {

    const colores = [
      'azul',
      'morado',
      'verde',
      'naranja',
      'rojo'
    ];

    return colores[
      indice % colores.length
    ];
  }

  // =========================================================
  // PUNTOS DE LA GRÁFICA
  // =========================================================

  puntosLinea(
    ancho: number,
    alto: number
  ): string {

    const datos =
      this.puntosReporte();

    if (
      !datos.length ||
      datos.length < 2
    ) {
      return '';
    }

    const max =
      Math.max(...datos, 100);

    const pasoX =
      ancho / (datos.length - 1);

    return datos
      .map((valor, indice) => {

        const x =
          indice * pasoX;

        const y =
          alto -
          (valor / max) * alto;

        return `${x.toFixed(1)},${y.toFixed(1)}`;

      })
      .join(' ');
  }

  // =========================================================
  // FECHA
  // =========================================================

  private formatearFecha(
    fecha: Date
  ): string {

    return new Intl.DateTimeFormat(
      'es-CO',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    ).format(fecha);
  }
}