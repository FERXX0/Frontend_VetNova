import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FacturacionService } from '../../core/services/facturacion.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Factura } from '../../core/models/factura.model';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import { AlcanceApi } from '../../core/utils/alcance-api';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facturacion.component.html',
  styleUrl: './facturacion.component.scss',
})
export class FacturacionComponent implements OnInit {
  private readonly service = inject(FacturacionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly router = inject(Router);

  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));
  readonly empresasDisponibles = signal<EmpresaOpcion[]>([]);
  readonly filtroEmpresa = signal('');
  readonly busqueda = signal('');
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly total = signal(0);

  facturas = signal<Factura[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  pagina = signal(1);
  totalPaginas = signal(1);
  facturaSeleccionada = signal<Factura | null>(null);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly hayFiltros = computed(
    () => !!(this.busqueda() || this.desde() || this.hasta() || this.filtroEmpresa())
  );

  private alcance(): AlcanceApi | undefined {
    return this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: this.filtroEmpresa() || null }
      : undefined;
  }

  ngOnInit(): void {
    if (this.esVistaSuperUsuario()) {
      this.empresaService.listarOpciones().subscribe({
        next: (res) => this.empresasDisponibles.set(res || []),
        error: () => {},
      });
    }
    this.cargar();
  }

  cargar(page = 1): void {
    if (this.desde() && this.hasta() && this.hasta() < this.desde()) {
      this.error.set('La fecha final no puede ser anterior a la fecha inicial.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    this.service
      .listar(
        this.alcance(),
        {
          buscar: this.busqueda(),
          desde: this.desde(),
          hasta: this.hasta(),
        },
        page
      )
      .subscribe({
        next: (res) => {
          this.facturas.set(res.data || []);
          this.pagina.set(res.current_page || 1);
          this.totalPaginas.set(res.last_page || 1);
          this.total.set(res.total ?? 0);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se pudieron cargar las facturas.');
          this.cargando.set(false);
        },
      });
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.cargar(1), 350);
  }

  cambiarDesde(valor: string): void {
    this.desde.set(valor);
    this.cargar(1);
  }

  cambiarHasta(valor: string): void {
    this.hasta.set(valor);
    this.cargar(1);
  }

  onEmpresaChange(valor: string): void {
    this.filtroEmpresa.set(valor);
    this.cargar(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEmpresa.set('');
    this.desde.set('');
    this.hasta.set('');
    this.cargar(1);
  }

  verFactura(factura: Factura): void {
    const alcanceDetalle: AlcanceApi | undefined = this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: factura.empresa_id }
      : undefined;

    this.service.obtener(factura.id, alcanceDetalle).subscribe({
      next: (detalle) => this.facturaSeleccionada.set(detalle),
      error: () => this.facturaSeleccionada.set(factura),
    });
  }

  cerrarDetalle(): void {
    this.facturaSeleccionada.set(null);
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }
}
