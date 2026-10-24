import { PermisoDirective } from '../../core/directives/permiso.directive';
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
  anamnesis: string;
  frecuencia_cardiaca: string;
  frecuencia_respiratoria: string;
  spo2: string;
  llenado_capilar: string;
  mucosas: string;
  hidratacion: string;
  condicion_corporal: string;
  estado_general: string;
  examen_por_sistemas: string;
  tipo_diagnostico: string;
  recomendaciones: string;

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
  imports: [PermisoDirective, CommonModule, FormsModule],
  templateUrl: './historias-clinicas.component.html',
  styleUrls: ['./historias-clinicas.component.scss'],
})
export class HistoriasClinicasComponent implements OnInit {
  private readonly historiaClinicaService = inject(HistoriaClinicaService);
  private readonly empresaService = inject(EmpresaService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));
  readonly puedeCrear = computed(() => this.session.tienePermiso('historias_clinicas.crear'));
  readonly puedeEditar = computed(() => this.session.tienePermiso('historias_clinicas.editar'));


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

  pestanaConsulta = signal<'datos' | 'signos' | 'examen' | 'diagnostico' | 'plan'>('datos');

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
    anamnesis: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    spo2: '',
    llenado_capilar: '',
    mucosas: '',
    hidratacion: '',
    condicion_corporal: '',
    estado_general: '',
    examen_por_sistemas: '',
    tipo_diagnostico: '',
    recomendaciones: '',

  });

  pacienteEnPantalla = signal<HistoriaDetalle | null>(null);
  modalImpresiones = signal<ConsultaClinica | null>(null);
  busquedaRealizada = signal(false);
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
    this.cargarResumen();
  }

  private alcancePaciente(empresaId: string): AlcanceApi | undefined {
    return this.esVistaSuperUsuario()
      ? { plataforma: true, empresaId }
      : undefined;
  }

  cargarHistorias(pagina = 1): void {
    if (!this.busqueda().trim()) {
      this.historias.set([]);
      this.total.set(0);
      this.busquedaRealizada.set(false);
      this.pacienteEnPantalla.set(null);
      return;
    }
    this.busquedaRealizada.set(true);
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
    this.pacienteEnPantalla.set(null);
    this.cargarHistorias(1);
    this.cargarResumen();
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.pacienteEnPantalla.set(null);
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
    this.pacienteEnPantalla.set(null);
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
          this.pacienteEnPantalla.set(res);
          this.modalHistoriaAbierto.set(false);
        },
        error: () => {
          this.cargandoDetalle.set(false);
          this.mostrarMensaje('No se pudo cargar la historia clínica.', 'error');
        },
      });
  }


  abrirDetallePaciente(): void {
    const paciente = this.pacienteEnPantalla();
    if (paciente) {
      this.historiaSeleccionada.set(paciente);
      this.modalHistoriaAbierto.set(true);
    }
  }

  private escaparHtml(valor: unknown): string {
    return String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[caracter] || caracter));
  }

  readonly etiquetasServicios: Record<string, string> = {
    general: 'Consulta general', control: 'Control / Seguimiento', cirugia: 'Cirugía',
    urgencia: 'Urgencia', estetica: 'Peluquería / Estética', vacunacion: 'Vacunación',
    desparasitacion: 'Desparasitación',
  };

  nombreServicio(consulta: ConsultaClinica): string {
    return this.etiquetasServicios[consulta.tipo_consulta || ''] || 'Atención';
  }

  /** Las impresiones complementarias dependen de datos reales, nunca de valores por defecto. */
  puedeImprimirFormulacion(consulta: ConsultaClinica): boolean {
    const servicio = consulta.tipo_consulta || 'general';
    return !['estetica', 'vacunacion', 'desparasitacion'].includes(servicio)
      && typeof consulta.medicamentos === 'string'
      && consulta.medicamentos.trim().length > 0;
  }

  puedeImprimirIndicaciones(consulta: ConsultaClinica): boolean {
    const servicio = consulta.tipo_consulta || 'general';
    if (['estetica', 'vacunacion', 'desparasitacion'].includes(servicio)) return false;
    const datos = (consulta.datos_especificos || {}) as Record<string, unknown>;
    return [consulta.tratamiento, datos['indicaciones'], datos['recomendaciones']]
      .some(valor => typeof valor === 'string' && valor.trim().length > 0);
  }

  tieneOtrasImpresiones(consulta: ConsultaClinica): boolean {
    return this.puedeImprimirFormulacion(consulta) || this.puedeImprimirIndicaciones(consulta);
  }

  imprimirConsulta(consulta: ConsultaClinica, tipo: 'evolucion' | 'formulacion' | 'servicios'): void {
    const paciente = this.pacienteEnPantalla();
    if (!paciente) return;
    const servicio = consulta.tipo_consulta || 'general';
    const datos = (consulta.datos_especificos || {}) as Record<string, unknown>;
    const tieneValor = (v: unknown): boolean => {
      if (v === null || v === undefined || v === false) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      if (Array.isArray(v)) return v.some(tieneValor);
      if (typeof v === 'object') return Object.values(v).some(tieneValor);
      return true;
    };
    const formatoValor = (v: unknown): string => {
      if (Array.isArray(v)) return v.filter(tieneValor).map(formatoValor).filter(Boolean).join('\n');
      if (typeof v === 'object' && v !== null) {
        return Object.entries(v)
          .filter(([clave, valor]) => !['medicamento_id', 'producto_id', 'insumo_id'].includes(clave) && tieneValor(valor))
          .map(([clave, valor]) => `${clave.replace(/_/g, ' ')}: ${formatoValor(valor)}`)
          .join(' · ');
      }
      return String(v);
    };
    const campo = (etiqueta: string, valor: unknown): string => tieneValor(valor)
      ? `<div class="campo"><b>${this.escaparHtml(etiqueta)}</b><p>${this.escaparHtml(formatoValor(valor))}</p></div>` : '';
    const seccion = (titulo: string, contenido: string): string => contenido ? `<h2>${this.escaparHtml(titulo)}</h2>${contenido}` : '';
    const campos = (entradas: Array<[string, unknown]>): string => entradas.map(([k, v]) => campo(k, v)).join('');
    const datosServicio: Record<string, Array<[string, string]>> = {
      estetica: [
        ['Servicios realizados', 'estetica_servicios'], ['Insumos utilizados', 'estetica_productos_cosmeticos'],
        ['Estado de piel y pelaje', 'estetica_estado_piel'], ['Comportamiento', 'estetica_comportamiento'],
        ['Novedades y hallazgos', 'estetica_novedades'], ['Recomendaciones de estética', 'estetica_recomendaciones'],
      ],
      control: [
        ['Motivo del control', 'control_motivo'], ['Adherencia al tratamiento', 'control_adherencia'],
        ['Respuesta clínica', 'control_respuesta'], ['Hallazgos del seguimiento', 'control_hallazgos'],
        ['Próximo control', 'control_proximo'],
      ],
      cirugia: [
        ['Ayuno preoperatorio', 'cirugia_ayuno'], ['Consentimiento informado', 'cirugia_consentimiento'],
        ['Riesgo anestésico', 'cirugia_riesgo'], ['Anestesia y monitoreo', 'cirugia_anestesia'],
        ['Hallazgos intraoperatorios', 'cirugia_hallazgos'], ['Complicaciones y manejo', 'cirugia_complicaciones'],
        ['Recuperación', 'cirugia_recuperacion'],
      ],
      urgencia: [
        ['Triaje', 'urgencia_triage'], ['Inicio de síntomas', 'urgencia_inicio'],
        ['Estado al ingreso', 'urgencia_estado'], ['Evaluación ABC', 'urgencia_abc'],
        ['Estabilización', 'urgencia_estabilizacion'], ['Destino del paciente', 'urgencia_destino'],
      ],
      vacunacion: [
        ['Vacuna', 'nombre'], ['Tipo de vacuna', 'tipo'], ['Lote', 'lote'],
        ['Fecha de aplicación', 'fecha_aplicacion'], ['Próxima aplicación', 'proxima_fecha'],
      ],
      desparasitacion: [
        ['Producto', 'producto'], ['Tipo', 'tipo'], ['Fecha de aplicación', 'fecha_aplicacion'],
        ['Próxima aplicación', 'proxima_fecha'],
      ],
    };
    let contenido = '';
    if (tipo === 'formulacion' && !this.puedeImprimirFormulacion(consulta)) return;
    if (tipo === 'servicios' && !this.puedeImprimirIndicaciones(consulta)) return;

    // Lista blanca por servicio: nunca agregar indiscriminadamente todas las claves
    // de datos_especificos (puede contener defaults de otros formularios).
    const clinico = !['estetica', 'vacunacion', 'desparasitacion'].includes(servicio);
    if (tipo === 'formulacion') {
      contenido = seccion('Formulación médica', campos([
        ['Medicamentos formulados', consulta.medicamentos],
      ]));
    } else if (tipo === 'servicios') {
      contenido = seccion('Servicios e indicaciones', campos([
        ['Tratamiento', consulta.tratamiento],
        ['Indicaciones', datos['indicaciones']],
        ['Recomendaciones', datos['recomendaciones']],
      ]));
    } else {
      // El motivo de una vacunación o desparasitación se genera automáticamente;
      // ya está identificado en el título, por lo que no se presenta como diligenciado.
      const motivo = ['vacunacion', 'desparasitacion'].includes(servicio) ? null : consulta.motivo;
      contenido += seccion('Registro de ' + this.nombreServicio(consulta), campos([
        ['Motivo', motivo],
        ...(datosServicio[servicio] || []).map(([etiqueta, clave]): [string, unknown] => [etiqueta, datos[clave]]),
      ]));
      if (clinico) {
        // Solo campos que pertenecen a la atención clínica, nunca prioridad ni
        // tipo_diagnostico (inicializados automáticamente por el formulario).
        contenido += seccion('Evaluación clínica', campos([
          ['Anamnesis', datos['anamnesis']],
          ['Frecuencia cardíaca', datos['frecuencia_cardiaca']],
          ['Frecuencia respiratoria', datos['frecuencia_respiratoria']],
          ['Saturación de oxígeno', datos['spo2']],
          ['Llenado capilar', datos['llenado_capilar']],
          ['Mucosas', datos['mucosas']],
          ['Hidratación', datos['hidratacion']],
          ['Condición corporal', datos['condicion_corporal']],
          ['Estado general', datos['estado_general']],
          ['Examen por sistemas', datos['examen_por_sistemas']],
          ['Peso (kg)', consulta.peso_kg], ['Temperatura (°C)', consulta.temperatura_c],
          ['Diagnóstico', consulta.diagnostico],
        ]));
      }
      // Cada servicio solo expone sus resultados pertinentes, si fueron registrados.
      const resultado = servicio === 'estetica' ? [
        ['Observaciones', consulta.observaciones],
        ['Entrega / evolución', consulta.evolucion],
      ] as Array<[string, unknown]>
        : ['vacunacion', 'desparasitacion'].includes(servicio) ? [
          ['Observaciones', consulta.observaciones],
        ] as Array<[string, unknown]>
        : [
          ['Tratamiento', consulta.tratamiento], ['Medicamentos', consulta.medicamentos],
          ['Evolución', consulta.evolucion], ['Observaciones', consulta.observaciones],
          ['Indicaciones', datos['indicaciones']], ['Recomendaciones', datos['recomendaciones']],
        ] as Array<[string, unknown]>;
      contenido += seccion('Resultados y recomendaciones', campos(resultado));
    }
    if (!contenido) { this.mostrarMensaje('Esta atención no tiene información diligenciada para generar el documento.', 'error'); return; }
    const titulo = tipo === 'evolucion' ? `Atención · ${this.nombreServicio(consulta)}`
      : tipo === 'formulacion' ? 'Formulación médica' : 'Servicios e indicaciones';
    const ventana = window.open('', '_blank');
    if (!ventana) { this.mostrarMensaje('Permite las ventanas emergentes para imprimir el documento.', 'error'); return; }
    const metadatos = [
      campo('Paciente', paciente.nombre), campo('Especie', paciente.especie),
      campo('Raza', paciente.raza), campo('Responsable', paciente.propietario?.nombre),
      ...(consulta.tipo_consulta && this.etiquetasServicios[consulta.tipo_consulta]
        ? [campo('Tipo de servicio', this.nombreServicio(consulta))] : []),
      campo('Fecha', consulta.fecha), campo('Profesional', consulta.veterinario_nombre),
    ].filter(Boolean).join('');
    ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${this.escaparHtml(titulo)}</title><style>body{font-family:Arial,sans-serif;color:#183047;margin:40px}h1{color:#167d8b;border-bottom:3px solid #167d8b;padding-bottom:12px}h2{font-size:16px;margin-top:28px;background:#eff6f8;padding:9px}.meta{background:#f1f7f8;padding:12px 14px;border-radius:10px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 16px;line-height:1.35}.meta .campo{padding:3px 0;border:0;min-width:0}.meta .campo b{display:block;font-size:11px;color:#536b7d;margin-bottom:3px}.meta .campo p{margin:0;font-size:13px;overflow-wrap:anywhere}.campo{padding:9px 0;border-bottom:1px solid #e0e8eb;break-inside:avoid}.campo p{white-space:pre-wrap;margin:7px 0}footer{margin-top:40px;color:#667;font-size:12px}@media(max-width:680px){.meta{grid-template-columns:repeat(2,minmax(0,1fr))}}@media print{body{margin:15mm}.meta{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 12px}}</style></head><body><h1>VetNova · ${this.escaparHtml(titulo)}</h1>${metadatos ? `<div class="meta">${metadatos}</div>` : ''}${contenido}<footer>Documento generado desde VetNova. Verifique los datos antes de su entrega.</footer></body></html>`);
    ventana.document.close();
    ventana.focus();
    ventana.print();
    this.modalImpresiones.set(null);
  }

  cerrarHistoria(): void {
    this.modalHistoriaAbierto.set(false);
    this.historiaSeleccionada.set(null);
  }

  nuevaConsulta(historia: HistoriaResumen | HistoriaDetalle): void {
    if (!this.puedeCrear()) { this.mostrarMensaje('No tienes permiso para realizar esta acción.', 'error'); return; }
    this.pacienteConsulta.set({
      id: historia.id,
      nombre: historia.nombre,
      empresa_id: historia.empresa_id,
    });
    this.pestanaConsulta.set('datos');
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
      anamnesis: '',
      frecuencia_cardiaca: '',
      frecuencia_respiratoria: '',
      spo2: '',
      llenado_capilar: '',
      mucosas: '',
      hidratacion: '',
      condicion_corporal: '',
      estado_general: '',
      examen_por_sistemas: '',
      tipo_diagnostico: '',
      recomendaciones: '',
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
    if (!this.puedeEditar()) { this.mostrarMensaje('No tienes permiso para realizar esta acción.', 'error'); return; }
    this.pacienteConsulta.set({
      id: historia.id,
      nombre: historia.nombre,
      empresa_id: historia.empresa_id,
    });
    this.pestanaConsulta.set('datos');
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
      anamnesis: String(consulta.datos_especificos?.anamnesis ?? ''),
      frecuencia_cardiaca: String(consulta.datos_especificos?.frecuencia_cardiaca ?? ''),
      frecuencia_respiratoria: String(consulta.datos_especificos?.frecuencia_respiratoria ?? ''),
      spo2: String(consulta.datos_especificos?.spo2 ?? ''),
      llenado_capilar: String(consulta.datos_especificos?.llenado_capilar ?? ''),
      mucosas: String(consulta.datos_especificos?.mucosas ?? ''),
      hidratacion: String(consulta.datos_especificos?.hidratacion ?? ''),
      condicion_corporal: String(consulta.datos_especificos?.condicion_corporal ?? ''),
      estado_general: String(consulta.datos_especificos?.estado_general ?? ''),
      examen_por_sistemas: String(consulta.datos_especificos?.examen_por_sistemas ?? ''),
      tipo_diagnostico: String(consulta.datos_especificos?.tipo_diagnostico ?? ''),
      recomendaciones: String(consulta.datos_especificos?.recomendaciones ?? ''),

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
    if (!(this.modoEdicionConsulta() ? this.puedeEditar() : this.puedeCrear())) {
      this.errorFormulario.set('No tienes permiso para realizar esta acción.');
      return;
    }
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
      datos_especificos: {
        anamnesis: f.anamnesis.trim() || null,
        frecuencia_cardiaca: (f.frecuencia_cardiaca.trim() ? Number(f.frecuencia_cardiaca) : null),
        frecuencia_respiratoria: (f.frecuencia_respiratoria.trim() ? Number(f.frecuencia_respiratoria) : null),
        spo2: (f.spo2.trim() ? Number(f.spo2) : null),
        llenado_capilar: (f.llenado_capilar.trim() ? Number(f.llenado_capilar) : null),
        mucosas: f.mucosas.trim() || null,
        hidratacion: f.hidratacion.trim() || null,
        condicion_corporal: f.condicion_corporal.trim() || null,
        estado_general: f.estado_general.trim() || null,
        examen_por_sistemas: f.examen_por_sistemas.trim() || null,
        tipo_diagnostico: f.tipo_diagnostico.trim() || null,
        recomendaciones: f.recomendaciones.trim() || null,
      },
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
    if (!this.puedeEditar()) { this.mostrarMensaje('No tienes permiso para realizar esta acción.', 'error'); return; }
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
    if (!this.puedeEditar()) { this.mostrarMensaje('No tienes permiso para realizar esta acción.', 'error'); return; }
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
    if (!this.puedeEditar()) { this.mostrarMensaje('No tienes permiso para realizar esta acción.', 'error'); return; }
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