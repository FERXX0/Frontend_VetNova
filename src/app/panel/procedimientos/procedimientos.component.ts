import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface NotaProcedimiento {
  id: number;
  fecha: string;
  hora: string;
  usuario: string;
  nota: string;
}

interface Procedimiento {
  id: number;
  paciente: string;
  propietario: string;
  especie: string;
  raza: string;
  procedimiento: string;
  categoria: string;
  diagnostico: string;
  fecha: string;
  hora: string;
  duracion: string;
  veterinario: string;
  sala: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  estado:
    | 'Programado'
    | 'En proceso'
    | 'Completado'
    | 'Cancelado';
  indicaciones: string;
  observaciones: string;
  notas: NotaProcedimiento[];
}

interface FormularioProcedimiento {
  paciente: string;
  propietario: string;
  especie: string;
  raza: string;
  procedimiento: string;
  categoria: string;
  diagnostico: string;
  fecha: string;
  hora: string;
  duracion: string;
  veterinario: string;
  sala: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  estado:
    | 'Programado'
    | 'En proceso'
    | 'Completado'
    | 'Cancelado';
  indicaciones: string;
  observaciones: string;
}

@Component({
  selector: 'app-procedimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procedimientos.component.html',
  styleUrl: './procedimientos.component.scss',
})
export class ProcedimientosComponent {

  private siguienteId = 20;
  private siguienteNotaId = 100;

