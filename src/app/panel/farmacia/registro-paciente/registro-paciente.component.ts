import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlcanceApi } from '../../../core/utils/alcance-api';
import { Paciente } from '../../../core/models/paciente.model';
import { RegistroPacienteFarmacia } from '../../../core/models/farmacia.model';
import { FarmaciaService } from '../../../core/services/farmacia.service';
import { BuscadorPacienteComponent } from '../../../shared/components/buscador-paciente/buscador-paciente';

@Component({
  selector: 'app-farmacia-registro-paciente',
  standalone: true,
  imports: [CommonModule, BuscadorPacienteComponent],
  templateUrl: './registro-paciente.component.html',
  styleUrl: './registro-paciente.component.scss',
})
export class RegistroPacienteFarmaciaComponent implements OnChanges {
  @Input() alcance?: AlcanceApi;

  private farmaciaService = inject(FarmaciaService);

  readonly paciente = signal<Paciente | null>(null);
  readonly registro = signal<RegistroPacienteFarmacia | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alcance'] && !changes['alcance'].firstChange) {
      this.registro.set(null);
      this.paciente.set(null);
    }
  }

  alSeleccionarPaciente(p: Paciente): void {
    this.paciente.set(p);
    this.cargarRegistro(p.id);
  }

  limpiarPaciente(): void {
    this.paciente.set(null);
    this.registro.set(null);
    this.error.set(null);
  }

  private cargarRegistro(pacienteId: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.registro.set(null);

    this.farmaciaService.obtenerRegistroPaciente(pacienteId, this.alcance).subscribe({
      next: (data) => {
        this.registro.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al cargar el registro del paciente.');
        this.cargando.set(false);
      },
    });
  }
}
