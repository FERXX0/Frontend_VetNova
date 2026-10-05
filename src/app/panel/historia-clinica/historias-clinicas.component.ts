import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HistoriaClinicaService } from '../../core/services/historia-clinica.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { SessionService } from '../../core/services/session.service';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import { EstadoPaciente } from '../../core/models/paciente.model';
import { Profesional } from '../../core/models/cita.model';
import { AlcanceApi } from '../../core/utils/alcance-api';
import {
  ConsultaClinica,
  ConsultaPayload,
  DatosGeneralesPayload,
  HistoriaDetalle,
  HistoriaResumen,
  ResumenHistorias,
} from '../../core/models/historia-clinica.model';

interface FormularioConsulta {
  fecha: string;
  veterinario_id: string;
  motivo: string;
  peso_kg: string;
  temperatura_c: string;
  diagnostico: string;
  tratamiento: string;
  medicamentos: string;
  observaciones: string;
  evolucion: string;
}

@Component({
  selector: 'app-historias-clinicas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historias-clinicas.component.html',
  styleUrls: ['./historias-clinicas.component.scss'],
})
export class HistoriasClinicasComponent implements OnInit {
  private readonly historiaClinicaService = inject(HistoriaClinicaService);
  private readonly empresaService = inject(EmpresaService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  empresasDisponibles = signal<EmpresaOpcion[]>([]);
  filtroEmpresa = signal<string>('');

  historias = signal<HistoriaResumen[]>([]);
  resumen = signal<ResumenHistorias | null>(null);
  paginaActual = signal<number>(1);
  totalPaginas = signal<number>(1);
  total = signal<number>(0);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  historiaSeleccionada = signal<HistoriaDetalle | null>(null);
  cargandoDetalle = signal<boolean>(false);
  profesionales = signal<Profesional[]>([]);

  modalConsultaAbierto = signal<boolean>(false);
  modalHistoriaAbierto = signal<boolean>(false);
  modoEdicionConsulta = signal<boolean>(false);

  pacienteConsulta = signal<{ id: string; nombre: string; empresa_id: string } | null>(null);
  consultaEditandoId = signal<string | null>(null);

  busqueda = signal<string>('');
  filtroEspecie = signal<string>('Todos');
  filtroEstado = signal<string>('Todos');

  mensaje = signal<string>('');
  tipoMensaje = signal<'success' | 'error'>('success');

  guardando = signal<boolean>(false);
  errorFormulario = signal<string | null>(null);

  modalDatosAbierto = signal<boolean>(false);
  formularioDatos = signal<DatosGeneralesPayload>({
    antecedentes: '',
    alergias: '',
    observaciones: '',
  });
  guardandoDatos = signal<boolean>(false);
  errorDatos = signal<string | null>(null);

  readonly especies = ['Canino', 'Felino', 'Ave', 'Equino', 'Otro'];

  formularioConsulta = signal<FormularioConsulta>({
    fecha: this.obtenerFechaActual(),
    veterinario_id: '',
    motivo: '',
    peso_kg: '',
    temperatura_c: '',
    diagnostico: '',
    tratamiento: '',
    medicamentos: '',
    observaciones: '',
    evolucion: '',
  });

  private debounceTimer: any = null;

  alcanceListado = computed<AlcanceApi | undefined>(() => {
    return this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId: this.filtroEmpresa() || null }
      : undefined;
  });

  historiasFiltradas = computed(() => this.historias());

  totalHistorias = computed(() => this.resumen()?.total_historias ?? 0);
  pacientesActivos = computed(() => this.resumen()?.activos ?? 0);
  pacientesInactivos = computed(() => this.resumen()?.inactivos ?? 0);
  totalConsultas = computed(() => this.resumen()?.total_consultas ?? 0);

  ngOnInit(): void {
    if (this.esVistaSuperUsuario()) {
      this.empresaService.listarOpciones().subscribe({
        next: (res) => this.empresasDisponibles.set(res || []),
        error: () => {},
      });
    }
    this.cargarHistorias(1);
    this.cargarResumen();
  }

