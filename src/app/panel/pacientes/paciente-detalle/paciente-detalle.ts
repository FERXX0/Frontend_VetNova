import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PacienteService } from '../../../core/services/paciente.service';
import { HistoriaClinicaService } from '../../../core/services/historia-clinica.service';
import { EsquemaVDService } from '../../../core/services/esquema-vd.service';
import { LaboratorioService } from '../../../core/services/laboratorio.service';
import { HospitalizacionService } from '../../../core/services/hospitalizacion.service';
import { ProcedimientoService } from '../../../core/services/procedimiento.service';
import { SessionService } from '../../../core/services/session.service';
import { Paciente } from '../../../core/models/paciente.model';
import { ConsultaClinica } from '../../../core/models/historia-clinica.model';
import { Desparasitacion, Vacuna } from '../../../core/models/esquema-vd.model';
import { SolicitudLaboratorio } from '../../../core/models/laboratorio.model';
import { Hospitalizacion } from '../../../core/models/hospitalizacion.model';
import { Procedimiento } from '../../../core/models/procedimiento.model';
import { AlcanceApi } from '../../../core/utils/alcance-api';

type PestanaHistorial = 'consultas' | 'esquema' | 'laboratorio' | 'hospitalizacion' | 'procedimientos';

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
  private readonly historiaService = inject(HistoriaClinicaService);
  private readonly esquemaService = inject(EsquemaVDService);
  private readonly laboratorioService = inject(LaboratorioService);
  private readonly hospitalizacionService = inject(HospitalizacionService);
  private readonly procedimientoService = inject(ProcedimientoService);
  private readonly session = inject(SessionService);

  readonly esVistaSuperUsuario = this.router.url.startsWith('/super-usuario');
  readonly rutaListado = this.esVistaSuperUsuario ? '/super-usuario/pacientes' : '/panel/pacientes';

  paciente = signal<Paciente | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  pestanaActiva = signal<PestanaHistorial>('consultas');
  consultas = signal<ConsultaClinica[]>([]);
  vacunas = signal<Vacuna[]>([]);
  desparasitaciones = signal<Desparasitacion[]>([]);
  solicitudesLab = signal<SolicitudLaboratorio[]>([]);
  hospitalizaciones = signal<Hospitalizacion[]>([]);
  procedimientos = signal<Procedimiento[]>([]);

  estadoPestana = signal<Record<PestanaHistorial, { cargando: boolean; error: string | null }>>({
    consultas: { cargando: false, error: null },
    esquema: { cargando: false, error: null },
    laboratorio: { cargando: false, error: null },
    hospitalizacion: { cargando: false, error: null },
    procedimientos: { cargando: false, error: null },
  });

  private readonly pestanasCargadas = new Set<PestanaHistorial>();

  readonly pestanasDisponibles = computed(() => {
    const todas: Array<{ id: PestanaHistorial; etiqueta: string; icono: string; modulo: string }> = [
      { id: 'consultas', etiqueta: 'Consultas y evolución', icono: 'clinical_notes', modulo: 'historias_clinicas' },
      { id: 'esquema', etiqueta: 'Vacunas y desparasitación', icono: 'vaccines', modulo: 'esquema_v_d' },
      { id: 'laboratorio', etiqueta: 'Exámenes de laboratorio', icono: 'biotech', modulo: 'laboratorio' },
      { id: 'hospitalizacion', etiqueta: 'Hospitalización', icono: 'local_hospital', modulo: 'hospitalizacion' },
      { id: 'procedimientos', etiqueta: 'Procedimientos', icono: 'healing', modulo: 'procedimientos' },
    ];
    return todas.filter((p) => this.tieneModulo(p.modulo));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPaciente(id);
    }
  }

  cargarPaciente(id: string): void {
    this.cargando.set(true);
    this.error.set(null);

    const alcance: AlcanceApi | undefined = this.esVistaSuperUsuario
      ? { plataforma: true, empresaId: null }
      : undefined;

    this.pacienteService.obtener(id, alcance).subscribe({
      next: (data) => {
        this.paciente.set(data);
        this.cargando.set(false);
        this.pestanasCargadas.clear();
        const primera = this.pestanasDisponibles()[0];
        if (primera) {
          this.seleccionarPestana(primera.id);
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.paciente.set(null);
        this.error.set(err?.error?.message || 'No se pudo cargar la ficha del paciente.');
      },
    });
  }

  seleccionarPestana(id: PestanaHistorial): void {
    this.pestanaActiva.set(id);
    this.cargarPestana(id);
  }

  cargarPestana(id: PestanaHistorial, forzar = false): void {
    const p = this.paciente();
    if (!p) return;
    if (!forzar && this.pestanasCargadas.has(id)) return;

    const alcance = this.alcanceHistorial(p);
    this.fijarEstado(id, { cargando: true, error: null });

    const ok = () => {
      this.pestanasCargadas.add(id);
      this.fijarEstado(id, { cargando: false, error: null });
    };
    const fallo = (mensaje: string) => (err: any) =>
      this.fijarEstado(id, { cargando: false, error: err?.error?.message || mensaje });

    if (id === 'consultas') {
      this.historiaService.obtener(p.id, alcance).subscribe({
        next: (h) => { this.consultas.set(h.consultas ?? []); ok(); },
        error: fallo('No se pudieron cargar las consultas del paciente.'),
      });
    } else if (id === 'esquema') {
      this.esquemaService.obtener(p.id, alcance).subscribe({
        next: (e) => {
          this.vacunas.set(e.vacunas ?? []);
          this.desparasitaciones.set(e.desparasitaciones ?? []);
          ok();
        },
        error: fallo('No se pudo cargar el esquema de vacunación y desparasitación.'),
      });
    } else if (id === 'laboratorio') {
      this.laboratorioService.listar({ paciente_id: p.id, per_page: 50 }, alcance).subscribe({
        next: (r) => { this.solicitudesLab.set(r.data ?? []); ok(); },
        error: fallo('No se pudieron cargar los exámenes de laboratorio.'),
      });
    } else if (id === 'hospitalizacion') {
      this.hospitalizacionService.listar({ paciente_id: p.id, per_page: 50 }, alcance).subscribe({
        next: (r) => { this.hospitalizaciones.set(r.data ?? []); ok(); },
        error: fallo('No se pudieron cargar las hospitalizaciones del paciente.'),
      });
    } else if (id === 'procedimientos') {
      this.procedimientoService.listar({ paciente_id: p.id, per_page: 50 }, alcance).subscribe({
        next: (r) => { this.procedimientos.set(r.data ?? []); ok(); },
        error: fallo('No se pudieron cargar los procedimientos del paciente.'),
      });
    }
  }

  formatearFecha(valor: string | null | undefined): string {
    if (!valor) return 'Sin fecha';
    const [anio, mes, dia] = valor.slice(0, 10).split('-').map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  estaVencida(fecha: string | null | undefined): boolean {
    if (!fecha) return false;
    const hoy = new Date();
    const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    return fecha.slice(0, 10) < iso;
  }

  private tieneModulo(codigo: string): boolean {
    if (this.session.esPersonalPlataforma()) return true;
    return (this.session.usuario()?.modulos ?? []).some((m) => m.codigo === codigo && m.activo !== false);
  }

  private alcanceHistorial(p: Paciente): AlcanceApi | undefined {
    return this.esVistaSuperUsuario
      ? { plataforma: true, empresaId: p.empresa_id ?? null }
      : undefined;
  }

  private fijarEstado(id: PestanaHistorial, parcial: { cargando?: boolean; error?: string | null }): void {
    this.estadoPestana.update((estado) => ({ ...estado, [id]: { ...estado[id], ...parcial } }));
  }
}
