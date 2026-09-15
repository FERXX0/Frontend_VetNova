import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ResultadoExamen {
  parametro: string;
  resultado: string;
  unidad: string;
  referencia: string;
  observacion: string;
}

interface NotaLaboratorio {
  id: number;
  fecha: string;
  hora: string;
  usuario: string;
  nota: string;
}

interface SolicitudLaboratorio {
  id: number;
  paciente: string;
  propietario: string;
  especie: string;
  raza: string;
  examen: string;
  categoria: string;
  diagnostico: string;
  fechaSolicitud: string;
  horaSolicitud: string;
  fechaResultadoEstimada: string;
  veterinario: string;
  laboratorio: string;
  muestra: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  estado:
    | 'Solicitado'
    | 'Muestra recibida'
    | 'En procesamiento'
    | 'Resultado disponible'
    | 'Finalizado'
    | 'Cancelado';
  observaciones: string;
  resultados: ResultadoExamen[];
  notas: NotaLaboratorio[];
}

interface FormularioLaboratorio {
  paciente: string;
  propietario: string;
  especie: string;
  raza: string;
  examen: string;
  categoria: string;
  diagnostico: string;
  fechaSolicitud: string;
  horaSolicitud: string;
  fechaResultadoEstimada: string;
  veterinario: string;
  laboratorio: string;
  muestra: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  estado:
    | 'Solicitado'
    | 'Muestra recibida'
    | 'En procesamiento'
    | 'Resultado disponible'
    | 'Finalizado'
    | 'Cancelado';
  observaciones: string;
}

interface FormularioResultado {
  parametro: string;
  resultado: string;
  unidad: string;
  referencia: string;
  observacion: string;
}

@Component({
  selector: 'app-laboratorio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './laboratorio.component.html',
  styleUrl: './laboratorio.component.scss',
})
export class LaboratorioComponent {

  private siguienteId = 20;
  private siguienteNotaId = 100;

