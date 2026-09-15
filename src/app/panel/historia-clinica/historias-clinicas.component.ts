import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ConsultaClinica {
  id: number;
  fecha: string;
  veterinario: string;
  motivo: string;
  peso: string;
  temperatura: string;
  diagnostico: string;
  tratamiento: string;
  medicamentos: string;
  observaciones: string;
  evolucion: string;
}

interface HistoriaClinica {
  id: number;
  paciente: string;
  identificacion: string;
  especie: string;
  raza: string;
  sexo: string;
  edad: string;
  propietario: string;
  telefono: string;
  estado: 'Activo' | 'Inactivo';
  ultimaConsulta: string;
  antecedentes: string;
  alergias: string;
  observaciones: string;
  consultas: ConsultaClinica[];
}

interface FormularioConsulta {
  fecha: string;
  veterinario: string;
  motivo: string;
  peso: string;
  temperatura: string;
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
  styleUrls: ['./historias-clinicas.component.scss']
})
export class HistoriasClinicasComponent {

  // =========================================================
  // ESTADO
  // =========================================================

  modalConsultaAbierto = signal(false);
  modalHistoriaAbierto = signal(false);

  modoEdicionConsulta = signal(false);

  historiaSeleccionada = signal<HistoriaClinica | null>(null);
  consultaEditandoId = signal<number | null>(null);

  busqueda = signal('');
  filtroEspecie = signal('Todos');
  filtroEstado = signal('Todos');

  mensaje = signal('');
  tipoMensaje = signal<'success' | 'error'>('success');

  // =========================================================
  // FILTROS
  // =========================================================

  readonly especies = [
    'Canino',
    'Felino',
    'Ave',
    'Exótico'
  ];

  // =========================================================
  // FORMULARIO CONSULTA
  // =========================================================

  formularioConsulta = signal<FormularioConsulta>({
    fecha: this.obtenerFechaActual(),
    veterinario: '',
    motivo: '',
    peso: '',
    temperatura: '',
    diagnostico: '',
    tratamiento: '',
    medicamentos: '',
    observaciones: '',
    evolucion: ''
  });

  // =========================================================
  // DATOS MOCK
  // =========================================================

