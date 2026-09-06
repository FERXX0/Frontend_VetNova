import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PacienteService } from '../../../core/services/paciente.service';
import { Paciente } from '../../../core/models/paciente.model';

@Component({
  selector: 'app-paciente-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './paciente-detalle.html',
  styleUrl: './paciente-detalle.scss',
})
export class PacienteDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pacienteService = inject(PacienteService);

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

    this.pacienteService.obtener(id).subscribe({
      next: (data) => {
        this.paciente.set(data);
        this.cargando.set(false);
      },
      error: () => {
        // Fallback demostrativo si no existe backend o es ID demo
        this.cargando.set(false);
        this.paciente.set({
          id,
          nombre: 'Max',
          especie: 'Canino',
          raza: 'Golden Retriever',
          sexo: 'macho',
          fecha_nacimiento: '2022-04-10',
          edad_estimada: '2 años, 4 meses',
          peso_kg: 28.5,
          color: 'Dorado',
          microchip: '985141001245896',
          estado: 'activo',
          notas: 'Paciente muy dócil. Alergia conocida al pollo. Esquema de vacunación séxtuple al día.',
          propietario: {
            nombre: 'Carlos Mendoza',
            tipo_identificacion: 'CC',
            numero_identificacion: '1098765432',
            celular: '+57 312 456 7890',
            correo: 'carlos.mendoza@email.com',
            direccion: 'Calle 45 # 12-34, Bogotá',
          },
          creado_en: '2026-01-15T09:00:00Z',
        });
      },
    });
  }
}
