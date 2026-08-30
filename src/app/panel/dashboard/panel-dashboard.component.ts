import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { CitaService } from '../../core/services/cita.service';
import { PacienteService } from '../../core/services/paciente.service';

@Component({
  selector: 'app-panel-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './panel-dashboard.component.html',
  styleUrls: ['./panel-dashboard.component.scss'],
  providers: [DatePipe]
})
export class PanelDashboardComponent implements OnInit {
  private sessionService = inject(SessionService);
  private citaService = inject(CitaService);
  private pacienteService = inject(PacienteService);
  private datePipe = inject(DatePipe);

  empresaNombre = signal<string>('Veterinaria');
  todayDate = signal<string>('');
  
  citasHoyCount = signal<number>(0);
  pacientesCount = signal<number>(0);
  proximaCitaHora = signal<string>('--:--');
  citasPendientesCount = signal<number>(0);

  citasRecientes = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    try {
      const usuario = this.sessionService.usuario();
      if (usuario?.empresa?.nombre) {
        this.empresaNombre.set(usuario.empresa.nombre);
      }
    } catch (e) {
      console.warn('sessionService.usuario() not implemented yet', e);
    }

    const today = new Date();
    this.todayDate.set(this.datePipe.transform(today, 'fullDate', '', 'es-ES') || today.toDateString());
    const todayStr = today.toISOString().split('T')[0];

    this.fetchData(todayStr);
  }

  private fetchData(date: string) {
    this.loading.set(true);
    
    // ⚠️ These endpoints may not exist yet, handling gracefully with try-catch and error callbacks
    try {
      this.citaService.listarPorFecha(date).subscribe({
        next: (citas: any[]) => {
          this.citasHoyCount.set(citas.length);
          const pendientes = citas.filter((c: any) => c.estado?.toLowerCase() === 'pendiente');
          this.citasPendientesCount.set(pendientes.length);
          
          if (pendientes.length > 0) {
            const sorted = [...pendientes].sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
            this.proximaCitaHora.set(sorted[0].hora || '--:--');
          }

          this.citasRecientes.set(citas.slice(0, 5));
          this.loading.set(false);
        },
        error: (err: any) => {
          console.warn('Error fetching citas, showing fallback', err);
          this.setupFallbackData();
          this.loading.set(false);
        }
      });
    } catch (e) {
      console.warn('CitaService methods not fully implemented, using fallback', e);
      this.setupFallbackData();
      this.loading.set(false);
    }
      
    try {
      this.pacienteService.listar().subscribe({
        next: (res: any) => {
          const total = res?.total ?? (Array.isArray(res?.data) ? res.data.length : (Array.isArray(res) ? res.length : 0));
          this.pacientesCount.set(total);
        },
        error: (err: any) => {
          console.warn('Error fetching pacientes', err);
          this.pacientesCount.set(0);
        }
      });
    } catch (e) {
      console.warn('PacienteService methods not fully implemented', e);
      this.pacientesCount.set(0);
    }
  }

  private setupFallbackData() {
    this.citasHoyCount.set(0);
    this.proximaCitaHora.set('--:--');
    this.citasPendientesCount.set(0);
    this.citasRecientes.set([]);
  }
}
