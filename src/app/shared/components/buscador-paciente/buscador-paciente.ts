import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { AlcanceApi } from '../../../core/utils/alcance-api';
import { Paciente } from '../../../core/models/paciente.model';
import { PacienteService } from '../../../core/services/paciente.service';

@Component({
  selector: 'app-buscador-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscador-paciente.html',
  styleUrl: './buscador-paciente.scss',
})
export class BuscadorPacienteComponent implements OnInit, OnDestroy {
  @Input() alcance?: AlcanceApi;
  @Input() placeholder = 'Buscar paciente por nombre o propietario...';

  @Output() pacienteSeleccionado = new EventEmitter<Paciente>();

  private pacienteService = inject(PacienteService);
  private destruir$ = new Subject<void>();
  private busqueda$ = new Subject<string>();

  readonly termino = signal('');
  readonly resultados = signal<Paciente[]>([]);
  readonly cargando = signal(false);
  readonly abierto = signal(false);

  ngOnInit(): void {
    this.busqueda$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((buscar) => {
          if (!buscar.trim()) {
            this.resultados.set([]);
            this.cargando.set(false);
            return [];
          }
          this.cargando.set(true);
          return this.pacienteService.listar({ buscar, per_page: 8 }, this.alcance);
        }),
        takeUntil(this.destruir$)
      )
      .subscribe({
        next: (resp) => {
          this.resultados.set(resp.data ?? []);
          this.cargando.set(false);
          this.abierto.set(true);
        },
        error: () => {
          this.cargando.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
  }

  alEscribir(valor: string): void {
    this.termino.set(valor);
    this.busqueda$.next(valor);
    if (!valor.trim()) {
      this.abierto.set(false);
    }
  }

  seleccionar(paciente: Paciente): void {
    this.termino.set('');
    this.resultados.set([]);
    this.abierto.set(false);
    this.pacienteSeleccionado.emit(paciente);
  }

  cerrarLista(): void {
    setTimeout(() => {
      this.abierto.set(false);
    }, 180);
  }
}
