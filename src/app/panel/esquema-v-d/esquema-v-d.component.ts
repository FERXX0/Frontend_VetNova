import { PermisoDirective } from '../../core/directives/permiso.directive';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpresaOpcion } from '../../core/models/empresa.model';
import {
  Desparasitacion,
  EsquemaPacienteDetalle,
  EsquemaPacienteFila,
  ResumenEsquemaVD,
  Vacuna,
} from '../../core/models/esquema-vd.model';
import { Profesional } from '../../core/models/cita.model';
import { EmpresaService } from '../../core/services/empresa.service';
import { EsquemaVDService } from '../../core/services/esquema-vd.service';
import { SessionService } from '../../core/services/session.service';
import { AlcanceApi } from '../../core/utils/alcance-api';

interface FormularioRegistro {
  tipo: 'vacuna' | 'desparasitacion';
  nombre: string;
  tipoRegistro: string;
  fechaAplicacion: string;
  proximaFecha: string;
  lote: string;
  veterinarioId: string;
  observaciones: string;
}

@Component({
  selector: 'app-esquema-v-d',
  standalone: true,
  imports: [PermisoDirective, CommonModule, FormsModule],
  templateUrl: './esquema-v-d.component.html',
  styleUrl: './esquema-v-d.component.scss',
})
export class EsquemaVDComponent {
  private readonly esquemaVDService = inject(EsquemaVDService);
  private readonly empresaService = inject(EmpresaService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  private timeoutBusqueda: any = null;

  readonly esSuperUsuario = computed(() =>
    this.router.url.startsWith('/super-usuario')
  );

  readonly pacientes = signal<EsquemaPacienteFila[]>([]);
  readonly resumen = signal<ResumenEsquemaVD | null>(null);

  readonly paginaActual = signal(1);
  readonly totalPaginas = signal(1);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('Todos');
  readonly filtroEspecie = signal('Todas');

  readonly empresasDisponibles = signal<EmpresaOpcion[]>([]);
  readonly filtroEmpresa = signal('');

  readonly pacienteSeleccionado = signal<EsquemaPacienteDetalle | null>(null);
  readonly cargandoDetalle = signal(false);

  readonly modalPacienteAbierto = signal(false);
  readonly modalRegistroAbierto = signal(false);

  readonly modoEdicion = signal(false);
  readonly registroEditandoId = signal<string | null>(null);

  readonly profesionales = signal<Profesional[]>([]);
  readonly guardando = signal(false);
  readonly errorFormulario = signal<string | null>(null);

  readonly mensajeToast = signal<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  readonly formulario = signal<FormularioRegistro>(this.formularioInicial());

  constructor() {
    if (this.esSuperUsuario()) {
      this.cargarEmpresas();
    }
    this.cargarResumen();
    this.cargarPacientes();
    this.cargarProfesionales();
  }

  alcanceListado(): AlcanceApi {
    if (!this.esSuperUsuario()) {
      return { plataforma: false };
    }
    const empresaId = this.filtroEmpresa();
    return {
      plataforma: true,
      empresaId: empresaId ? empresaId : null,
    };
  }

  alcancePaciente(empresaId?: string): AlcanceApi {
    if (!this.esSuperUsuario()) {
      return { plataforma: false };
    }
    return {
      plataforma: true,
      empresaId: empresaId || this.filtroEmpresa() || null,
    };
  }

  cargarEmpresas(): void {
    this.empresaService.listarOpciones().subscribe({
      next: (lista) => this.empresasDisponibles.set(lista),
      error: () => this.mostrarToast('Error al cargar la lista de empresas.', 'error'),
    });
  }

  cargarResumen(): void {
    this.esquemaVDService.resumen(this.alcanceListado()).subscribe({
      next: (data) => this.resumen.set(data),
      error: () => this.resumen.set(null),
    });
  }

  cargarPacientes(): void {
    this.cargando.set(true);
    this.error.set(null);

    const params: Record<string, any> = {
      page: this.paginaActual(),
      per_page: 15,
    };

    if (this.busqueda().trim()) {
      params['buscar'] = this.busqueda().trim();
    }
    if (this.filtroEstado() !== 'Todos') {
      params['estado'] = this.filtroEstado();
    }
    if (this.filtroEspecie() !== 'Todas') {
      params['especie'] = this.filtroEspecie();
    }

    this.esquemaVDService.listar(params, this.alcanceListado()).subscribe({
      next: (res) => {
        this.pacientes.set(res.data);
        this.paginaActual.set(res.current_page);
        this.totalPaginas.set(res.last_page);
        this.total.set(res.total);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar los esquemas de vacunación y desparasitación.');
        this.cargando.set(false);
      },
    });
  }

  cargarProfesionales(): void {
    this.esquemaVDService.profesionales(this.alcanceListado()).subscribe({
      next: (lista) => {
        this.profesionales.set(lista);
        const usuarioActualId = this.sessionService.usuario()?.id;
        if (usuarioActualId && lista.some((p) => p.id === usuarioActualId)) {
          this.formulario.update((f) => ({ ...f, veterinarioId: usuarioActualId }));
        }
      },
      error: () => this.profesionales.set([]),
    });
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      this.cargarPacientes();
    }
  }