  readonly solicitudes = signal<SolicitudLaboratorio[]>([
    {
      id: 1,
      paciente: 'Max',
      propietario: 'Carlos Rodríguez',
      especie: 'Canino',
      raza: 'Labrador',
      examen: 'Hemograma completo',
      categoria: 'Hematología',
      diagnostico: 'Control postoperatorio',
      fechaSolicitud: '2026-09-14',
      horaSolicitud: '08:30',
      fechaResultadoEstimada: '2026-09-15',
      veterinario: 'Dra. Laura Gómez',
      laboratorio: 'Laboratorio VetNova',
      muestra: 'Sangre',
      prioridad: 'Media',
      estado: 'Resultado disponible',
      observaciones: 'Control de parámetros hematológicos.',
      resultados: [
        {
          parametro: 'Hemoglobina',
          resultado: '14.2',
          unidad: 'g/dL',
          referencia: '12 - 18',
          observacion: 'Normal',
        },
        {
          parametro: 'Leucocitos',
          resultado: '9.8',
          unidad: '10³/µL',
          referencia: '6 - 17',
          observacion: 'Normal',
        },
        {
          parametro: 'Plaquetas',
          resultado: '280',
          unidad: '10³/µL',
          referencia: '200 - 500',
          observacion: 'Normal',
        },
      ],
      notas: [],
    },
    {
      id: 2,
      paciente: 'Luna',
      propietario: 'María Fernández',
      especie: 'Felino',
      raza: 'Criollo',
      examen: 'Perfil bioquímico',
      categoria: 'Bioquímica',
      diagnostico: 'Deshidratación',
      fechaSolicitud: '2026-09-14',
      horaSolicitud: '10:15',
      fechaResultadoEstimada: '2026-09-15',
      veterinario: 'Dr. Andrés Pérez',
      laboratorio: 'Laboratorio VetNova',
      muestra: 'Sangre',
      prioridad: 'Alta',
      estado: 'En procesamiento',
      observaciones: 'Evaluar función renal y hepática.',
      resultados: [],
      notas: [
        {
          id: 1,
          fecha: '2026-09-14',
          hora: '13:20',
          usuario: 'Laboratorio',
          nota: 'Muestra recibida correctamente.',
        },
      ],
    },
    {
      id: 3,
      paciente: 'Rocky',
      propietario: 'Juan Martínez',
      especie: 'Canino',
      raza: 'Bulldog',
      examen: 'Examen coprológico',
      categoria: 'Parasitología',
      diagnostico: 'Alteración gastrointestinal',
      fechaSolicitud: '2026-09-14',
      horaSolicitud: '11:00',
      fechaResultadoEstimada: '2026-09-15',
      veterinario: 'Dra. Laura Gómez',
      laboratorio: 'Laboratorio VetNova',
      muestra: 'Heces',
      prioridad: 'Media',
      estado: 'Muestra recibida',
      observaciones: 'Muestra entregada en recipiente adecuado.',
      resultados: [],
      notas: [],
    },
    {
      id: 4,
      paciente: 'Milo',
      propietario: 'Ana Torres',
      especie: 'Felino',
      raza: 'Siamés',
      examen: 'Uroanálisis',
      categoria: 'Urología',
      diagnostico: 'Alteración urinaria',
      fechaSolicitud: '2026-09-15',
      horaSolicitud: '09:40',
      fechaResultadoEstimada: '2026-09-16',
      veterinario: 'Dr. Andrés Pérez',
      laboratorio: 'Laboratorio VetNova',
      muestra: 'Orina',
      prioridad: 'Alta',
      estado: 'Solicitado',
      observaciones: 'Pendiente recepción de muestra.',
      resultados: [],
      notas: [],
    },
    {
      id: 5,
      paciente: 'Coco',
      propietario: 'Pedro Sánchez',
      especie: 'Canino',
      raza: 'Beagle',
      examen: 'Prueba de glucosa',
      categoria: 'Bioquímica',
      diagnostico: 'Control metabólico',
      fechaSolicitud: '2026-09-15',
      horaSolicitud: '14:20',
      fechaResultadoEstimada: '2026-09-15',
      veterinario: 'Dra. Laura Gómez',
      laboratorio: 'Laboratorio VetNova',
      muestra: 'Sangre',
      prioridad: 'Baja',
      estado: 'Finalizado',
      observaciones: 'Resultado dentro de parámetros esperados.',
      resultados: [
        {
          parametro: 'Glucosa',
          resultado: '92',
          unidad: 'mg/dL',
          referencia: '70 - 120',
          observacion: 'Normal',
        },
      ],
      notas: [],
    },
    {
      id: 6,
      paciente: 'Nala',
      propietario: 'Sofía Ramírez',
      especie: 'Canino',
      raza: 'Golden Retriever',
      examen: 'Radiografía abdominal',
      categoria: 'Imagenología',
      diagnostico: 'Dolor abdominal',
      fechaSolicitud: '2026-09-15',
      horaSolicitud: '16:00',
      fechaResultadoEstimada: '2026-09-15',
      veterinario: 'Dra. Laura Gómez',
      laboratorio: 'Diagnóstico VetNova',
      muestra: 'Imagen',
      prioridad: 'Urgente',
      estado: 'Solicitado',
      observaciones: 'Solicitar proyección abdominal completa.',
      resultados: [],
      notas: [],
    },
  ]);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('Todos');
  readonly filtroPrioridad = signal('Todas');
  readonly filtroCategoria = signal('Todas');
  readonly filtroEspecie = signal('Todas');

  readonly modalDetalleAbierto = signal(false);
  readonly modalFormularioAbierto = signal(false);
  readonly modalResultadoAbierto = signal(false);
  readonly modalNotaAbierto = signal(false);

  readonly solicitudSeleccionada =
    signal<SolicitudLaboratorio | null>(null);

  readonly modoEdicion = signal(false);
  readonly solicitudEditandoId =
    signal<number | null>(null);

  readonly formulario =
    signal<FormularioLaboratorio>(
      this.formularioInicial()
    );

  readonly formularioResultado =
    signal<FormularioResultado>({
      parametro: '',
      resultado: '',
      unidad: '',
      referencia: '',
      observacion: '',
    });

  readonly formularioNota = signal({
    nota: '',
  });

  readonly solicitudesFiltradas = computed(() => {
    const texto = this.busqueda()
      .trim()
      .toLowerCase();

    const estado = this.filtroEstado();
    const prioridad = this.filtroPrioridad();
    const categoria = this.filtroCategoria();
    const especie = this.filtroEspecie();

    return this.solicitudes().filter((item) => {

      const coincideTexto =
        !texto ||
        item.paciente.toLowerCase().includes(texto) ||
        item.propietario.toLowerCase().includes(texto) ||
        item.examen.toLowerCase().includes(texto) ||
        item.diagnostico.toLowerCase().includes(texto) ||
        item.veterinario.toLowerCase().includes(texto);

      const coincideEstado =
        estado === 'Todos' ||
        item.estado === estado;

      const coincidePrioridad =
        prioridad === 'Todas' ||
        item.prioridad === prioridad;

      const coincideCategoria =
        categoria === 'Todas' ||
        item.categoria === categoria;

      const coincideEspecie =
        especie === 'Todas' ||
        item.especie === especie;

      return (
        coincideTexto &&
        coincideEstado &&
        coincidePrioridad &&
        coincideCategoria &&
        coincideEspecie
      );
    });
  });

