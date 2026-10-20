import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlcanceApi } from '../../../core/utils/alcance-api';
import { FormulacionFila, MedicamentoFormulacion } from '../../../core/models/formulacion.model';
import { FarmaciaService } from '../../../core/services/farmacia.service';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-farmacia-dispensacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dispensacion.component.html',
  styleUrl: './dispensacion.component.scss',
})
export class DispensacionFormulacionesComponent implements OnInit, OnChanges {
  @Input() alcance?: AlcanceApi;
  @Output() dispensado = new EventEmitter<void>();

  private farmaciaService = inject(FarmaciaService);
  private session = inject(SessionService);

  readonly esFarmacia = this.session.codigoRol() === 'farmacia';

  readonly formulaciones = signal<FormulacionFila[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly filtroDispensacion = signal<'pendientes' | 'completas' | 'todas'>('pendientes');
  readonly buscar = signal('');
  readonly paginaActual = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalRegistros = signal(0);

  readonly formulacionDetalle = signal<FormulacionFila | null>(null);
  readonly dispensandoLineaId = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alcance'] && !changes['alcance'].firstChange) {
      this.cargar();
    }
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.farmaciaService
      .obtenerFormulaciones(this.alcance, {
        dispensacion: this.filtroDispensacion(),
        buscar: this.buscar(),
        page: this.paginaActual(),
        per_page: 15,
      })
      .subscribe({
        next: (resp) => {
          this.formulaciones.set(resp.data);
          this.paginaActual.set(resp.current_page);
          this.totalPaginas.set(resp.last_page);
          this.totalRegistros.set(resp.total);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? 'Error al cargar las formulaciones.');
          this.cargando.set(false);
        },
      });
  }

  aplicarFiltros(): void {
    this.paginaActual.set(1);
    this.cargar();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      this.cargar();
    }
  }

  abrirDetalle(formulacion: FormulacionFila): void {
    this.formulacionDetalle.set(formulacion);
  }

  cerrarDetalle(): void {
    this.formulacionDetalle.set(null);
    this.dispensandoLineaId.set(null);
  }

  dispensar(formulacion: FormulacionFila, linea: MedicamentoFormulacion): void {
    if (!linea.id || this.dispensandoLineaId()) {
      return;
    }

    this.dispensandoLineaId.set(linea.id);

    this.farmaciaService.dispensar(formulacion.id, linea.id, this.alcance).subscribe({
      next: () => {
        this.dispensandoLineaId.set(null);
        this.cerrarDetalle();
        this.cargar();
        this.dispensado.emit();
      },
      error: (err) => {
        alert(err.error?.message ?? 'Error al dispensar el medicamento.');
        this.dispensandoLineaId.set(null);
      },
    });
  }

  pendientesDe(formulacion: FormulacionFila): MedicamentoFormulacion[] {
    return (formulacion.medicamentos ?? []).filter((m) => !m.dispensado);
  }

  dispensadosDe(formulacion: FormulacionFila): MedicamentoFormulacion[] {
    return (formulacion.medicamentos ?? []).filter((m) => m.dispensado);
  }
}