  onEmpresaChange(empresaId: string): void {
    this.filtroEmpresa.set(empresaId);
    this.paginaActual.set(1);
    this.cargarResumen();
    this.cargarPacientes();
    this.cargarProfesionales();
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    if (this.timeoutBusqueda) {
      clearTimeout(this.timeoutBusqueda);
    }
    this.timeoutBusqueda = setTimeout(() => {
      this.paginaActual.set(1);
      this.cargarPacientes();
    }, 350);
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
    this.paginaActual.set(1);
    this.cargarPacientes();
  }

  cambiarFiltroEspecie(valor: string): void {
    this.filtroEspecie.set(valor);
    this.paginaActual.set(1);
    this.cargarPacientes();
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('Todos');
    this.filtroEspecie.set('Todas');
    this.paginaActual.set(1);
    this.cargarPacientes();
  }

  formularioInicial(): FormularioRegistro {
    const usuarioActualId = this.sessionService.usuario()?.id;
    const profesionalValido = this.profesionales().some((p) => p.id === usuarioActualId);

    return {
      tipo: 'vacuna',
      nombre: '',
      tipoRegistro: '',
      fechaAplicacion: new Date().toISOString().split('T')[0],
      proximaFecha: '',
      lote: '',
      veterinarioId: profesionalValido && usuarioActualId ? usuarioActualId : (this.profesionales()[0]?.id || ''),
      observaciones: '',
    };
  }

  abrirPaciente(paciente: EsquemaPacienteFila): void {
    this.cargandoDetalle.set(true);
    this.modalPacienteAbierto.set(true);

    const alcance = this.alcancePaciente(paciente.empresa_id);
    this.esquemaVDService.obtener(paciente.id, alcance).subscribe({
      next: (detalle) => {
        this.pacienteSeleccionado.set(detalle);
        this.cargandoDetalle.set(false);
      },
      error: (err) => {
        this.mostrarToast(err.error?.message || 'Error al cargar el esquema del paciente.', 'error');
        this.modalPacienteAbierto.set(false);
        this.cargandoDetalle.set(false);
      },
    });
  }

  cerrarPaciente(): void {
    this.modalPacienteAbierto.set(false);
    this.pacienteSeleccionado.set(null);
  }

  abrirNuevoRegistro(tipo: 'vacuna' | 'desparasitacion'): void {
    if (!this.pacienteSeleccionado()) return;

    this.modoEdicion.set(false);
    this.registroEditandoId.set(null);
    this.errorFormulario.set(null);

    this.formulario.set({
      ...this.formularioInicial(),
      tipo,
    });

    this.modalRegistroAbierto.set(true);
  }

  editarVacuna(vacuna: Vacuna): void {
    this.modoEdicion.set(true);
    this.registroEditandoId.set(vacuna.id);
    this.errorFormulario.set(null);

    this.formulario.set({
      tipo: 'vacuna',
      nombre: vacuna.nombre,
      tipoRegistro: vacuna.tipo,
      fechaAplicacion: vacuna.fecha_aplicacion,
      proximaFecha: vacuna.proxima_fecha,
      lote: vacuna.lote || '',
      veterinarioId: vacuna.veterinario_id || '',
      observaciones: vacuna.observaciones || '',
    });

    this.modalRegistroAbierto.set(true);
  }

  editarDesparasitacion(registro: Desparasitacion): void {
    this.modoEdicion.set(true);
    this.registroEditandoId.set(registro.id);
    this.errorFormulario.set(null);

    this.formulario.set({
      tipo: 'desparasitacion',
      nombre: registro.producto,
      tipoRegistro: registro.tipo,
      fechaAplicacion: registro.fecha_aplicacion,
      proximaFecha: registro.proxima_fecha,
      lote: '',
      veterinarioId: registro.veterinario_id || '',
      observaciones: registro.observaciones || '',
    });

    this.modalRegistroAbierto.set(true);
  }

  cerrarRegistro(): void {
    this.modalRegistroAbierto.set(false);
    this.errorFormulario.set(null);
  }