  historias = signal<HistoriaClinica[]>([
    {
      id: 1,
      paciente: 'Max',
      identificacion: 'PAC-0001',
      especie: 'Canino',
      raza: 'Golden Retriever',
      sexo: 'Macho',
      edad: '5 años',
      propietario: 'Juan Pérez',
      telefono: '300 456 7890',
      estado: 'Activo',
      ultimaConsulta: '2026-09-10',
      antecedentes:
        'Vacunación al día. Antecedente de dermatitis alérgica.',
      alergias:
        'Polen y algunos alimentos.',
      observaciones:
        'Paciente tranquilo durante la consulta.',
      consultas: [
        {
          id: 1,
          fecha: '2026-09-10',
          veterinario: 'Dra. Laura Martínez',
          motivo: 'Control general',
          peso: '28 kg',
          temperatura: '38.5 °C',
          diagnostico: 'Paciente clínicamente estable.',
          tratamiento: 'Continuar alimentación actual y controles periódicos.',
          medicamentos: 'Ninguno.',
          observaciones: 'Sin alteraciones aparentes.',
          evolucion: 'Evolución favorable.'
        },
        {
          id: 2,
          fecha: '2026-05-18',
          veterinario: 'Dr. Carlos Rodríguez',
          motivo: 'Problema dermatológico',
          peso: '27.5 kg',
          temperatura: '38.7 °C',
          diagnostico: 'Dermatitis alérgica.',
          tratamiento: 'Manejo dermatológico y control de alimentación.',
          medicamentos: 'Antihistamínico.',
          observaciones: 'Prurito moderado.',
          evolucion: 'Mejoría posterior al tratamiento.'
        }
      ]
    },

    {
      id: 2,
      paciente: 'Luna',
      identificacion: 'PAC-0002',
      especie: 'Felino',
      raza: 'Siamés',
      sexo: 'Hembra',
      edad: '3 años',
      propietario: 'Mariana López',
      telefono: '311 234 5678',
      estado: 'Activo',
      ultimaConsulta: '2026-09-05',
      antecedentes:
        'Esterilizada. Vacunación completa.',
      alergias:
        'No reportadas.',
      observaciones:
        'Paciente nerviosa durante la manipulación.',
      consultas: [
        {
          id: 3,
          fecha: '2026-09-05',
          veterinario: 'Dra. Laura Martínez',
          motivo: 'Control preventivo',
          peso: '4.2 kg',
          temperatura: '38.3 °C',
          diagnostico: 'Paciente clínicamente estable.',
          tratamiento: 'Control preventivo anual.',
          medicamentos: 'Ninguno.',
          observaciones: 'Buen estado general.',
          evolucion: 'Favorable.'
        }
      ]
    },

    {
      id: 3,
      paciente: 'Rocky',
      identificacion: 'PAC-0003',
      especie: 'Canino',
      raza: 'Bulldog Francés',
      sexo: 'Macho',
      edad: '7 años',
      propietario: 'Andrés Gómez',
      telefono: '320 987 6543',
      estado: 'Activo',
      ultimaConsulta: '2026-08-27',
      antecedentes:
        'Problemas respiratorios asociados a su raza.',
      alergias:
        'No conocidas.',
      observaciones:
        'Se recomienda evitar ejercicio intenso.',
      consultas: [
        {
          id: 4,
          fecha: '2026-08-27',
          veterinario: 'Dr. Carlos Rodríguez',
          motivo: 'Dificultad respiratoria',
          peso: '12.8 kg',
          temperatura: '38.8 °C',
          diagnostico: 'Alteración respiratoria leve.',
          tratamiento: 'Reposo y seguimiento.',
          medicamentos: 'Tratamiento sintomático.',
          observaciones: 'Respiración acelerada posterior al ejercicio.',
          evolucion: 'Pendiente de seguimiento.'
        }
      ]
    },

    {
      id: 4,
      paciente: 'Milo',
      identificacion: 'PAC-0004',
      especie: 'Felino',
      raza: 'Criollo',
      sexo: 'Macho',
      edad: '2 años',
      propietario: 'Sofía Torres',
      telefono: '315 654 3210',
      estado: 'Activo',
      ultimaConsulta: '2026-08-20',
      antecedentes:
        'Sin antecedentes relevantes.',
      alergias:
        'No conocidas.',
      observaciones:
        'Buen comportamiento durante la consulta.',
      consultas: [
        {
          id: 5,
          fecha: '2026-08-20',
          veterinario: 'Dra. Laura Martínez',
          motivo: 'Vacunación',
          peso: '4.8 kg',
          temperatura: '38.2 °C',
          diagnostico: 'Paciente sano.',
          tratamiento: 'Continuar esquema preventivo.',
          medicamentos: 'Ninguno.',
          observaciones: 'Sin complicaciones.',
          evolucion: 'Favorable.'
        }
      ]
    },

    {
      id: 5,
      paciente: 'Coco',
      identificacion: 'PAC-0005',
      especie: 'Ave',
      raza: 'Periquito',
      sexo: 'Hembra',
      edad: '1 año',
      propietario: 'Daniel Torres',
      telefono: '301 222 3344',
      estado: 'Inactivo',
      ultimaConsulta: '2026-07-14',
      antecedentes:
        'Sin antecedentes registrados.',
      alergias:
        'No conocidas.',
      observaciones:
        'Paciente no ha regresado a control.',
      consultas: [
        {
          id: 6,
          fecha: '2026-07-14',
          veterinario: 'Dra. Laura Martínez',
          motivo: 'Control general',
          peso: '35 g',
          temperatura: '40 °C',
          diagnostico: 'Sin alteraciones evidentes.',
          tratamiento: 'Recomendaciones de alimentación.',
          medicamentos: 'Ninguno.',
          observaciones: 'Buen estado general.',
          evolucion: 'Favorable.'
        }
      ]
    }
  ]);

