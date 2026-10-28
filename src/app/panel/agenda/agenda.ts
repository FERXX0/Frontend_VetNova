import { PermisoDirective } from '../../core/directives/permiso.directive';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, interval, Subscription, finalize} from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CitaService } from '../../core/services/cita.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { Empresa, EmpresaOpcion } from '../../core/models/empresa.model';
import { ServicioService } from '../../core/services/servicio.service';
import { Cita, CitaPayload, EstadoCita, Profesional, TipoConsulta } from '../../core/models/cita.model';
import { Paciente } from '../../core/models/paciente.model';
import { Servicio } from '../../core/models/servicio.model';
import { AlcanceApi } from '../../core/utils/alcance-api';
import { SessionService } from '../../core/services/session.service';
import { AtencionCitaService } from '../../core/services/atencion-cita.service';
import { FarmaciaService } from '../../core/services/farmacia.service';
import { Medicamento } from '../../core/models/farmacia.model';
import { AtencionCitaPayload, AtencionCitaResponse, DiagnosticoAnterior, HistorialAgendaItem, MedicamentoAtencion, MedicamentoAtencionPayload } from '../../core/models/atencion-cita.model';
import { BuscadorPacienteComponent } from '../../shared/components/buscador-paciente/buscador-paciente';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [PermisoDirective, CommonModule, FormsModule, ReactiveFormsModule, BuscadorPacienteComponent],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class AgendaComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly citaService = inject(CitaService);
  private readonly servicioService = inject(ServicioService);
  private readonly empresaService = inject(EmpresaService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionService = inject(SessionService);
  private readonly atencionCitaService = inject(AtencionCitaService);
  private readonly farmaciaService = inject(FarmaciaService);

  private actualizacionAgenda?: Subscription;
  private peticionCitas?: Subscription;
  private secuenciaConsultaCitas = 0;
  private consultaCitasEnCurso = false;

  readonly ultimaActualizacionAgenda = signal<Date | null>(null);

  // Esta misma pantalla se usa en /super-usuario/agenda y en /panel/agenda.
  readonly esVistaSuperUsuario = signal(this.router.url.startsWith('/super-usuario'));

  empresasDisponibles = signal<EmpresaOpcion[]>([]);
  profesionales = signal<Profesional[]>([]);
  profesionalesFormulario = signal<Profesional[]>([]);
  opcionesProfesionales = computed(() => this.esVistaSuperUsuario() ? this.profesionalesFormulario() : this.profesionales());
  filtroEmpresa = signal<string>('todas');
  filtroProfesional = signal<string>('');

  // Fecha seleccionada en formato YYYY-MM-DD
  fechaSeleccionada = signal(this.formatoFechaIso(new Date()));
  periodo = signal<'dia' | 'semana' | 'mes'>('dia');
  filtroEstado = signal<EstadoCita | 'todos'>('todos');

  citas = signal<Cita[]>([]);
  pacienteElegido = signal<{ id: string; nombre: string; propietario_nombre?: string; propietario_celular?: string } | null>(null);
  servicios = signal<Servicio[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  alSeleccionarPaciente(paciente: Paciente): void {
    this.pacienteElegido.set({
      id: paciente.id,
      nombre: paciente.nombre,
      propietario_nombre: paciente.propietario?.nombre,
      propietario_celular: paciente.propietario?.celular,
    });
    this.form.patchValue({ paciente_id: paciente.id });
    this.form.get('paciente_id')?.markAsTouched();
  }

  quitarPaciente(): void {
    this.pacienteElegido.set(null);
    this.form.patchValue({ paciente_id: '' });
  }

  alcancePacientesForm(): AlcanceApi | undefined {
    if (!this.esVistaSuperUsuario()) return undefined;
    const empresaId = this.form.get('empresa_id')?.value;
    return empresaId ? this.alcanceEscritura(empresaId) : undefined;
  }

  // Franjas visibles en la agenda (8:00 a 23:59)
  readonly franjasHorarias = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00',
  ];

  readonly tiposConsulta: { valor: TipoConsulta; etiqueta: string }[] = [
    { valor: 'general', etiqueta: 'Consulta General' },
    { valor: 'vacunacion', etiqueta: 'Vacunación' },
    { valor: 'desparasitacion', etiqueta: 'Desparasitación' },
    { valor: 'control', etiqueta: 'Control / Seguimiento' },
    { valor: 'cirugia', etiqueta: 'Cirugía' },
    { valor: 'urgencia', etiqueta: 'Urgencia' },
    { valor: 'estetica', etiqueta: 'Peluquería / Estética' },
  ];

  readonly estados: { valor: EstadoCita; etiqueta: string }[] = [
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'confirmada', etiqueta: 'Confirmada' },
    { valor: 'cumplida', etiqueta: 'Cumplida' },
    { valor: 'atendida', etiqueta: 'Atendida' },
    { valor: 'cancelada', etiqueta: 'Cancelada' },
  ];

  // Citas filtradas por fecha seleccionada y estado
  citasDelDia = computed(() => {
    const fecha = this.fechaSeleccionada();
    const estado = this.filtroEstado();
    const empresa = this.filtroEmpresa();
    return this.citas().filter((c) => {
      const coincideFecha = c.fecha === fecha;
      const coincideEstado = estado === 'todos' || c.estado === estado;
      const coincideEmpresa = empresa === 'todas' || c.empresa_id === empresa;
      return coincideFecha && coincideEstado && coincideEmpresa;
    });
  });

  rangoPeriodo = computed(() => this.calcularRango(this.fechaSeleccionada(), this.periodo()));

  readonly nombresDiasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  private readonly mapaCitasPorFecha = computed(() => {
    const estado = this.filtroEstado();
    const empresa = this.filtroEmpresa();
    const mapa = new Map<string, Cita[]>();
    for (const cita of this.citas()) {
      if (estado !== 'todos' && cita.estado !== estado) continue;
      if (empresa !== 'todas' && cita.empresa_id !== empresa) continue;
      const lista = mapa.get(cita.fecha) ?? [];
      lista.push(cita);
      mapa.set(cita.fecha, lista);
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }
    return mapa;
  });

  readonly diasSemana = computed(() => {
    const { inicio } = this.calcularRango(this.fechaSeleccionada(), 'semana');
    const base = this.fechaDesdeIso(inicio);
    const hoy = this.formatoFechaIso(new Date());
    const mapa = this.mapaCitasPorFecha();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const fecha = this.formatoFechaIso(d);
      return { fecha, nombre: this.nombresDiasSemana[i], numero: d.getDate(), esHoy: fecha === hoy, citas: mapa.get(fecha) ?? [] };
    });
  });

  readonly semanasMes = computed(() => {
    const { inicio, fin } = this.calcularRango(this.fechaSeleccionada(), 'mes');
    const primero = this.fechaDesdeIso(inicio);
    const ultimo = this.fechaDesdeIso(fin);
    const desfase = (primero.getDay() + 6) % 7;
    const comienzo = new Date(primero.getFullYear(), primero.getMonth(), 1 - desfase);
    const totalCeldas = Math.ceil((desfase + ultimo.getDate()) / 7) * 7;
    const hoy = this.formatoFechaIso(new Date());
    const mapa = this.mapaCitasPorFecha();

    const celdas = Array.from({ length: totalCeldas }, (_, i) => {
      const d = new Date(comienzo.getFullYear(), comienzo.getMonth(), comienzo.getDate() + i);
      const fecha = this.formatoFechaIso(d);
      const delMes = d.getMonth() === primero.getMonth();
      return { fecha, numero: d.getDate(), delMes, esHoy: fecha === hoy, citas: delMes ? (mapa.get(fecha) ?? []) : [] };
    });

    const semanas: typeof celdas[] = [];
    for (let i = 0; i < celdas.length; i += 7) {
      semanas.push(celdas.slice(i, i + 7));
    }
    return semanas;
  });

  irADia(fecha: string): void {
    this.fechaSeleccionada.set(fecha);
    this.cambiarPeriodo('dia');
  };


  statsPeriodo = computed(() => {
    const todas = this.citas();
    return {
      total: todas.length,
      confirmadas: todas.filter((c) => c.estado === 'confirmada').length,
      pendientes: todas.filter((c) => c.estado === 'pendiente').length,
      cumplidas: todas.filter((c) => c.estado === 'cumplida').length,
      atendidas: todas.filter((c) => c.estado === 'atendida').length,
    };
  });

  // Fecha formateada en español legible
  fechaLegible = computed(() => {
    const [anio, mes, dia] = this.fechaSeleccionada().split('-').map(Number);
    const date = new Date(anio, mes - 1, dia);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  etiquetaPeriodo = computed(() => {
    const periodo = this.periodo();
    if (periodo === 'dia') return this.fechaLegible();

    const { inicio, fin } = this.rangoPeriodo();
    const fi = this.fechaDesdeIso(inicio);
    const ff = this.fechaDesdeIso(fin);

    if (periodo === 'mes') {
      return fi.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }

    const mesFin = ff.toLocaleDateString('es-ES', { month: 'long' });
    if (fi.getFullYear() !== ff.getFullYear()) {
      const mesInicio = fi.toLocaleDateString('es-ES', { month: 'long' });
      return `${fi.getDate()} de ${mesInicio} de ${fi.getFullYear()} - ${ff.getDate()} de ${mesFin} de ${ff.getFullYear()}`;
    }
    if (fi.getMonth() !== ff.getMonth()) {
      const mesInicio = fi.toLocaleDateString('es-ES', { month: 'long' });
      return `${fi.getDate()} de ${mesInicio} - ${ff.getDate()} de ${mesFin} de ${ff.getFullYear()}`;
    }
    return `${fi.getDate()} - ${ff.getDate()} de ${mesFin} de ${ff.getFullYear()}`;
  });

  // ---------- Modal Agendar / Editar Cita ----------
  modalAbierto = signal(false);
  citaEnEdicion = signal<Cita | null>(null);
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);

  form: FormGroup;

  // ---------- Atención clínica desde la cita ----------
  modalAtencionAbierto = signal(false);
  atencionCargando = signal(false);
  atencionGuardando = signal(false);
  atencionError = signal<string | null>(null);
  atencionCita = signal<Cita | null>(null);
  tipoFormatoAtencion = signal<AtencionCitaResponse['tipo_formato']>('general');
  medicamentosDisponibles = signal<MedicamentoAtencion[]>([]);
  pestanaAtencion = signal('general');
  readonly pestanasAtencion = [
    {id:'general', nombre:'Datos generales'}, {id:'anamnesis', nombre:'Anamnesis'},
    {id:'examen', nombre:'Examen físico'}, {id:'diagnostico', nombre:'Diagnóstico'},
    {id:'tratamiento', nombre:'Tratamiento'}, {id:'evolucion', nombre:'Evolución'},
  ];
  // Cada servicio usa su propio conjunto de secciones; nunca se reutiliza
  // el formulario completo de Consulta General para servicios no clínicos.
  tabsServicio(): Array<{id: string; nombre: string}> {
    const comun = [{id:'general', nombre:'Información'}];
    switch (this.tipoFormatoAtencion()) {
      case 'estetica': return [...comun, {id:'ficha', nombre:'Ficha de peluquería'}, {id:'evolucion', nombre:'Entrega'}];
      case 'vacunacion': return [...comun, {id:'ficha', nombre:'Registro de vacunación'}, {id:'evolucion', nombre:'Indicaciones'}];
      case 'desparasitacion': return [...comun, {id:'ficha', nombre:'Desparasitación'}, {id:'evolucion', nombre:'Seguimiento'}];
      case 'control': return [...comun, {id:'ficha', nombre:'Seguimiento'}, {id:'examen', nombre:'Evaluación'}, {id:'diagnostico', nombre:'Diagnóstico'}, {id:'tratamiento', nombre:'Plan'}, {id:'evolucion', nombre:'Evolución'}];
      case 'cirugia': return [...comun, {id:'ficha', nombre:'Procedimiento'}, {id:'examen', nombre:'Preoperatorio'}, {id:'diagnostico', nombre:'Diagnóstico'}, {id:'tratamiento', nombre:'Postoperatorio'}, {id:'evolucion', nombre:'Evolución'}];
      case 'urgencia': return [...comun, {id:'ficha', nombre:'Triaje'}, {id:'examen', nombre:'Signos vitales'}, {id:'diagnostico', nombre:'Diagnóstico'}, {id:'tratamiento', nombre:'Estabilización'}, {id:'evolucion', nombre:'Evolución'}];
      default: return this.pestanasAtencion;
    }
  }

  camposFichaServicio(): Array<{clave: string; nombre: string; tipo?: string}> {
    switch (this.tipoFormatoAtencion()) {
      case 'estetica': return [
        {clave:'estetica_estado_piel', nombre:'Estado de piel y pelaje antes del servicio'},
        {clave:'estetica_comportamiento', nombre:'Comportamiento y manejo del paciente'},
        {clave:'estetica_novedades', nombre:'Novedades, lesiones o hallazgos durante el servicio'},
        {clave:'estetica_recomendaciones', nombre:'Recomendaciones al propietario'},
      ];
      case 'control': return [
        {clave:'control_motivo', nombre:'Motivo del control / consulta previa'},
        {clave:'control_adherencia', nombre:'Cumplimiento del tratamiento anterior'},
        {clave:'control_respuesta', nombre:'Respuesta clínica y cambios observados'},
        {clave:'control_hallazgos', nombre:'Hallazgos en el seguimiento'},
        {clave:'control_proximo', nombre:'Plan de control y fecha sugerida'},
      ];
      case 'cirugia': return [
        {clave:'cirugia_ayuno', nombre:'Ayuno preoperatorio'},
        {clave:'cirugia_consentimiento', nombre:'Consentimiento informado / referencia'},
        {clave:'cirugia_riesgo', nombre:'Valoración de riesgo anestésico'},
        {clave:'cirugia_anestesia', nombre:'Protocolo anestésico y monitoreo'},
        {clave:'cirugia_hallazgos', nombre:'Hallazgos intraoperatorios'},
        {clave:'cirugia_complicaciones', nombre:'Complicaciones y manejo'},
        {clave:'cirugia_recuperacion', nombre:'Estado en recuperación'},
      ];
      case 'urgencia': return [
        {clave:'urgencia_triage', nombre:'Clasificación de triaje'},
        {clave:'urgencia_inicio', nombre:'Inicio de síntomas y circunstancia de ingreso'},
        {clave:'urgencia_estado', nombre:'Estado al ingreso / nivel de conciencia'},
        {clave:'urgencia_abc', nombre:'Evaluación primaria ABC y hallazgos críticos'},
        {clave:'urgencia_estabilizacion', nombre:'Intervenciones inmediatas y respuesta'},
        {clave:'urgencia_destino', nombre:'Destino del paciente (observación, hospitalización, remisión o alta)'},
      ];
      default: return [];
    }
  }
  requiereDiagnosticoAtencion(): boolean {
    return !['vacunacion', 'desparasitacion', 'estetica'].includes(this.tipoFormatoAtencion());
  }
  readonly camposAnamnesis = [
    {clave:'anamnesis', nombre:'Enfermedad actual y anamnesis'},
    {clave:'antecedentes', nombre:'Antecedentes médicos'},
    {clave:'alimentacion', nombre:'Alimentación y hábitos'},
    {clave:'medicacion_previa', nombre:'Medicación previa'},
  ];
  readonly camposSignos = [
    {clave:'frecuencia_cardiaca', nombre:'Frecuencia cardíaca (lpm)'},
    {clave:'frecuencia_respiratoria', nombre:'Frecuencia respiratoria (rpm)'},
    {clave:'spo2', nombre:'SpO₂ (%)'},
    {clave:'llenado_capilar', nombre:'Llenado capilar (s)'},
  ];
  readonly camposExamen = [
    {clave:'mucosas', nombre:'Mucosas'}, {clave:'hidratacion', nombre:'Hidratación'},
    {clave:'condicion_corporal', nombre:'Condición corporal'},
    {clave:'estado_general', nombre:'Estado general'},
    {clave:'examen_por_sistemas', nombre:'Exploración por sistemas'},
  ];
  profesionalAtencion(): string { return this.sessionService.usuario()?.nombre || this.atencionCita()?.veterinario_nombre || 'Sin identificar'; }
  nombreTipoAtencion(): string { return this.tiposConsulta.find(t => t.valor === this.atencionCita()?.tipo_consulta)?.etiqueta || this.atencionCita()?.tipo_consulta || ''; }
  datoClinico(clave: string): string | number | null { return this.atencion().clinicos[clave] ?? ''; }
  actualizarDatoClinico(clave: string, valor: string | number | null): void {
    this.atencion.update(a => ({...a, clinicos: {...a.clinicos, [clave]: valor}}));
  }
  // Wikidata: API pública de términos, NO catálogo veterinario clínicamente homologado.
  busquedaDiagnostico = signal('');
  diagnosticosEncontrados = signal<Array<{id:string;label:string;description:string}>>([]);
  diagnosticoBuscando = signal(false);
  diagnosticoError = signal<string | null>(null);
  readonly diagnosticoAnterior = signal<DiagnosticoAnterior | null>(null);
  readonly diagnosticoInfo = signal<string | null>(null);
  diagnosticosRegistrados = signal<Array<{id:string;label:string;description:string}>>([]);
  diagnosticoPrincipalId = signal<string | null>(null);
  diagnosticoConsultaRealizada = signal(false);
  buscarDiagnosticos(): void {
    const termino = this.busquedaDiagnostico().trim();
    if (termino.length < 3) {
      this.diagnosticoError.set('Escribe al menos 3 caracteres.');
      this.diagnosticosEncontrados.set([]);
      return;
    }
    this.diagnosticoError.set(null);
    this.diagnosticoConsultaRealizada.set(false);
    this.diagnosticosEncontrados.set([]);
    this.diagnosticoBuscando.set(true);
    const params = new HttpParams()
      .set('action', 'wbsearchentities').set('search', termino)
      .set('language', 'es').set('uselang', 'es')
      .set('type', 'item').set('limit', '20')
      .set('format', 'json').set('origin', '*');
    this.http.get<{search?: Array<{id:string;label:string;description?:string}>}>(
      'https://www.wikidata.org/w/api.php', {params}
    ).subscribe({
      next: respuesta => {
        // No filtrar por palabras como "animal" o "canino": Wikidata puede
        // devolver enfermedades válidas sin esas palabras en su descripción.
        this.diagnosticosEncontrados.set((respuesta.search ?? []).map(r => ({
          id: r.id, label: r.label, description: r.description ?? ''
        })));
        this.diagnosticoConsultaRealizada.set(true);
        this.diagnosticoBuscando.set(false);
      },
      error: () => {
        this.diagnosticoBuscando.set(false);
        this.diagnosticoError.set('No fue posible consultar Wikidata. Revisa la red o las restricciones del navegador. Puedes registrar el diagnóstico manualmente.');
      }
    });
  }
  seleccionarDiagnostico(item:{id:string;label:string;description:string}):void {
    if (!this.diagnosticosRegistrados().some(d => d.id === item.id)) {
      this.diagnosticosRegistrados.update(actuales => [...actuales, item]);
      if (!this.diagnosticoPrincipalId()) this.diagnosticoPrincipalId.set(item.id);
    }
    this.sincronizarDiagnosticos();
    this.diagnosticosEncontrados.set([]);
    this.busquedaDiagnostico.set('');
    this.diagnosticoConsultaRealizada.set(false);
  }

  marcarDiagnosticoPrincipal(id: string): void {
    const existe = this.diagnosticosRegistrados().some(
      diagnostico => diagnostico.id === id
    );

    if (!existe) {
      return;
    }

    this.diagnosticoPrincipalId.set(id);

    const diagnosticoPrincipal = this.diagnosticosRegistrados().find(
      diagnostico => diagnostico.id === id
    );

    if (diagnosticoPrincipal) {
      this.actualizarAtencion(
        'diagnostico',
        diagnosticoPrincipal.label
      );
    }
  }

  eliminarDiagnostico(id: string): void {
    this.diagnosticosRegistrados.update(actuales => actuales.filter(d => d.id !== id));
    if (this.diagnosticoPrincipalId() === id) this.diagnosticoPrincipalId.set(null);
    this.sincronizarDiagnosticos();
  }
  private sincronizarDiagnosticos(): void {
    const lista = this.diagnosticosRegistrados();
    const principal = lista.find(d => d.id === this.diagnosticoPrincipalId());
    this.actualizarAtencion('diagnostico', principal?.label ?? '');
    this.atencion.update(a => ({...a, clinicos: {
      ...a.clinicos,
      diagnostico_codigo: principal?.id ?? '',
      diagnostico_fuente: principal ? 'Wikidata' : '',
      diagnostico_descripcion: principal?.description ?? '',
      diagnostico_principal_id: principal?.id ?? '',
      diagnosticos_registrados: JSON.stringify(lista.map(d => ({
        ...d, principal: d.id === this.diagnosticoPrincipalId(), fuente: 'Wikidata'
      })))
    }}));
  }

  /**
 * Agrega diagnósticos provenientes de una atención anterior.
 * Conserva los diagnósticos que ya estén seleccionados.
 */
  private incorporarDiagnosticosAnteriores(
    anteriores: Array<{
      id: string;
      label: string;
      description: string;
    }>,
    principalAnteriorId?: string
  ): void {
    const actuales = this.diagnosticosRegistrados();
    const idsActuales = new Set(actuales.map(d => d.id));

    const nuevos = anteriores.filter(
      d => d.id && d.label && !idsActuales.has(d.id)
    );

    this.diagnosticosRegistrados.set([...actuales, ...nuevos]);

    if (!this.diagnosticoPrincipalId()) {
      const todos = this.diagnosticosRegistrados();

      const principalValido = todos.some(
        d => d.id === principalAnteriorId
      );

      const id = principalValido
        ? principalAnteriorId!
        : todos[0]?.id;

      if (id) {
        this.marcarDiagnosticoPrincipal(id);
      }
    }
  }

  traerDiagnosticosUltimaEvolucion(): void {
    this.diagnosticoError.set(null);
    this.diagnosticoInfo.set(null);

    const anterior = this.diagnosticoAnterior();
    if (!anterior || anterior.diagnosticos.length === 0) {
      this.diagnosticoInfo.set('El paciente no tiene diagnósticos registrados en evoluciones anteriores.');
      return;
    }

    const antes = this.diagnosticosRegistrados().length;
    this.incorporarDiagnosticosAnteriores(anterior.diagnosticos, anterior.principal_id);
    this.sincronizarDiagnosticos();
    const agregados = this.diagnosticosRegistrados().length - antes;

    if (agregados === 0) {
      this.diagnosticoInfo.set('Los diagnósticos de la última evolución ya estaban agregados.');
      return;
    }

    const fecha = anterior.fecha
      ? this.fechaDesdeIso(anterior.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;
    this.diagnosticoInfo.set(
      fecha
        ? `Se incorporaron los diagnósticos de la evolución del ${fecha}.`
        : 'Se incorporaron los diagnósticos de la última evolución.'
    );
  }

  // Registro de estética: independiente de las formulaciones médicas.
  readonly serviciosEstetica = [
    'Baño', 'Corte de pelo', 'Corte de uñas', 'Limpieza de oídos',
    'Cepillado / desenredado', 'Limpieza dental estética', 'Baño medicado', 'Otro',
  ];
  serviciosEsteticaSeleccionados = signal<string[]>([]);
  productosCosmeticos = signal<Array<{medicamento_id: string; nombre: string; busqueda: string; cantidad: number | null; unidad: string}>>([]);
  insumosDisponibles = signal<Medicamento[]>([]);
  insumosCargando = signal(false);
  insumosError = signal<string | null>(null);
  private empresaInsumos: string | null = null;
  private temporizadorBusquedaInsumos: ReturnType<typeof setTimeout> | null = null;
  private solicitudBusquedaInsumos?: Subscription;
  private numeroBusquedaInsumos = 0;

  buscarInsumos(texto: string): Medicamento[] {
    const termino = texto.trim().toLocaleLowerCase('es');
    return this.insumosDisponibles().filter(p =>
      p.nombre.toLocaleLowerCase('es').includes(termino) || p.codigo.toLocaleLowerCase('es').includes(termino)
    ).slice(0, 30);
  }

  // El buscador consulta la BD cada vez que cambia el texto, con debounce.
  cargarInsumosEstetica(empresaId: string): void {
    this.empresaInsumos = empresaId;
    this.insumosDisponibles.set([]);
    this.insumosError.set(null);
  }

  buscarInsumosEnServidor(texto: string): void {
    if (this.temporizadorBusquedaInsumos) clearTimeout(this.temporizadorBusquedaInsumos);
    this.solicitudBusquedaInsumos?.unsubscribe();
    const numero = ++this.numeroBusquedaInsumos;
    this.insumosDisponibles.set([]);
    this.insumosError.set(null);
    if (!texto.trim()) {
      this.insumosCargando.set(false);
      return;
    }
    this.insumosCargando.set(true);
    this.temporizadorBusquedaInsumos = setTimeout(() => {
      this.solicitudBusquedaInsumos = this.farmaciaService
        .obtenerInsumosParaCita(this.alcanceEscritura(this.empresaInsumos), texto.trim())
        .subscribe({
          next: res => {
            if (numero !== this.numeroBusquedaInsumos) return;
            this.insumosDisponibles.set(res.data ?? []);
            this.insumosCargando.set(false);
          },
          error: err => {
            if (numero !== this.numeroBusquedaInsumos) return;
            this.insumosCargando.set(false);
            this.insumosError.set(`No se pudieron consultar los productos (${err.status || 'red'}).`);
          },
        });
    }, 250);
  }
  readonly unidadesCosmeticas = ['ml', 'g', 'kg', 'unidades', 'aplicaciones', 'sobres'];

  cambiarServicioEstetica(servicio: string, seleccionado: boolean): void {
    this.serviciosEsteticaSeleccionados.update(lista => seleccionado
      ? [...new Set([...lista, servicio])]
      : lista.filter(item => item !== servicio));
  }

  agregarProductoCosmetico(): void {
    this.productosCosmeticos.update(lista => [...lista, {medicamento_id: '', nombre: '', busqueda: '', cantidad: null, unidad: 'unidades'}]);
  }

  editarProductoCosmetico(indice: number, campo: 'busqueda' | 'cantidad' | 'unidad', valor: string | number | null): void {
    this.productosCosmeticos.update(lista => lista.map((producto, i) => i === indice
      ? {...producto, [campo]: campo === 'cantidad' ? (valor === '' || valor === null ? null : Number(valor)) : valor, ...(campo === 'busqueda' ? {medicamento_id: '', nombre: '', cantidad: null} : {})}
      : producto));
    if (campo === 'busqueda') this.buscarInsumosEnServidor(String(valor ?? ''));
  }

  // La presentación identifica el contenido del producto (p. ej. "500 ml").
  // No confundir con stock, que representa unidades disponibles en inventario.
  presentacionInsumo(insumo: Medicamento): { cantidad: number | null; unidad: string } {
    // Primero: la presentación puede contener el contenido neto: "500 ml".
    const texto = String(insumo.presentacion ?? '').trim();
    const unidades = '(ml|mililitros?|l|litros?|kg|kilogramos?|gr|gramos?|g|unidades?|unds?|uds?|sobres?|aplicaciones?)';
    const encontrado = texto.match(new RegExp(String.raw`(\d+(?:[.,]\d+)?)\s*${unidades}\b`, 'i'));
    const normalizar = (valor: number, unidadOriginal: string): { cantidad: number; unidad: string } | null => {
      const u = unidadOriginal.trim().toLowerCase();
      if (/^(ml|mililitro)/.test(u)) return { cantidad: valor, unidad: 'ml' };
      if (/^(l|litro)/.test(u)) return { cantidad: valor * 1000, unidad: 'ml' };
      if (/^(kg|kilogramo)/.test(u)) return { cantidad: valor, unidad: 'kg' };
      if (/^(g|gr|gramo)/.test(u)) return { cantidad: valor, unidad: 'g' };
      if (/^sobre/.test(u)) return { cantidad: valor, unidad: 'sobres' };
      if (/^aplicaci/.test(u)) return { cantidad: valor, unidad: 'aplicaciones' };
      if (/^(unid|und|ud)/.test(u)) return { cantidad: valor, unidad: 'unidades' };
      return null;
    };
    if (encontrado) {
      const v = Number(encontrado[1].replace(',', '.'));
      const dato = Number.isFinite(v) && v > 0 ? normalizar(v, encontrado[2]) : null;
      if (dato) return dato;
    }
    // Si "presentacion" es "Frasco", "Botella", etc., utilizar la cantidad
    // y unidad registradas en los campos de Farmacia.
    const v = Number(insumo.concentracion);
    if (Number.isFinite(v) && v > 0 && insumo.concentracion_unidad) {
      const dato = normalizar(v, insumo.concentracion_unidad);
      if (dato) return dato;
    }
    // No confundir existencias en inventario (stock) con contenido/consumo.
    return { cantidad: null, unidad: 'unidades' };
  }

  seleccionarInsumoCosmetico(indice: number, id: string): void {
    const insumo = this.insumosDisponibles().find(p => String(p.id) === String(id));
    if (!insumo) return;
    const presentacion = this.presentacionInsumo(insumo);
    this.productosCosmeticos.update(lista => lista.map((p, i) => i === indice
      ? {...p, medicamento_id: String(insumo.id), nombre: insumo.nombre,
          busqueda: insumo.nombre, cantidad: presentacion.cantidad, unidad: presentacion.unidad}
      : p));
  }

  quitarProductoCosmetico(indice: number): void {
    this.productosCosmeticos.update(lista => lista.filter((_, i) => i !== indice));
  }

  medicamentosAtencion = signal<MedicamentoAtencionPayload[]>([]);

  atencion = signal({
    fecha: this.formatoFechaIso(new Date()),
    motivo: '',
    clinicos: {} as Record<string, string | number | null>,
    peso_kg: null as number | null,
    temperatura_c: null as number | null,
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
    evolucion: '',
    detalles: {
      procedimiento: '',
      categoria: '',
      duracion: '',
      sala: '',
      prioridad: 'Media',
      indicaciones: '',
    },
    vacunacion: {
      nombre: '',
      tipo: 'Otra' as 'Antirrábica' | 'Polivalente' | 'Refuerzo' | 'Otra',
      lote: '',
      fecha_aplicacion: this.formatoFechaIso(new Date()),
      proxima_fecha: '',
      observaciones: '',
    },
    desparasitacion: {
      producto: '',
      tipo: 'Interna' as 'Interna' | 'Externa' | 'Interna y Externa',
      fecha_aplicacion: this.formatoFechaIso(new Date()),
      proxima_fecha: '',
      observaciones: '',
    },
  });

  readonly esRecepcionista = computed(() => this.sessionService.codigoRol() === 'recepcionista');
  readonly esVeterinario = computed(() => this.sessionService.codigoRol() === 'veterinario');
  readonly puedeAgendar = computed(() => this.sessionService.tienePermiso('citas.crear'));
  readonly puedeAtender = computed(() => this.sessionService.tienePermiso('citas.atender'));

  constructor() {
    this.form = this.fb.group({
      empresa_id: [''],
      paciente_id: ['', [Validators.required]],
      servicio_id: ['', [Validators.required]],
      veterinario_id: ['', [Validators.required]],
      fecha: [this.fechaSeleccionada(), [Validators.required]],
      hora_inicio: ['09:00', [Validators.required]],
      hora_fin: ['09:30'],
      tipo_consulta: [{ value: 'general', disabled: true }, [Validators.required]],
      motivo: ['', [Validators.maxLength(200)]],
      estado: ['confirmada', [Validators.required]],
      observaciones: ['', [Validators.maxLength(300)]],
    });
  }

  ngOnInit(): void {
    if (!this.esVistaSuperUsuario()) {
      this.cargarServicios();
    }

    this.cargarProfesionales();

    if (this.esVistaSuperUsuario()) {
      this.empresaService.listarOpciones().subscribe({
        next: (respuesta) => this.empresasDisponibles.set(respuesta || []),
        error: () => { },
      });

      this.form.get('empresa_id')!.valueChanges.pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((empresaId) => {
        this.quitarPaciente();
        this.cargarOpcionesFormulario(empresaId);
      });
    }

    // Sincronización automática de la agenda cada 10 segundos.
    this.actualizacionAgenda = interval(10000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Evitar consultas repetidas mientras hay una petición activa.
        if (this.consultaCitasEnCurso) return;

        // No interrumpir formularios abiertos.
        if (this.modalAbierto() || this.modalAtencionAbierto()) return;

        this.cargarCitas(true);
      });
  }

  private alcanceListado(): AlcanceApi | undefined {
    if (!this.esVistaSuperUsuario()) {
      return undefined;
    }

    const empresa = this.filtroEmpresa();
    return { plataforma: true, empresaId: empresa === 'todas' ? null : empresa };
  }

  private alcanceEscritura(empresaId?: string | null): AlcanceApi | undefined {
    return this.esVistaSuperUsuario() ? { plataforma: true, empresaId } : undefined;
  }

  private cargarOpcionesFormulario(empresaId?: string | null): void {
    if (!empresaId) {
      this.servicios.set([]);
      this.profesionalesFormulario.set([]);
      return;
    }

    const alcance = this.alcanceEscritura(empresaId);

    this.servicioService.listar(true, alcance).subscribe({
      next: (res) => this.servicios.set(res || []),
      error: () => this.servicios.set([]),
    });

    this.citaService.listarProfesionales(alcance).subscribe({
      next: (res) => this.profesionalesFormulario.set(res || []),
      error: () => this.profesionalesFormulario.set([]),
    });
  }

  private esPasado(fecha: string, hora: string): boolean {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const [h, m] = hora.split(':').map(Number);
    const ahora = new Date();
    ahora.setSeconds(0, 0);
    return new Date(anio, mes - 1, dia, h, m) < ahora;
  }

  horarioPasado(): boolean {
    const v = this.form.getRawValue();
    if (!v.fecha || !v.hora_inicio) return false;
    const cita = this.citaEnEdicion();
    if (cita && cita.fecha === v.fecha && cita.hora_inicio.substring(0, 5) === String(v.hora_inicio).substring(0, 5)) {
      return false;
    }
    return this.esPasado(v.fecha, String(v.hora_inicio));
  }

  fechaMinimaFormulario(): string {
    const hoy = this.formatoFechaIso(new Date());
    const cita = this.citaEnEdicion();
    return cita && cita.fecha < hoy ? cita.fecha : hoy;
  }

  franjaPasada(hora: string): boolean {
    const fecha = this.fechaSeleccionada();
    const hoy = this.formatoFechaIso(new Date());
    if (fecha < hoy) return true;
    return fecha === hoy && parseInt(hora.split(':')[0], 10) < new Date().getHours();
  }

  private horaMinimaDisponible(fecha: string, horaDeseada: string): string {
    if (!this.esPasado(fecha, horaDeseada)) return horaDeseada;
    const ahora = new Date();
    const minutos = Math.ceil((ahora.getHours() * 60 + ahora.getMinutes() + 1) / 15) * 15;
    const h = Math.floor(minutos / 60) % 24;
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  cargarProfesionales(): void {
    this.citaService.listarProfesionales(this.alcanceListado()).subscribe({
      next: (res) => {
        const lista = res || [];
        this.profesionales.set(lista);

        const actual = this.filtroProfesional();
        if (!actual || !lista.some((p) => p.id === actual)) {
          const propio = this.esVeterinario() ? this.sessionService.usuario()?.id : undefined;
          const elegido = lista.find((p) => p.id === propio) ?? lista[0];
          this.filtroProfesional.set(elegido?.id ?? '');
        }

        this.cargarCitas();
      },
      error: () => {
        this.profesionales.set([]);
        this.filtroProfesional.set('');
        this.citas.set([]);
      },
    });
  }

  onFiltroEmpresaChange(empresaId: string): void {
    this.filtroEmpresa.set(empresaId);
    this.filtroProfesional.set('');
    this.citas.set([]);
    this.cargarProfesionales();
  }

  alCambiarProfesional(profesionalId: string): void {
    this.filtroProfesional.set(profesionalId);
    this.cargarCitas();
  }

  cambiarPeriodo(periodo: 'dia' | 'semana' | 'mes'): void {
    this.periodo.set(periodo);
    this.cargarCitas();
  }

  cargarServicios(): void {
    this.servicioService.listar(true).subscribe({
      next: (res) => {
        this.servicios.set(res || []);
      },
      error: () => {
        this.servicios.set([]);
      },
    });
  }

  onServicioSeleccionado(servicioId: string): void {
    const servicio = this.servicios().find((s) => s.id === servicioId);
    if (!servicio) {
      this.form.patchValue({ tipo_consulta: 'general', hora_fin: '' });
      return;
    }

    this.form.patchValue({ tipo_consulta: servicio.tipo_consulta });

    const horaInicio = this.form.get('hora_inicio')?.value as string;
    if (horaInicio) {
      this.form.patchValue({ hora_fin: this.sumarMinutos(horaInicio, servicio.duracion_minutos) });
    }
  }

  private sumarMinutos(horaHHmm: string, minutos: number): string {
    const [h, m] = horaHHmm.split(':').map(Number);
    const total = h * 60 + m + minutos;
    const horaFin = Math.floor((total % (24 * 60)) / 60);
    const minFin = total % 60;
    return `${String(horaFin).padStart(2, '0')}:${String(minFin).padStart(2, '0')}`;
  }

  cargarCitas(silencioso = false): void {
    const profesional = this.filtroProfesional();

    // Identificador para descartar respuestas antiguas.
    const consultaActual = ++this.secuenciaConsultaCitas;

    // Cancelar una consulta anterior si sigue pendiente.
    this.peticionCitas?.unsubscribe();
    this.consultaCitasEnCurso = false;

    if (!profesional) {
      this.citas.set([]);
      this.cargando.set(false);
      return;
    }

    if (!silencioso) {
      this.cargando.set(true);
      this.error.set(null);
    }

    const { inicio, fin } = this.rangoPeriodo();

    this.consultaCitasEnCurso = true;

    this.peticionCitas = this.citaService.listar(
      {
        fecha_inicio: inicio,
        fecha_fin: fin,
        veterinario_id: profesional
      },
      this.alcanceListado()
    )
    .pipe(
      finalize(() => {
        if (consultaActual === this.secuenciaConsultaCitas) {
          this.consultaCitasEnCurso = false;
          this.cargando.set(false);
        }
      })
    )
    .subscribe({
      next: (data) => {
        if (consultaActual !== this.secuenciaConsultaCitas) {
          return;
        }

        this.citas.set(data || []);
        this.ultimaActualizacionAgenda.set(new Date());
        this.error.set(null);
      },

      error: (err) => {
        if (consultaActual !== this.secuenciaConsultaCitas) {
          return;
        }

        // En refrescos automáticos conservamos las citas anteriores.
        if (!silencioso) {
          this.citas.set([]);
        }

        this.error.set(
          err?.error?.message ||
          'No se pudieron actualizar las citas desde el servidor.'
        );
      }
    });
  }

  irAHoy(): void {
    this.fechaSeleccionada.set(this.formatoFechaIso(new Date()));
    this.cargarCitas();
  }

  navegar(delta: number): void {
    const [anio, mes, dia] = this.fechaSeleccionada().split('-').map(Number);
    const periodo = this.periodo();
    let destino: Date;

    if (periodo === 'mes') {
      destino = new Date(anio, mes - 1 + delta, 1);
      const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
      destino.setDate(Math.min(dia, ultimoDia));
    } else {
      destino = new Date(anio, mes - 1, dia + (periodo === 'semana' ? 7 : 1) * delta);
    }

    this.fechaSeleccionada.set(this.formatoFechaIso(destino));
    this.cargarCitas();
  }

  onFechaInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    if (valor) {
      this.fechaSeleccionada.set(valor);
      this.cargarCitas();
    }
  }

  citasEnFranja(hora: string): Cita[] {
    const horaNum = parseInt(hora.split(':')[0], 10);
    return this.citasDelDia().filter((c) => {
      const citaHoraNum = parseInt(c.hora_inicio.split(':')[0], 10);
      return citaHoraNum === horaNum;
    });
  }

  abrirModalCrear(horaInicial?: string): void {
    if (!this.puedeAgendar()) {
      this.error.set('No tiene permiso para crear citas.');
      return;
    }

    this.citaEnEdicion.set(null);
    this.errorFormulario.set(null);
    const hoy = this.formatoFechaIso(new Date());
    const fechaInicial = this.fechaSeleccionada() < hoy ? hoy : this.fechaSeleccionada();
    const horaInicio = this.horaMinimaDisponible(fechaInicial, horaInicial || '09:00');
    const horaFin = this.sumarMinutos(horaInicio, 30);
    this.pacienteElegido.set(null);

    if (this.esVistaSuperUsuario()) {
      this.servicios.set([]);
      this.profesionalesFormulario.set([]);
      this.form.reset({
        empresa_id: '',
        paciente_id: '',
        servicio_id: '',
        veterinario_id: '',
        fecha: fechaInicial,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        tipo_consulta: { value: 'general', disabled: true },
        motivo: '',
        estado: 'confirmada',
        observaciones: '',
      });
    } else {
      this.form.reset({
        empresa_id: '',
        paciente_id: '',
        servicio_id: '',
        veterinario_id: this.profesionales()[0]?.id ?? '',
        fecha: fechaInicial,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        tipo_consulta: { value: 'general', disabled: true },
        motivo: '',
        estado: 'confirmada',
        observaciones: '',
      });
    }
    this.modalAbierto.set(true);
  }

  abrirModalEditar(cita: Cita): void {
    this.citaEnEdicion.set(cita);
    this.errorFormulario.set(null);
    this.pacienteElegido.set({
      id: cita.paciente_id,
      nombre: cita.paciente_nombre,
      propietario_nombre: cita.propietario_nombre,
      propietario_celular: cita.propietario_celular,
    });
    if (this.esVistaSuperUsuario() && cita.empresa_id) {
      this.cargarOpcionesFormulario(cita.empresa_id);
    }
    this.form.reset({
      empresa_id: cita.empresa_id || '',
      paciente_id: cita.paciente_id,
      servicio_id: cita.servicio_id || '',
      veterinario_id: cita.veterinario_id ?? '',
      fecha: cita.fecha,
      hora_inicio: cita.hora_inicio,
      hora_fin: cita.hora_fin || '',
      tipo_consulta: { value: cita.tipo_consulta, disabled: true },
      motivo: cita.motivo,
      estado: cita.estado,
      observaciones: cita.observaciones || '',
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  guardar(): void {
    if (!this.puedeAgendar() && !this.citaEnEdicion()) {
      this.errorFormulario.set('No tiene permiso para crear citas.');
      return;
    }

    this.errorFormulario.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.horarioPasado()) {
      this.errorFormulario.set('No se puede agendar una cita en una fecha u hora que ya pasó.');
      return;
    }

    if (this.esVistaSuperUsuario() && !this.form.value.empresa_id) {
      this.errorFormulario.set('Selecciona la empresa a la que pertenece la cita.');
      return;
    }

    this.guardando.set(true);
    const formVal = this.form.getRawValue();
    const { empresa_id, ...restoForm } = formVal;
    const paciente = this.pacienteElegido();

    const payload: CitaPayload = {
      ...restoForm,
      motivo: this.citaEnEdicion()?.motivo ?? '',
      servicio_id: restoForm.servicio_id || null,
      paciente_nombre: paciente?.nombre || 'Paciente',
      propietario_nombre: paciente?.propietario_nombre || 'Propietario',
      propietario_celular: paciente?.propietario_celular || '',
    };

    const enEdicion = this.citaEnEdicion();
    const alcance = enEdicion
      ? this.alcanceEscritura(enEdicion.empresa_id)
      : this.alcanceEscritura(empresa_id);

    const req$ = enEdicion
      ? this.citaService.actualizar(enEdicion.id, payload, alcance)
      : this.citaService.crear(payload, alcance);

    req$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargarCitas();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(
          err?.error?.message || 'No se pudo guardar la cita en el servidor.'
        );
      },
    });
  }

  cambiarEstadoCita(cita: Cita, nuevoEstado: EstadoCita): void {
    this.citaService.cambiarEstado(cita.id, nuevoEstado, this.alcanceEscritura(cita.empresa_id)).subscribe({
      next: () => this.cargarCitas(),
      error: () => this.error.set('No se pudo actualizar el estado de la cita.'),
    });
  }

  eliminarCita(cita: Cita): void {
    const confirmado = confirm(`¿Cancelar y eliminar la cita de "${cita.paciente_nombre}"?`);
    if (!confirmado) return;

    this.citaService.eliminar(cita.id, this.alcanceEscritura(cita.empresa_id)).subscribe({
      next: () => this.cargarCitas(),
      error: () => this.error.set('No se pudo eliminar la cita en el servidor.'),
    });
  }

  marcarLlegada(cita: Cita): void {
    this.citaService.cambiarEstado(cita.id, 'cumplida', this.alcanceEscritura(cita.empresa_id)).subscribe({
      next: () => this.cargarCitas(),
      error: (err) => this.error.set(err?.error?.message || 'No se pudo registrar la llegada del paciente.'),
    });
  }

  abrirAtencion(cita: Cita): void {
    if (!this.puedeAtender()) { this.error.set('No tiene permiso para atender citas.'); return; }
    if (cita.estado !== 'cumplida') {
      this.error.set('La cita debe ser marcada como cumplida por recepción antes de iniciar la atención.');
      return;
    }

    this.atencionCargando.set(true);
    this.pestanaAtencion.set('general');
    this.atencionError.set(null);
    this.atencionCita.set(cita);

    this.atencionCitaService.obtener(cita.id, this.alcanceEscritura(cita.empresa_id)).subscribe({
      next: (respuesta) => {
        this.tipoFormatoAtencion.set(respuesta.tipo_formato);
        this.medicamentosDisponibles.set(respuesta.medicamentos || []);
        if (respuesta.tipo_formato === 'estetica') {
          this.cargarInsumosEstetica(cita.empresa_id ?? '');
        }
        this.inicializarAtencion(cita);
        this.diagnosticoAnterior.set(respuesta.diagnostico_anterior ?? null);
        this.modalAtencionAbierto.set(true);
        this.atencionCargando.set(false);
      },
      error: (err) => {
        this.atencionCargando.set(false);
        this.atencionError.set(err?.error?.message || 'No se pudo cargar el formato de atención.');
      },
    });
  }

  private inicializarAtencion(cita: Cita): void {
    const hoy = this.formatoFechaIso(new Date());
    this.atencion.set({
      fecha: hoy,
      motivo: '',
      clinicos: {tipo_diagnostico:'presuntivo'},
      peso_kg: null,
      temperatura_c: null,
      diagnostico: '',
      tratamiento: '',
      observaciones: '',
      evolucion: '',
      detalles: {
        procedimiento: '', categoria: '', duracion: '', sala: '', prioridad: 'Media', indicaciones: '',
      },
      vacunacion: {
        nombre: '', tipo: 'Otra', lote: '', fecha_aplicacion: hoy, proxima_fecha: '', observaciones: '',
      },
      desparasitacion: {
        producto: '', tipo: 'Interna', fecha_aplicacion: hoy, proxima_fecha: '', observaciones: '',
      },
    });
    this.medicamentosAtencion.set([]);
    this.serviciosEsteticaSeleccionados.set([]);
    this.productosCosmeticos.set([]);
    this.pestanaAtencion.set('general');
    this.busquedaDiagnostico.set('');
    this.diagnosticosEncontrados.set([]);
    this.diagnosticoConsultaRealizada.set(false);
    this.diagnosticosRegistrados.set([]);
    this.diagnosticoPrincipalId.set(null);
    this.diagnosticoInfo.set(null);
    this.diagnosticoError.set(null);
    this.diagnosticoAnterior.set(null);
  }

  cerrarAtencion(): void {
    if (this.atencionGuardando()) return;
    this.modalAtencionAbierto.set(false);
    this.atencionCita.set(null);
    this.diagnosticoAnterior.set(null);
    this.diagnosticoInfo.set(null);
  }

  actualizarAtencion<K extends keyof ReturnType<typeof this.atencion>>(campo: K, valor: ReturnType<typeof this.atencion>[K]): void {
    this.atencion.update((actual) => ({ ...actual, [campo]: valor }));
  }

  actualizarDetalle(campo: keyof ReturnType<typeof this.atencion>['detalles'], valor: string): void {
    this.atencion.update((actual) => ({
      ...actual,
      detalles: { ...actual.detalles, [campo]: valor },
    }));
  }

  actualizarVacunacion(campo: keyof ReturnType<typeof this.atencion>['vacunacion'], valor: string): void {
    this.atencion.update((actual) => ({
      ...actual,
      vacunacion: { ...actual.vacunacion, [campo]: valor },
    }));
  }

  actualizarDesparasitacion(campo: keyof ReturnType<typeof this.atencion>['desparasitacion'], valor: string): void {
    this.atencion.update((actual) => ({
      ...actual,
      desparasitacion: { ...actual.desparasitacion, [campo]: valor },
    }));
  }

  agregarMedicamentoAtencion(): void {
    this.medicamentosAtencion.update((lista) => [
      ...lista,
      {
        medicamento_id: '',
        dosis_cantidad: 1,
        dosis_unidad: 'dosis',
        frecuencia_horas: 8,
        duracion_dias: 1,
        via: 'Oral',
        indicaciones: null,
      },
    ]);
  }

  eliminarMedicamentoAtencion(index: number): void {
    this.medicamentosAtencion.update((lista) => lista.filter((_, i) => i !== index));
  }

  actualizarMedicamentoAtencion(index: number, campo: keyof MedicamentoAtencionPayload, valor: string | number | null): void {
    this.medicamentosAtencion.update((lista) => lista.map((item, i) => i === index ? { ...item, [campo]: valor } : item));
  }

  medicamentoSeleccionado(id: string): MedicamentoAtencion | undefined {
    return this.medicamentosDisponibles().find((med) => med.id === id);
  }

  cantidadMedicamento(index: number): number {
    const item = this.medicamentosAtencion()[index];
    if (!item) return 0;
    const administracionesDia = item.frecuencia_horas ? 24 / item.frecuencia_horas : 1;
    return Number((item.dosis_cantidad * administracionesDia * item.duracion_dias).toFixed(2));
  }

  guardarAtencion(): void {
    if (!this.puedeAtender()) { this.atencionError.set('No tiene permiso para atender citas.'); return; }
    const cita = this.atencionCita();
    const tipo = this.tipoFormatoAtencion();
    const datos = this.atencion();

    if (!cita) {
      this.atencionError.set('No se encontró la cita para registrar la atención.');
      return;
    }

    if (!datos.motivo.trim()) {
      this.atencionError.set(
        'Debes registrar el motivo de consulta antes de finalizar.'
      );
      this.pestanaAtencion.set('general');
      return;
    }

    if (this.requiereDiagnosticoAtencion() && (!this.diagnosticosRegistrados().length || !this.diagnosticoPrincipalId())) {
      this.atencionError.set('Agrega al menos un diagnóstico y selecciona el principal.');
      return;
    }

    if (tipo === 'vacunacion' && (!datos.vacunacion.nombre || !datos.vacunacion.proxima_fecha)) {
      this.atencionError.set('Completa la vacuna y la próxima fecha.');
      return;
    }

    if (tipo === 'desparasitacion' && (!datos.desparasitacion.producto || !datos.desparasitacion.proxima_fecha)) {
      this.atencionError.set('Completa el producto y la próxima fecha.');
      return;
    }

    if (tipo === 'cirugia' && (!datos.detalles.procedimiento || !datos.detalles.categoria || !datos.detalles.duracion || !datos.detalles.sala || !datos.detalles.indicaciones)) {
      this.atencionError.set('Completa los datos requeridos del procedimiento quirúrgico.');
      return;
    }

    if (this.medicamentosAtencion().some((med) => !med.medicamento_id || !med.dosis_cantidad || !med.duracion_dias || !med.via)) {
      this.atencionError.set('Completa todos los datos requeridos de los medicamentos.');
      return;
    }

    if (tipo === 'estetica' && this.serviciosEsteticaSeleccionados().length === 0) {
      this.atencionError.set('Selecciona al menos un servicio de peluquería realizado.');
      this.pestanaAtencion.set('ficha');
      return;
    }
    if (tipo === 'estetica' && this.productosCosmeticos().some(p =>
      !p.medicamento_id || p.cantidad === null || !Number.isFinite(p.cantidad) || p.cantidad <= 0 || !p.unidad)) {
      this.atencionError.set('Selecciona un insumo del catálogo y completa cantidad y unidad.');
      this.pestanaAtencion.set('ficha');
      return;
    }

    const payload: AtencionCitaPayload = {
      fecha: datos.fecha,
      motivo: datos.motivo,
      peso_kg: datos.peso_kg,
      temperatura_c: datos.temperatura_c,
      diagnostico: datos.diagnostico || null,
      tratamiento: datos.tratamiento || null,
      observaciones: datos.observaciones || null,
      evolucion: datos.evolucion || null,
      detalles: {
        ...datos.detalles,
        ...datos.clinicos,
        ...(tipo === 'estetica' ? {
          estetica_servicios: this.serviciosEsteticaSeleccionados(),
          estetica_productos_cosmeticos: this.productosCosmeticos().map(p => ({
            medicamento_id: p.medicamento_id, nombre: p.nombre, cantidad: p.cantidad, unidad: p.unidad,
          })),
        } : {}),
      },
      medicamentos: this.medicamentosAtencion(),
    };

    if (tipo === 'vacunacion') payload.vacunacion = { ...datos.vacunacion, lote: datos.vacunacion.lote || null, observaciones: datos.vacunacion.observaciones || null };
    if (tipo === 'desparasitacion') payload.desparasitacion = { ...datos.desparasitacion, observaciones: datos.desparasitacion.observaciones || null };

    this.atencionGuardando.set(true);
    this.atencionError.set(null);


    this.atencionCitaService.registrar(cita.id, payload, this.alcanceEscritura(cita.empresa_id)).subscribe({
      next: () => {
        this.atencionGuardando.set(false);
        this.modalAtencionAbierto.set(false);
        this.atencionCita.set(null);
        this.cargarCitas();
      },
      error: (err) => {
        this.atencionGuardando.set(false);
        this.atencionError.set(
          err?.error?.message ||
          'No se pudo guardar la atención clínica.'
        );
      },
    });
  }

  private fechaDesdeIso(fecha: string): Date {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }

  private calcularRango(fecha: string, periodo: 'dia' | 'semana' | 'mes'): { inicio: string; fin: string } {
    const [anio, mes, dia] = fecha.split('-').map(Number);

    if (periodo === 'semana') {
      const desfase = (new Date(anio, mes - 1, dia).getDay() + 6) % 7;
      return {
        inicio: this.formatoFechaIso(new Date(anio, mes - 1, dia - desfase)),
        fin: this.formatoFechaIso(new Date(anio, mes - 1, dia - desfase + 6)),
      };
    }

    if (periodo === 'mes') {
      return {
        inicio: this.formatoFechaIso(new Date(anio, mes - 1, 1)),
        fin: this.formatoFechaIso(new Date(anio, mes, 0)),
      };
    }

    return { inicio: fecha, fin: fecha };
  }

  private formatoFechaIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}