  private alcancePaciente(empresaId: string): AlcanceApi | undefined {
    return this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId }
      : undefined;
  }

  cargarHistorias(pagina = 1): void {
    this.cargando.set(true);
    this.error.set(null);

    const params = {
      buscar: this.busqueda() || undefined,
      especie: this.filtroEspecie() === 'Todos' ? undefined : this.filtroEspecie(),
      estado: (this.filtroEstado() === 'Todos' ? undefined : this.filtroEstado()) as EstadoPaciente,
      page: pagina,
      per_page: 15,
    };

    this.historiaClinicaService.listar(params, this.alcanceListado()).subscribe({
      next: (res) => {
        this.historias.set(res.data || []);
        this.paginaActual.set(res.current_page || 1);
        this.totalPaginas.set(res.last_page || 1);
        this.total.set(res.total || 0);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(
          err?.error?.message || 'No se pudo cargar el listado de historias clínicas.'
        );
      },
    });
  }

  cargarResumen(): void {
    this.historiaClinicaService.resumen(this.alcanceListado()).subscribe({
      next: (res) => this.resumen.set(res),
      error: () => {},
    });
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.cargarHistorias(pagina);
    }
  }

  onEmpresaChange(valor: string): void {
    this.filtroEmpresa.set(valor);
    this.cargarHistorias(1);
    this.cargarResumen();
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.cargarHistorias(1);
    }, 350);
  }

  cambiarFiltroEspecie(valor: string): void {
    this.filtroEspecie.set(valor);
    this.cargarHistorias(1);
    this.cargarResumen();
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
    this.cargarHistorias(1);
    this.cargarResumen();
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEspecie.set('Todos');
    this.filtroEstado.set('Todos');
    this.filtroEmpresa.set('');
    this.cargarHistorias(1);
    this.cargarResumen();
  }

  verHistoria(historia: HistoriaResumen): void {
    this.cargandoDetalle.set(true);
    this.historiaClinicaService
      .obtener(historia.id, this.alcancePaciente(historia.empresa_id))
      .subscribe({
        next: (res) => {
          this.cargandoDetalle.set(false);
          this.historiaSeleccionada.set(res);
          this.modalHistoriaAbierto.set(true);
        },
        error: () => {
          this.cargandoDetalle.set(false);
          this.mostrarMensaje('No se pudo cargar la historia clínica.', 'error');
        },
      });
  }

  cerrarHistoria(): void {
    this.modalHistoriaAbierto.set(false);
    this.historiaSeleccionada.set(null);
  }

  nuevaConsulta(historia: HistoriaResumen | HistoriaDetalle): void {
    this.pacienteConsulta.set({
      id: historia.id,
      nombre: historia.nombre,
      empresa_id: historia.empresa_id,
    });
    this.modoEdicionConsulta.set(false);
    this.consultaEditandoId.set(null);
    this.errorFormulario.set(null);

    this.formularioConsulta.set({
      fecha: this.obtenerFechaActual(),
      veterinario_id: '',
      motivo: '',
      peso_kg: '',
      temperatura_c: '',
      diagnostico: '',
      tratamiento: '',
      medicamentos: '',
      observaciones: '',
      evolucion: '',
    });

    this.historiaClinicaService
      .profesionales(this.alcancePaciente(historia.empresa_id))
      .subscribe({
        next: (profs) => {
          this.profesionales.set(profs || []);
          const actualUsuarioId = this.session.obtenerUsuario()?.id;
          if (actualUsuarioId && profs.some((p) => p.id === actualUsuarioId)) {
            this.actualizarCampo('veterinario_id', actualUsuarioId);
          }
          this.modalConsultaAbierto.set(true);
        },
        error: () => {
          this.profesionales.set([]);
          this.modalConsultaAbierto.set(true);
        },
      });
  }

  editarConsulta(historia: HistoriaDetalle, consulta: ConsultaClinica): void {
    this.pacienteConsulta.set({
      id: historia.id,
      nombre: historia.nombre,
      empresa_id: historia.empresa_id,
    });
    this.modoEdicionConsulta.set(true);
    this.consultaEditandoId.set(consulta.id);
    this.errorFormulario.set(null);

    this.formularioConsulta.set({
      fecha: consulta.fecha || this.obtenerFechaActual(),
      veterinario_id: consulta.veterinario_id || '',
      motivo: consulta.motivo || '',
      peso_kg: consulta.peso_kg ? String(consulta.peso_kg) : '',
      temperatura_c: consulta.temperatura_c ? String(consulta.temperatura_c) : '',
      diagnostico: consulta.diagnostico || '',
      tratamiento: consulta.tratamiento || '',
      medicamentos: consulta.medicamentos || '',
      observaciones: consulta.observaciones || '',
      evolucion: consulta.evolucion || '',
    });

    this.historiaClinicaService
      .profesionales(this.alcancePaciente(historia.empresa_id))
      .subscribe({
        next: (profs) => {
          this.profesionales.set(profs || []);
          this.modalHistoriaAbierto.set(false);
          this.modalConsultaAbierto.set(true);
        },
        error: () => {
          this.profesionales.set([]);
          this.modalHistoriaAbierto.set(false);
          this.modalConsultaAbierto.set(true);
        },
      });
  }

  cerrarModalConsulta(): void {
    this.modalConsultaAbierto.set(false);
    this.pacienteConsulta.set(null);
  }

  actualizarCampo(campo: keyof FormularioConsulta, valor: string): void {
    this.formularioConsulta.update((formulario) => ({
      ...formulario,
      [campo]: valor,
    }));
  }

  guardarConsulta(): void {
    const paciente = this.pacienteConsulta();
    const f = this.formularioConsulta();

    if (!paciente) return;

    if (!f.fecha) {
      this.errorFormulario.set('Selecciona la fecha de la consulta.');
      return;
    }

    if (!f.veterinario_id) {
      this.errorFormulario.set('Selecciona el veterinario responsable.');
      return;
    }

    if (!f.motivo.trim()) {
      this.errorFormulario.set('Ingresa el motivo de consulta.');
      return;
    }

    if (!f.diagnostico.trim()) {
      this.errorFormulario.set('Ingresa el diagnóstico.');
      return;
    }

    this.guardando.set(true);
    this.errorFormulario.set(null);

    const payload: ConsultaPayload = {
      veterinario_id: f.veterinario_id,
      fecha: f.fecha,
      motivo: f.motivo.trim(),
      peso_kg: f.peso_kg !== '' && f.peso_kg !== null ? Number(f.peso_kg) : null,
      temperatura_c: f.temperatura_c !== '' && f.temperatura_c !== null ? Number(f.temperatura_c) : null,
      diagnostico: f.diagnostico.trim(),
      tratamiento: f.tratamiento.trim() || null,
      medicamentos: f.medicamentos.trim() || null,
      observaciones: f.observaciones.trim() || null,
      evolucion: f.evolucion.trim() || null,
    };

    const alcance = this.alcancePaciente(paciente.empresa_id);

    const req$ = this.modoEdicionConsulta()
      ? this.historiaClinicaService.actualizarConsulta(
          paciente.id,
          this.consultaEditandoId()!,
          payload,
          alcance
        )
      : this.historiaClinicaService.crearConsulta(paciente.id, payload, alcance);

    req$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModalConsulta();
        this.mostrarMensaje(
          this.modoEdicionConsulta()
            ? 'Consulta actualizada correctamente.'
            : 'Consulta registrada correctamente.',
          'success'
        );
        this.cargarHistorias(this.paginaActual());
        this.cargarResumen();
        if (this.historiaSeleccionada()) {
          this.historiaClinicaService
            .obtener(paciente.id, alcance)
            .subscribe({
              next: (res) => {
                this.historiaSeleccionada.set(res);
                this.modalHistoriaAbierto.set(true);
              },
              error: () => {},
            });
        }
      },
      error: (err) => {
        this.guardando.set(false);
        let msg = err?.error?.message;
        if (err?.error?.errors && typeof err.error.errors === 'object') {
          const primerCampo = Object.keys(err.error.errors)[0];
          if (primerCampo && err.error.errors[primerCampo]?.length > 0) {
            msg = err.error.errors[primerCampo][0];
          }
        }
        this.errorFormulario.set(
          msg || 'No se pudo guardar la consulta. Intenta de nuevo.'
        );
      },
    });
  }

  eliminarConsulta(historia: HistoriaDetalle, consulta: ConsultaClinica): void {
    const confirmar = window.confirm(
      `¿Deseas eliminar la consulta del ${this.formatearFecha(consulta.fecha)}?`
    );

    if (!confirmar) return;

    const alcance = this.alcancePaciente(historia.empresa_id);

    this.historiaClinicaService
      .eliminarConsulta(historia.id, consulta.id, alcance)
      .subscribe({
        next: () => {
          this.mostrarMensaje('Consulta eliminada correctamente.', 'success');
          this.cargarHistorias(this.paginaActual());
          this.cargarResumen();
          this.historiaClinicaService.obtener(historia.id, alcance).subscribe({
            next: (res) => this.historiaSeleccionada.set(res),
            error: () => {},
          });
        },
        error: (err) => {
          this.mostrarMensaje(
            err?.error?.message || 'No se pudo eliminar la consulta.',
            'error'
          );
        },
      });
  }

  abrirDatosGenerales(): void {
    const det = this.historiaSeleccionada();
    if (!det) return;

    this.formularioDatos.set({
      antecedentes: det.antecedentes || '',
      alergias: det.alergias || '',
      observaciones: det.observaciones || '',
    });
    this.errorDatos.set(null);
    this.modalDatosAbierto.set(true);
  }

  cerrarDatosGenerales(): void {
    this.modalDatosAbierto.set(false);
  }

  actualizarDato(campo: keyof DatosGeneralesPayload, valor: string): void {
    this.formularioDatos.update((f) => ({
      ...f,
      [campo]: valor,
    }));
  }

  guardarDatosGenerales(): void {
    const det = this.historiaSeleccionada();
    if (!det) return;

    this.guardandoDatos.set(true);
    this.errorDatos.set(null);

    const f = this.formularioDatos();
    const payload: DatosGeneralesPayload = {
      antecedentes: f.antecedentes ? f.antecedentes.trim() || null : null,
      alergias: f.alergias ? f.alergias.trim() || null : null,
      observaciones: f.observaciones ? f.observaciones.trim() || null : null,
    };

    const alcance = this.alcancePaciente(det.empresa_id);

    this.historiaClinicaService
      .actualizarDatosGenerales(det.id, payload, alcance)
      .subscribe({
        next: (res) => {
          this.guardandoDatos.set(false);
          this.historiaSeleccionada.set(res);
          this.cerrarDatosGenerales();
          this.mostrarMensaje('Datos generales actualizados correctamente.', 'success');
        },
        error: (err) => {
          this.guardandoDatos.set(false);
          this.errorDatos.set(
            err?.error?.message || 'No se pudieron actualizar los datos generales.'
          );
        },
      });
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'activo':
        return 'Activo';
      case 'inactivo':
        return 'Inactivo';
      case 'fallecido':
        return 'Fallecido';
      default:
        return estado;
    }
  }

  etiquetaSexo(sexo: string): string {
    switch (sexo) {
      case 'macho':
        return 'Macho';
      case 'hembra':
        return 'Hembra';
      case 'indefinido':
        return 'Indefinido';
      default:
        return sexo;
    }
  }

  textoIdentificacion(h: HistoriaResumen | HistoriaDetalle): string {
    return h.microchip ? `Chip ${h.microchip}` : 'Sin microchip';
  }

  formatearPeso(valor: string | number | null): string {
    if (valor === null || valor === undefined || valor === '') return '—';
    return `${Number(valor).toFixed(1).replace(/\.0$/, '')} kg`;
  }

  formatearTemperatura(valor: string | number | null): string {
    if (valor === null || valor === undefined || valor === '') return '—';
    return `${Number(valor).toFixed(1)} °C`;
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'PA';
    const partes = nombre.trim().split(' ').filter(Boolean);
    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return 'Sin registro';
    }
    const partes = fecha.substring(0, 10).split('-');
    if (partes.length !== 3) {
      return fecha;
    }
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  private obtenerFechaActual(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje.set(mensaje);
    this.tipoMensaje.set(tipo);
    setTimeout(() => {
      this.mensaje.set('');
    }, 3000);
  }
}