  readonly procedimientos = signal<Procedimiento[]>([
    {
      id: 1,
      paciente: 'Max',
      propietario: 'Carlos Rodríguez',
      especie: 'Canino',
      raza: 'Labrador',
      procedimiento: 'Curación de herida',
      categoria: 'Curación',
      diagnostico: 'Herida postoperatoria',
      fecha: '2026-09-15',
      hora: '09:00',
      duracion: '30 min',
      veterinario: 'Dra. Laura Gómez',
      sala: 'Procedimientos 01',
      prioridad: 'Media',
      estado: 'Programado',
      indicaciones: 'Realizar limpieza y curación de herida quirúrgica.',
      observaciones: 'Paciente en recuperación.',
      notas: [],
    },
    {
      id: 2,
      paciente: 'Luna',
      propietario: 'María Fernández',
      especie: 'Felino',
      raza: 'Criollo',
      procedimiento: 'Fluidoterapia',
      categoria: 'Terapéutico',
      diagnostico: 'Deshidratación moderada',
      fecha: '2026-09-14',
      hora: '10:30',
      duracion: '2 horas',
      veterinario: 'Dr. Andrés Pérez',
      sala: 'Procedimientos 02',
      prioridad: 'Alta',
      estado: 'En proceso',
      indicaciones: 'Administrar fluidoterapia según valoración médica.',
      observaciones: 'Monitorear hidratación.',
      notas: [
        {
          id: 1,
          fecha: '2026-09-14',
          hora: '12:00',
          usuario: 'Dr. Andrés Pérez',
          nota: 'Paciente tolera adecuadamente la terapia.',
        },
      ],
    },
    {
      id: 3,
      paciente: 'Rocky',
      propietario: 'Juan Martínez',
      especie: 'Canino',
      raza: 'Bulldog',
      procedimiento: 'Limpieza dental',
      categoria: 'Odontología',
      diagnostico: 'Cálculo dental moderado',
      fecha: '2026-09-13',
      hora: '14:00',
      duracion: '90 min',
      veterinario: 'Dra. Laura Gómez',
      sala: 'Quirófano 01',
      prioridad: 'Media',
      estado: 'Completado',
      indicaciones: 'Realizar limpieza dental completa.',
      observaciones: 'Procedimiento realizado sin complicaciones.',
      notas: [
        {
          id: 2,
          fecha: '2026-09-13',
          hora: '15:45',
          usuario: 'Dra. Laura Gómez',
          nota: 'Procedimiento finalizado. Recuperación satisfactoria.',
        },
      ],
    },
    {
      id: 4,
      paciente: 'Milo',
      propietario: 'Ana Torres',
      especie: 'Felino',
      raza: 'Siamés',
      procedimiento: 'Toma de muestra',
      categoria: 'Diagnóstico',
      diagnostico: 'Alteración gastrointestinal',
      fecha: '2026-09-15',
      hora: '11:00',
      duracion: '20 min',
      veterinario: 'Dr. Andrés Pérez',
      sala: 'Laboratorio',
      prioridad: 'Alta',
      estado: 'Programado',
      indicaciones: 'Tomar muestra para análisis de laboratorio.',
      observaciones: '',
      notas: [],
    },
    {
      id: 5,
      paciente: 'Coco',
      propietario: 'Pedro Sánchez',
      especie: 'Canino',
      raza: 'Beagle',
      procedimiento: 'Aplicación intravenosa',
      categoria: 'Terapéutico',
      diagnostico: 'Tratamiento médico',
      fecha: '2026-09-14',
      hora: '16:30',
      duracion: '30 min',
      veterinario: 'Dra. Laura Gómez',
      sala: 'Procedimientos 01',
      prioridad: 'Baja',
      estado: 'Completado',
      indicaciones: 'Aplicar tratamiento intravenoso prescrito.',
      observaciones: 'Sin novedades.',
      notas: [],
    },
    {
      id: 6,
      paciente: 'Nala',
      propietario: 'Sofía Ramírez',
      especie: 'Canino',
      raza: 'Golden Retriever',
      procedimiento: 'Sutura',
      categoria: 'Quirúrgico',
      diagnostico: 'Herida superficial',
      fecha: '2026-09-15',
      hora: '15:00',
      duracion: '45 min',
      veterinario: 'Dra. Laura Gómez',
      sala: 'Quirófano 02',
      prioridad: 'Crítica',
      estado: 'Programado',
      indicaciones: 'Realizar sutura de herida bajo protocolo.',
      observaciones: 'Requiere valoración previa.',
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
  readonly modalNotaAbierto = signal(false);

  readonly procedimientoSeleccionado =
    signal<Procedimiento | null>(null);

  readonly modoEdicion = signal(false);
  readonly procedimientoEditandoId =
    signal<number | null>(null);

  readonly formulario =
    signal<FormularioProcedimiento>(
      this.formularioInicial()
    );

  readonly formularioNota = signal({
    nota: '',
  });

  readonly procedimientosFiltrados = computed(() => {
    const texto = this.busqueda()
      .trim()
      .toLowerCase();

    const estado = this.filtroEstado();
    const prioridad = this.filtroPrioridad();
    const categoria = this.filtroCategoria();
    const especie = this.filtroEspecie();

    return this.procedimientos().filter((item) => {

      const coincideTexto =
        !texto ||
        item.paciente
          .toLowerCase()
          .includes(texto) ||
        item.propietario
          .toLowerCase()
          .includes(texto) ||
        item.procedimiento
          .toLowerCase()
          .includes(texto) ||
        item.diagnostico
          .toLowerCase()
          .includes(texto) ||
        item.veterinario
          .toLowerCase()
          .includes(texto);

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

  readonly totalProcedimientos = computed(
    () => this.procedimientos().length
  );

  readonly totalProgramados = computed(() =>
    this.procedimientos().filter(
      (item) => item.estado === 'Programado'
    ).length
  );

  readonly totalEnProceso = computed(() =>
    this.procedimientos().filter(
      (item) => item.estado === 'En proceso'
    ).length
  );

  readonly totalCompletados = computed(() =>
    this.procedimientos().filter(
      (item) => item.estado === 'Completado'
    ).length
  );

  readonly totalAltaPrioridad = computed(() =>
    this.procedimientos().filter(
      (item) =>
        item.prioridad === 'Alta' ||
        item.prioridad === 'Crítica'
    ).length
  );

  readonly totalNotas = computed(() =>
    this.procedimientos().reduce(
      (total, item) =>
        total + item.notas.length,
      0
    )
  );

  formularioInicial(): FormularioProcedimiento {
    return {
      paciente: '',
      propietario: '',
      especie: 'Canino',
      raza: '',
      procedimiento: '',
      categoria: 'Terapéutico',
      diagnostico: '',
      fecha: '',
      hora: '',
      duracion: '',
      veterinario: '',
      sala: '',
      prioridad: 'Media',
      estado: 'Programado',
      indicaciones: '',
      observaciones: '',
    };
  }

  abrirDetalle(
    procedimiento: Procedimiento
  ): void {
    this.procedimientoSeleccionado.set(
      procedimiento
    );

    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.procedimientoSeleccionado.set(null);
  }

  abrirNuevoProcedimiento(): void {
    this.modoEdicion.set(false);
    this.procedimientoEditandoId.set(null);

    this.formulario.set(
      this.formularioInicial()
    );

    this.modalFormularioAbierto.set(true);
  }

  editarProcedimiento(
    procedimiento: Procedimiento
  ): void {
    this.modoEdicion.set(true);

    this.procedimientoEditandoId.set(
      procedimiento.id
    );

    this.formulario.set({
      paciente: procedimiento.paciente,
      propietario: procedimiento.propietario,
      especie: procedimiento.especie,
      raza: procedimiento.raza,
      procedimiento: procedimiento.procedimiento,
      categoria: procedimiento.categoria,
      diagnostico: procedimiento.diagnostico,
      fecha: procedimiento.fecha,
      hora: procedimiento.hora,
      duracion: procedimiento.duracion,
      veterinario: procedimiento.veterinario,
      sala: procedimiento.sala,
      prioridad: procedimiento.prioridad,
      estado: procedimiento.estado,
      indicaciones: procedimiento.indicaciones,
      observaciones: procedimiento.observaciones,
    });

    this.modalFormularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    this.modalFormularioAbierto.set(false);
  }

  actualizarFormulario(
    campo: keyof FormularioProcedimiento,
    valor: string
  ): void {
    this.formulario.update((form) => ({
      ...form,
      [campo]: valor,
    }));
  }

  guardarProcedimiento(): void {
    const form = this.formulario();
    const id =
      this.procedimientoEditandoId();

    if (
      !form.paciente ||
      !form.propietario ||
      !form.procedimiento ||
      !form.fecha ||
      !form.hora ||
      !form.veterinario ||
      !form.sala
    ) {
      alert(
        'Completa los campos obligatorios.'
      );

      return;
    }

    if (id) {

      this.procedimientos.update(
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

      this.actualizarSeleccionado(id);

    } else {

      const nuevo: Procedimiento = {
        id: this.siguienteId++,
        ...form,
        notas: [],
      };

      this.procedimientos.update(
        (lista) => [
          ...lista,
          nuevo,
        ]
      );
    }

    this.modalFormularioAbierto.set(false);
  }

  eliminarProcedimiento(
    procedimiento: Procedimiento
  ): void {

    if (
      !confirm(
        `¿Deseas eliminar el procedimiento "${procedimiento.procedimiento}" de ${procedimiento.paciente}?`
      )
    ) {
      return;
    }

    this.procedimientos.update(
      (lista) =>
        lista.filter(
          (item) =>
            item.id !== procedimiento.id
        )
    );

    if (
      this.procedimientoSeleccionado()?.id ===
      procedimiento.id
    ) {
      this.cerrarDetalle();
    }
  }

  cambiarEstado(
    procedimiento: Procedimiento,
    estado: Procedimiento['estado']
  ): void {

    this.procedimientos.update(
      (lista) =>
        lista.map((item) =>
          item.id === procedimiento.id
            ? {
                ...item,
                estado,
              }
            : item
        )
    );

    this.actualizarSeleccionado(
      procedimiento.id
    );
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
    const procedimiento =
      this.procedimientoSeleccionado();

    const nota =
      this.formularioNota().nota.trim();

    if (!procedimiento) {
      return;
    }

    if (!nota) {
      alert(
        'Escribe una nota antes de guardar.'
      );

      return;
    }

    const ahora = new Date();

    const fecha =
      ahora.toISOString().split('T')[0];

    const hora =
      ahora
        .toTimeString()
        .substring(0, 5);

    const nuevaNota: NotaProcedimiento = {
      id: this.siguienteNotaId++,
      fecha,
      hora,
      usuario: 'Usuario actual',
      nota,
    };

    this.procedimientos.update(
      (lista) =>
        lista.map((item) =>
          item.id === procedimiento.id
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

    this.actualizarSeleccionado(
      procedimiento.id
    );

    this.modalNotaAbierto.set(false);
  }

  private actualizarSeleccionado(
    id: number
  ): void {
    const actualizado =
      this.procedimientos().find(
        (item) => item.id === id
      );

    this.procedimientoSeleccionado.set(
      actualizado ?? null
    );
  }

  obtenerClaseEstado(
    estado: string
  ): string {
    return estado
      .toLowerCase()
      .replaceAll(' ', '-')
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