  actualizarFormulario(campo: keyof FormularioRegistro, valor: string): void {
    this.formulario.update((form) => ({
      ...form,
      [campo]: valor,
    }));
  }

  guardarRegistro(): void {
    const paciente = this.pacienteSeleccionado();
    const form = this.formulario();

    if (!paciente) return;

    this.errorFormulario.set(null);

    if (!form.nombre || !form.tipoRegistro || !form.fechaAplicacion || !form.proximaFecha || !form.veterinarioId) {
      this.errorFormulario.set('Completa los campos obligatorios (*).');
      return;
    }

    this.guardando.set(true);
    const alcance = this.alcancePaciente(paciente.empresa_id);
    const id = this.registroEditandoId();

    if (form.tipo === 'vacuna') {
      const payload = {
        veterinario_id: form.veterinarioId,
        nombre: form.nombre,
        tipo: form.tipoRegistro,
        lote: form.lote || null,
        fecha_aplicacion: form.fechaAplicacion,
        proxima_fecha: form.proximaFecha,
        observaciones: form.observaciones || null,
      };

      const peticion = id
        ? this.esquemaVDService.actualizarVacuna(paciente.id, id, payload, alcance)
        : this.esquemaVDService.crearVacuna(paciente.id, payload, alcance);

      peticion.subscribe({
        next: () => {
          this.guardando.set(false);
          this.modalRegistroAbierto.set(false);
          this.mostrarToast(id ? 'Vacuna actualizada correctamente.' : 'Vacuna registrada correctamente.', 'exito');
          this.recargarTodo(paciente.id);
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorFormulario.set(err.error?.message || 'Error al guardar la vacuna.');
        },
      });
    } else {
      const payload = {
        veterinario_id: form.veterinarioId,
        producto: form.nombre,
        tipo: form.tipoRegistro,
        fecha_aplicacion: form.fechaAplicacion,
        proxima_fecha: form.proximaFecha,
        observaciones: form.observaciones || null,
      };

      const peticion = id
        ? this.esquemaVDService.actualizarDesparasitacion(paciente.id, id, payload, alcance)
        : this.esquemaVDService.crearDesparasitacion(paciente.id, payload, alcance);

      peticion.subscribe({
        next: () => {
          this.guardando.set(false);
          this.modalRegistroAbierto.set(false);
          this.mostrarToast(id ? 'Desparasitación actualizada correctamente.' : 'Desparasitación registrada correctamente.', 'exito');
          this.recargarTodo(paciente.id);
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorFormulario.set(err.error?.message || 'Error al guardar la desparasitación.');
        },
      });
    }
  }

  eliminarVacuna(vacunaId: string): void {
    const paciente = this.pacienteSeleccionado();
    if (!paciente) return;

    if (!confirm('¿Deseas eliminar esta vacuna?')) return;

    const alcance = this.alcancePaciente(paciente.empresa_id);
    this.esquemaVDService.eliminarVacuna(paciente.id, vacunaId, alcance).subscribe({
      next: () => {
        this.mostrarToast('Vacuna eliminada correctamente.', 'exito');
        this.recargarTodo(paciente.id);
      },
      error: (err) => {
        this.mostrarToast(err.error?.message || 'Error al eliminar la vacuna.', 'error');
      },
    });
  }

  eliminarDesparasitacion(id: string): void {
    const paciente = this.pacienteSeleccionado();
    if (!paciente) return;

    if (!confirm('¿Deseas eliminar esta desparasitación?')) return;

    const alcance = this.alcancePaciente(paciente.empresa_id);
    this.esquemaVDService.eliminarDesparasitacion(paciente.id, id, alcance).subscribe({
      next: () => {
        this.mostrarToast('Desparasitación eliminada correctamente.', 'exito');
        this.recargarTodo(paciente.id);
      },
      error: (err) => {
        this.mostrarToast(err.error?.message || 'Error al eliminar la desparasitación.', 'error');
      },
    });
  }

  private recargarTodo(pacienteId: string): void {
    this.cargarResumen();
    this.cargarPacientes();

    const alcance = this.alcancePaciente(this.pacienteSeleccionado()?.empresa_id);
    this.esquemaVDService.obtener(pacienteId, alcance).subscribe({
      next: (detalle) => this.pacienteSeleccionado.set(detalle),
    });
  }

  obtenerClaseEstado(estado: string): string {
    return (estado || '')
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/í/g, 'i')
      .replace(/á/g, 'a');
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '-';

    const partes = fecha.split('T')[0].split('-');
    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  mostrarToast(texto: string, tipo: 'exito' | 'error'): void {
    this.mensajeToast.set({ texto, tipo });
    setTimeout(() => this.mensajeToast.set(null), 4000);
  }
}