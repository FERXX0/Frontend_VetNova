import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { EmpresaService } from '../../core/services/empresa.service';

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

interface EstadisticaLegendItem {
  nombre: string;
  valor: number;
  color: string;
}

interface ReporteLabel {
  hora: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly empresaService = inject(EmpresaService);

  fechaActual = signal(this.formatearFecha(new Date()));

  // ---------- Tarjetas de acciones rápidas interactivas (arriba) ----------
  kpiCards = signal<KpiCard[]>([
    { icono: 'agregar', valor: 0, etiqueta: 'Agregar veterinaria', colorFondo: '#e8f1fd', colorIcono: '#3b82f6', ruta: '/super-usuario/empresas' },
    { icono: 'admin', valor: 0, etiqueta: 'Crear Administrador', colorFondo: '#fef6e0', colorIcono: '#f2b90c', ruta: '/super-usuario/usuarios' },
    { icono: 'suscripcion', valor: 0, etiqueta: 'Gestionar Suscripcion', colorFondo: '#fdeaea', colorIcono: '#e05a5a', ruta: '/super-usuario/empresas' },
    { icono: 'empresas', valor: 0, etiqueta: 'Ver empresas', colorFondo: '#e9f9ef', colorIcono: '#2fbf6e', ruta: '/super-usuario/empresas' },
  ]);

  // ---------- Tarjetas de estadísticas pequeñas ----------
  statCards = signal<StatCard[]>([
    { titulo: 'Veterinarias Registradas', valor: '0' },
    { titulo: 'Usuarios por mes', valor: '0' },
    { titulo: 'Uso plataforma', valor: '0m 0s' },
    { titulo: 'Crecimiento empresas', valor: '0%' },
    { titulo: 'Veterinarias activas', valor: '0%', conSparkline: true },
    { titulo: 'Distribucion planes', valor: '0%', conSparkline: true },
  ]);

  // ---------- Donut de transacciones ----------
  transaccionesPorcentaje = signal(0);

  estadisticasLegend = signal<EstadisticaLegendItem[]>([
    { nombre: 'Ventas', valor: 0, color: '#3b82f6' },
    { nombre: 'Distribucion', valor: 0, color: '#f59e0b' },
    { nombre: 'Retorno', valor: 0, color: '#ef4444' },
  ]);

  // ---------- Gráfica de reportes ----------
  hayDatosReporte = signal(false);
  puntosReporte = signal<number[]>([0, 0, 0, 0, 0, 0, 0]);

  reporteLabels = signal<ReporteLabel[]>([
    { hora: '10am' },
    { hora: '11am' },
    { hora: '12am' },
    { hora: '01am' },
    { hora: '02am' },
    { hora: '03am' },
    { hora: '04am' },
    { hora: '05am' },
    { hora: '06am' },
    { hora: '07am' },
  ]);

  ngOnInit(): void {
    this.cargarResumen();
    this.cargarEmpresas();
  }

  cargarResumen(): void {
    this.dashboardService.resumen().subscribe({
      next: (res) => {
        if (res) {
          const totalEmpresas = res.empresas?.total ?? 0;
          const empresasActivas = res.empresas?.activas ?? 0;
          const totalUsuarios = res.usuarios?.total ?? 0;
          const suscripcionesActivas = res.suscripciones?.activas ?? 0;
          const porcentajeActivas = totalEmpresas > 0 ? Math.round((empresasActivas / totalEmpresas) * 100) : 100;

          this.kpiCards.update((cards) =>
            cards.map((c) => {
              if (c.icono === 'agregar' || c.icono === 'empresas') return { ...c, valor: totalEmpresas };
              if (c.icono === 'admin') return { ...c, valor: totalUsuarios };
              if (c.icono === 'suscripcion') return { ...c, valor: suscripcionesActivas };
              return c;
            })
          );

          this.statCards.update((cards) =>
            cards.map((c) => {
              if (c.titulo === 'Veterinarias Registradas') return { ...c, valor: String(totalEmpresas) };
              if (c.titulo === 'Usuarios por mes') return { ...c, valor: String(totalUsuarios) };
              if (c.titulo === 'Veterinarias activas') return { ...c, valor: `${porcentajeActivas}%` };
              return c;
            })
          );
        }
      },
      error: () => {},
    });
  }

  cargarEmpresas(): void {
    this.empresaService.listar().subscribe({
      next: (res) => {
        const total = res.total ?? res.data.length;
        const activas = res.data.filter((e) => e.estado === 'activa').length;
        const porcentajeActivas = total > 0 ? Math.round((activas / total) * 100) : 0;

        this.kpiCards.update((cards) =>
          cards.map((c) => {
            if (c.icono === 'agregar' || c.icono === 'empresas') {
              return { ...c, valor: total };
            }
            return c;
          })
        );

        this.statCards.update((cards) =>
          cards.map((c) => {
            if (c.titulo === 'Veterinarias Registradas') {
              return { ...c, valor: String(total) };
            }
            if (c.titulo === 'Veterinarias activas') {
              return { ...c, valor: `${porcentajeActivas}%` };
            }
            return c;
          })
        );
      },
      error: () => {},
    });
  }

  puntosLinea(ancho: number, alto: number): string {
    const datos = this.puntosReporte();
    if (!datos.length) return '';

    const max = Math.max(...datos, 100);
    const pasoX = ancho / (datos.length - 1);

    return datos
      .map((valor, i) => {
        const x = i * pasoX;
        const y = alto - (valor / max) * alto;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  private formatearFecha(fecha: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(fecha);
  }
}
