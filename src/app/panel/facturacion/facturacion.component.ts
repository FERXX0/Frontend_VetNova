import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FacturacionService } from '../../core/services/facturacion.service';
import { Factura } from '../../core/models/factura.model';
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
  private readonly router = inject(Router);

  facturas = signal<Factura[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  pagina = signal(1);
  totalPaginas = signal(1);
  facturaSeleccionada = signal<Factura | null>(null);

  private alcance(): AlcanceApi | undefined {
    return this.router.url.startsWith('/super-usuario') ? { plataforma: true } : undefined;
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(page = 1): void {
    this.cargando.set(true);
    this.error.set(null);
    this.service.listar(this.alcance(), page).subscribe({
      next: (res) => {
        this.facturas.set(res.data || []);
        this.pagina.set(res.current_page || 1);
        this.totalPaginas.set(res.last_page || 1);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudieron cargar las facturas.');
        this.cargando.set(false);
      },
    });
  }

  verFactura(factura: Factura): void {
    this.service.obtener(factura.id, this.alcance()).subscribe({
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