  readonly totalSolicitudes = computed(
    () => this.solicitudes().length
  );

  readonly totalPendientes = computed(() =>
    this.solicitudes().filter(
      (item) =>
        item.estado === 'Solicitado' ||
        item.estado === 'Muestra recibida'
    ).length
  );

  readonly totalProcesamiento = computed(() =>
    this.solicitudes().filter(
      (item) =>
        item.estado === 'En procesamiento'
    ).length
  );

  readonly totalResultados = computed(() =>
    this.solicitudes().filter(
      (item) =>
        item.estado === 'Resultado disponible' ||
        item.estado === 'Finalizado'
    ).length
  );

  readonly totalUrgentes = computed(() =>
    this.solicitudes().filter(
      (item) =>
        item.prioridad === 'Urgente' ||
        item.prioridad === 'Alta'
    ).length
  );

  readonly totalNotas = computed(() =>
    this.solicitudes().reduce(
      (total, item) =>
        total + item.notas.length,
      0
    )
  );

  formularioInicial(): FormularioLaboratorio {
    return {
      paciente: '',
      propietario: '',
      especie: 'Canino',
      raza: '',
      examen: '',
      categoria: 'Hematología',
      diagnostico: '',
      fechaSolicitud: '',
      horaSolicitud: '',
      fechaResultadoEstimada: '',
      veterinario: '',
      laboratorio: 'Laboratorio VetNova',
      muestra: 'Sangre',
      prioridad: 'Media',
      estado: 'Solicitado',
      observaciones: '',
    };
  }

  abrirDetalle(
    solicitud: SolicitudLaboratorio
  ): void {
    this.solicitudSeleccionada.set(
      solicitud
    );

    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.solicitudSeleccionada.set(null);
  }

  abrirNuevaSolicitud(): void {
    this.modoEdicion.set(false);
    this.solicitudEditandoId.set(null);

    this.formulario.set(
      this.formularioInicial()
    );

    this.modalFormularioAbierto.set(true);
  }

  editarSolicitud(
    solicitud: SolicitudLaboratorio
  ): void {
    this.modoEdicion.set(true);
    this.solicitudEditandoId.set(
      solicitud.id
    );

    this.formulario.set({
      paciente: solicitud.paciente,
      propietario: solicitud.propietario,
      especie: solicitud.especie,
      raza: solicitud.raza,
      examen: solicitud.examen,
      categoria: solicitud.categoria,
      diagnostico: solicitud.diagnostico,
      fechaSolicitud: solicitud.fechaSolicitud,
      horaSolicitud: solicitud.horaSolicitud,
      fechaResultadoEstimada:
        solicitud.fechaResultadoEstimada,
      veterinario: solicitud.veterinario,
      laboratorio: solicitud.laboratorio,
      muestra: solicitud.muestra,
      prioridad: solicitud.prioridad,
      estado: solicitud.estado,
      observaciones: solicitud.observaciones,
    });

    this.modalFormularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    this.modalFormularioAbierto.set(false);
  }

  actualizarFormulario(
    campo: keyof FormularioLaboratorio,
    valor: string
  ): void {
    this.formulario.update((form) => ({
      ...form,
      [campo]: valor,
    }));
  }

  guardarSolicitud(): void {
    const form = this.formulario();
    const id = this.solicitudEditandoId();

    if (
      !form.paciente ||
      !form.propietario ||
      !form.examen ||
      !form.fechaSolicitud ||
      !form.horaSolicitud ||
      !form.veterinario ||
      !form.laboratorio
    ) {
      alert(
        'Completa los campos obligatorios.'
      );

      return;
    }

    if (id) {

      this.solicitudes.update(
        (lista) =>
          lista.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...form,
                }
              : item
          )
      );

