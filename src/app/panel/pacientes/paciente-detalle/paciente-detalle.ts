import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PacienteService } from '../../../core/services/paciente.service';
import { Paciente } from '../../../core/models/paciente.model';
import { AlcanceApi } from '../../../core/utils/alcance-api';

@Component({
  selector: 'app-paciente-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './paciente-detalle.html',
  styleUrl: './paciente-detalle.scss',
})
export class PacienteDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pacienteService = inject(PacienteService);

  readonly rutaListado = this.router.url.startsWith('/super-usuario')
    ? '/super-usuario/pacientes'
    : '/panel/pacientes';

  paciente = signal<Paciente | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPaciente(id);
    }
  }

  cargarPaciente(id: string): void {
    this.cargando.set(true);
    this.error.set(null);

    const alcance: AlcanceApi | undefined = this.router.url.startsWith('/super-usuario')
      ? { plataforma: true, empresaId: null }
      : undefined;

    this.pacienteService.obtener(id, alcance).subscribe({
      next: (data) => {
        this.paciente.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.paciente.set(null);
        this.error.set(err?.error?.message || 'No se pudo cargar la ficha del paciente.');
      },
    });
  }
}