  // =========================================================
  // COMPUTED
  // =========================================================

  historiasFiltradas = computed(() => {

    const texto = this.busqueda().toLowerCase().trim();
    const especie = this.filtroEspecie();
    const estado = this.filtroEstado();

    return this.historias().filter(historia => {

      const coincideBusqueda =
        !texto ||
        historia.paciente.toLowerCase().includes(texto) ||
        historia.propietario.toLowerCase().includes(texto) ||
        historia.identificacion.toLowerCase().includes(texto);

      const coincideEspecie =
        especie === 'Todos' ||
        historia.especie === especie;

      const coincideEstado =
        estado === 'Todos' ||
        historia.estado === estado;

      return (
        coincideBusqueda &&
        coincideEspecie &&
        coincideEstado
      );
    });
  });

  totalHistorias = computed(() =>
    this.historias().length
  );

  pacientesActivos = computed(() =>
    this.historias()
      .filter(historia => historia.estado === 'Activo')
      .length
  );

  pacientesInactivos = computed(() =>
    this.historias()
      .filter(historia => historia.estado === 'Inactivo')
      .length
  );

  totalConsultas = computed(() =>
    this.historias()
      .reduce(
        (total, historia) =>
          total + historia.consultas.length,
        0
      )
  );

  // =========================================================
  // HISTORIA CLÍNICA
  // =========================================================

  verHistoria(historia: HistoriaClinica): void {
    this.historiaSeleccionada.set(historia);
    this.modalHistoriaAbierto.set(true);
  }

  cerrarHistoria(): void {
    this.modalHistoriaAbierto.set(false);
    this.historiaSeleccionada.set(null);
  }

  // =========================================================
  // NUEVA CONSULTA
  // =========================================================

  nuevaConsulta(historia: HistoriaClinica): void {

    this.historiaSeleccionada.set(historia);

    this.modoEdicionConsulta.set(false);
    this.consultaEditandoId.set(null);

    this.formularioConsulta.set({
      fecha: this.obtenerFechaActual(),
      veterinario: '',
      motivo: '',
      peso: '',
      temperatura: '',
      diagnostico: '',
      tratamiento: '',
      medicamentos: '',
      observaciones: '',
      evolucion: ''
    });

    this.modalConsultaAbierto.set(true);
  }

  // =========================================================
  // EDITAR CONSULTA
  // =========================================================

  editarConsulta(
    historia: HistoriaClinica,
    consulta: ConsultaClinica
  ): void {

    this.historiaSeleccionada.set(historia);

    this.modoEdicionConsulta.set(true);
    this.consultaEditandoId.set(consulta.id);

    this.formularioConsulta.set({
      fecha: consulta.fecha,
      veterinario: consulta.veterinario,
      motivo: consulta.motivo,
      peso: consulta.peso,
      temperatura: consulta.temperatura,
      diagnostico: consulta.diagnostico,
      tratamiento: consulta.tratamiento,
      medicamentos: consulta.medicamentos,
      observaciones: consulta.observaciones,
      evolucion: consulta.evolucion
    });

    this.modalHistoriaAbierto.set(false);
    this.modalConsultaAbierto.set(true);
  }

  cerrarModalConsulta(): void {
    this.modalConsultaAbierto.set(false);
  }

  // =========================================================
  // FORMULARIO
  // =========================================================

  actualizarCampo(
    campo: keyof FormularioConsulta,
    valor: string
  ): void {

    this.formularioConsulta.update(formulario => ({
      ...formulario,
      [campo]: valor
    }));
  }

  // =========================================================
  // GUARDAR CONSULTA
  // =========================================================

