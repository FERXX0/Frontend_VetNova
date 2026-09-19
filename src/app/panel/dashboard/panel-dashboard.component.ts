import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  CommonModule,
  DatePipe,
  registerLocaleData
} from '@angular/common';

import localeEs from '@angular/common/locales/es-CO';

import { RouterLink } from '@angular/router';

import { SessionService } from '../../core/services/session.service';
import { CitaService } from '../../core/services/cita.service';
import { PacienteService } from '../../core/services/paciente.service';

registerLocaleData(localeEs);

@Component({
  selector: 'app-panel-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './panel-dashboard.component.html',
  styleUrls: ['./panel-dashboard.component.scss'],
  providers: [DatePipe]
})
export class PanelDashboardComponent implements OnInit {

  private readonly sessionService = inject(SessionService);
  private readonly citaService = inject(CitaService);
  private readonly pacienteService = inject(PacienteService);
  private readonly datePipe = inject(DatePipe);

  // ==========================================================
  // USUARIO ACTUAL
  // ==========================================================

  readonly usuario = this.sessionService.usuario;

  readonly empresaNombre = computed(
    () => this.usuario()?.empresa?.nombre || 'Veterinaria'
  );

  // ==========================================================
  // MÓDULOS ASIGNADOS
  // ==========================================================

  readonly modulosAsignados = computed(() => {
    const usuario = this.usuario();

    if (!usuario) {
      return new Set<string>();
    }

    return new Set(
      (usuario.modulos || [])
        .filter((modulo) => modulo.activo !== false)
        .map((modulo) => modulo.codigo)
    );
  });

  /**
   * Permite saber si el usuario tiene un módulo determinado.
   */
  tieneModulo(codigo: string): boolean {
    return this.modulosAsignados().has(codigo);
  }

  // ==========================================================
  // FECHA
  // ==========================================================

  todayDate = signal<string>('');

  // ==========================================================
  // DATOS DE CITAS
  // ==========================================================

  citasHoyCount = signal<number>(0);
  proximaCitaHora = signal<string>('--:--');
  citasPendientesCount = signal<number>(0);

  citasRecientes = signal<any[]>([]);

  // ==========================================================
  // DATOS DE PACIENTES
  // ==========================================================

  pacientesCount = signal<number>(0);

  // ==========================================================
  // ESTADO
  // ==========================================================

  loadingCitas = signal<boolean>(false);
  loadingPacientes = signal<boolean>(false);

  readonly loading = computed(
    () => this.loadingCitas() || this.loadingPacientes()
  );

  ngOnInit(): void {
    const today = new Date();

    this.todayDate.set(
      this.datePipe.transform(
        today,
        'fullDate',
        '',
        'es-CO'
      ) || today.toDateString()
    );

    const todayStr = today.toISOString().split('T')[0];

    const tieneCitas = this.tieneModulo('citas');
    const tienePacientes = this.tieneModulo('clientes_pacientes');

    if (tieneCitas) {
      this.cargarCitas(todayStr);
    } else {
      this.resetearDatosCitas();
    }

    if (tienePacientes) {
      this.cargarPacientes();
    } else {
      this.pacientesCount.set(0);
    }

    if (!tieneCitas && !tienePacientes) {
      this.loadingCitas.set(false);
      this.loadingPacientes.set(false);
    }
  }

  // ==========================================================
  // CITAS
  // ==========================================================

  private cargarCitas(date: string): void {

      this.loadingCitas.set(true);

      try {

        this.citaService.listarPorFecha(date).subscribe({

          next: (citas: any[]) => {

            this.citasHoyCount.set(citas.length);

            const pendientes = citas.filter(
              (cita: any) =>
                cita.estado?.toLowerCase() === 'pendiente'
            );

            this.citasPendientesCount.set(
              pendientes.length
            );

            if (pendientes.length > 0) {

              const sorted = [...pendientes].sort(
                (a, b) =>
                  (a.hora || '').localeCompare(
                    b.hora || ''
                  )
              );

              this.proximaCitaHora.set(
                sorted[0].hora || '--:--'
              );

            } else {

              this.proximaCitaHora.set('--:--');

            }

            this.citasRecientes.set(
              citas.slice(0, 5)
            );

            this.loadingCitas.set(false);
          },

          error: (err: any) => {

            console.warn(
              'Error obteniendo citas',
              err
            );

            this.resetearDatosCitas();

            this.loadingCitas.set(false);
          }

        });

      } catch (e) {

        console.warn(
          'CitaService no disponible',
          e
        );

        this.resetearDatosCitas();

        this.loadingCitas.set(false);
      }
    }

    private resetearDatosCitas(): void {

      this.citasHoyCount.set(0);
      this.proximaCitaHora.set('--:--');
      this.citasPendientesCount.set(0);
      this.citasRecientes.set([]);
    }

    // ==========================================================
    // PACIENTES
    // ==========================================================

  private cargarPacientes(): void {

    this.loadingPacientes.set(true);

    try {

      this.pacienteService.listar().subscribe({

        next: (res: any) => {

          const total =
            res?.total ??
            (
              Array.isArray(res?.data)
                ? res.data.length
                : Array.isArray(res)
                  ? res.length
                  : 0
            );

          this.pacientesCount.set(total);

          this.loadingPacientes.set(false);
        },

        error: (err: any) => {

          console.warn(
            'Error obteniendo pacientes',
            err
          );

          this.pacientesCount.set(0);
          this.loadingPacientes.set(false);
        }

      });

    } catch (e) {

      console.warn(
        'PacienteService no disponible',
        e
      );

      this.pacientesCount.set(0);
      this.loadingPacientes.set(false);
    }
  }
}