      this.actualizarSeleccionada(id);

    } else {

      const nuevaSolicitud: SolicitudLaboratorio = {
        id: this.siguienteId++,
        ...form,
        resultados: [],
        notas: [],
      };

      this.solicitudes.update(
        (lista) => [
          ...lista,
          nuevaSolicitud,
        ]
      );
    }

    this.modalFormularioAbierto.set(false);
  }

  eliminarSolicitud(
    solicitud: SolicitudLaboratorio
  ): void {

    if (
      !confirm(
        `¿Deseas eliminar la solicitud de "${solicitud.examen}" para ${solicitud.paciente}?`
      )
    ) {
      return;
    }

    this.solicitudes.update(
      (lista) =>
        lista.filter(
          (item) =>
            item.id !== solicitud.id
        )
    );

    if (
      this.solicitudSeleccionada()?.id ===
      solicitud.id
    ) {
      this.cerrarDetalle();
    }
  }

  cambiarEstado(
    solicitud: SolicitudLaboratorio,
    estado: SolicitudLaboratorio['estado']
  ): void {

    this.solicitudes.update(
      (lista) =>
        lista.map((item) =>
          item.id === solicitud.id
            ? {
                ...item,
                estado,
              }
            : item
        )
    );

    this.actualizarSeleccionada(
      solicitud.id
    );
  }

  abrirNuevoResultado(): void {
    this.formularioResultado.set({
      parametro: '',
      resultado: '',
      unidad: '',
      referencia: '',
      observacion: '',
    });

    this.modalResultadoAbierto.set(true);
  }

  cerrarResultado(): void {
    this.modalResultadoAbierto.set(false);
  }

  actualizarResultado(
    campo: keyof FormularioResultado,
    valor: string
  ): void {
    this.formularioResultado.update(
      (form) => ({
        ...form,
        [campo]: valor,
      })
    );
  }

  guardarResultado(): void {
    const solicitud =
      this.solicitudSeleccionada();

    const form =
      this.formularioResultado();

    if (!solicitud) {
      return;
    }

    if (
      !form.parametro ||
      !form.resultado
    ) {
      alert(
        'Completa el parámetro y el resultado.'
      );

      return;
    }

    const nuevoResultado: ResultadoExamen = {
      parametro: form.parametro,
      resultado: form.resultado,
      unidad: form.unidad,
      referencia: form.referencia,
      observacion: form.observacion,
    };

    this.solicitudes.update(
      (lista) =>
        lista.map((item) =>
          item.id === solicitud.id
            ? {
                ...item,
                resultados: [
                  ...item.resultados,
                  nuevoResultado,
                ],
                estado:
                  'Resultado disponible',
              }
            : item
        )
    );

    this.actualizarSeleccionada(
      solicitud.id
    );

    this.modalResultadoAbierto.set(false);
  }

  abrirNuevaNota(): void {
    this.formularioNota.set({
      nota: '',
    });

    this.modalNotaAbierto.set(true);
  }

  cerrarNota(): void {
    this.modalNotaAbierto.set(false);
  }

  actualizarNota(valor: string): void {
    this.formularioNota.set({
      nota: valor,
    });
  }

  guardarNota(): void {
    const solicitud =
      this.solicitudSeleccionada();

    const texto =
      this.formularioNota().nota.trim();

    if (!solicitud) {
      return;
    }

    if (!texto) {
      alert(
        'Escribe una nota antes de guardar.'
      );

      return;
    }

    const ahora = new Date();

    const fecha =
      ahora.toISOString().split('T')[0];

    const hora =
      ahora.toTimeString().substring(0, 5);

    const nuevaNota: NotaLaboratorio = {
      id: this.siguienteNotaId++,
      fecha,
      hora,
      usuario: 'Usuario actual',
      nota: texto,
    };

    this.solicitudes.update(
      (lista) =>
        lista.map((item) =>
          item.id === solicitud.id
            ? {
                ...item,
                notas: [
                  ...item.notas,
                  nuevaNota,
                ],
              }
            : item
        )
    );

    this.actualizarSeleccionada(
      solicitud.id
    );

    this.modalNotaAbierto.set(false);
  }

  private actualizarSeleccionada(
    id: number
  ): void {
    const actualizada =
      this.solicitudes().find(
        (item) => item.id === id
      );

    this.solicitudSeleccionada.set(
      actualizada ?? null
    );
  }

  obtenerClaseEstado(
    estado: string
  ): string {
    return estado
      .toLowerCase()
      .replaceAll(' ', '-')
      .replace('ó', 'o')
      .replace('í', 'i');
  }

  obtenerClasePrioridad(
    prioridad: string
  ): string {
    return prioridad
      .toLowerCase()
      .replace('í', 'i');
  }

  formatearFecha(
    fecha: string
  ): string {
    if (!fecha) {
      return '-';
    }

    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('Todos');
    this.filtroPrioridad.set('Todas');
    this.filtroCategoria.set('Todas');
    this.filtroEspecie.set('Todas');
  }
}