  guardarConsulta(): void {

    const historia = this.historiaSeleccionada();
    const formulario = this.formularioConsulta();

    if (!historia) {
      return;
    }

    if (!formulario.fecha) {
      this.mostrarMensaje(
        'Selecciona la fecha de la consulta.',
        'error'
      );
      return;
    }

    if (!formulario.veterinario.trim()) {
      this.mostrarMensaje(
        'Ingresa el veterinario responsable.',
        'error'
      );
      return;
    }

    if (!formulario.motivo.trim()) {
      this.mostrarMensaje(
        'Ingresa el motivo de consulta.',
        'error'
      );
      return;
    }

    if (!formulario.diagnostico.trim()) {
      this.mostrarMensaje(
        'Ingresa el diagnóstico.',
        'error'
      );
      return;
    }

    // EDITAR
    if (this.modoEdicionConsulta()) {

      const consultaId = this.consultaEditandoId();

      this.historias.update(historias =>
        historias.map(item => {

          if (item.id !== historia.id) {
            return item;
          }

          return {
            ...item,

            ultimaConsulta: formulario.fecha,

            consultas: item.consultas.map(consulta =>
              consulta.id === consultaId
                ? {
                    ...consulta,
                    ...formulario
                  }
                : consulta
            )
          };
        })
      );

      this.mostrarMensaje(
        'Consulta actualizada correctamente.',
        'success'
      );

    } else {

      // NUEVA CONSULTA

      const nuevaConsulta: ConsultaClinica = {
        id: this.generarIdConsulta(),
        ...formulario
      };

      this.historias.update(historias =>
        historias.map(item => {

          if (item.id !== historia.id) {
            return item;
          }

          return {
            ...item,
            ultimaConsulta: formulario.fecha,
            consultas: [
              nuevaConsulta,
              ...item.consultas
            ]
          };
        })
      );

      this.mostrarMensaje(
        'Consulta registrada correctamente.',
        'success'
      );
    }

    this.cerrarModalConsulta();
  }

  // =========================================================
  // ELIMINAR CONSULTA
  // =========================================================

  eliminarConsulta(
    historia: HistoriaClinica,
    consulta: ConsultaClinica
  ): void {

    const confirmar = window.confirm(
      `¿Deseas eliminar la consulta del ${this.formatearFecha(consulta.fecha)}?`
    );

    if (!confirmar) {
      return;
    }

    this.historias.update(historias =>
      historias.map(item => {

        if (item.id !== historia.id) {
          return item;
        }

        const consultasRestantes =
          item.consultas.filter(
            registro => registro.id !== consulta.id
          );

        return {
          ...item,
          consultas: consultasRestantes,
          ultimaConsulta:
            consultasRestantes.length > 0
              ? consultasRestantes[0].fecha
              : ''
        };
      })
    );

    this.historiaSeleccionada.set(
      this.historias().find(
        item => item.id === historia.id
      ) || null
    );

    this.mostrarMensaje(
      'Consulta eliminada correctamente.',
      'success'
    );
  }

  // =========================================================
  // FILTROS
  // =========================================================

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  cambiarFiltroEspecie(valor: string): void {
    this.filtroEspecie.set(valor);
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEspecie.set('Todos');
    this.filtroEstado.set('Todos');
  }

  // =========================================================
  // UTILIDADES
  // =========================================================

  obtenerIniciales(nombre: string): string {

    const partes = nombre
      .trim()
      .split(' ')
      .filter(Boolean);

    if (partes.length === 1) {
      return partes[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      partes[0][0] +
      partes[partes.length - 1][0]
    ).toUpperCase();
  }

  formatearFecha(fecha: string): string {

    if (!fecha) {
      return 'Sin registro';
    }

    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  private obtenerFechaActual(): string {

    const fecha = new Date();

    const año = fecha.getFullYear();
    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  private generarIdConsulta(): number {

    const todasLasConsultas =
      this.historias().flatMap(
        historia => historia.consultas
      );

    if (todasLasConsultas.length === 0) {
      return 1;
    }

    return (
      Math.max(
        ...todasLasConsultas.map(
          consulta => consulta.id
        )
      ) + 1
    );
  }

  private mostrarMensaje(
    mensaje: string,
    tipo: 'success' | 'error'
  ): void {

    this.mensaje.set(mensaje);
    this.tipoMensaje.set(tipo);

    setTimeout(() => {
      this.mensaje.set('');
    }, 3000);
  }
}