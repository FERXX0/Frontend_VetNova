import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Hospitalizacion {
  id: number;
  paciente: string;
  propietario: string;
  especie: string;
  raza: string;
  edad: string;
  motivo: string;
  diagnostico: string;
  fechaIngreso: string;
  horaIngreso: string;
  fechaSalidaEstimada: string;
  veterinario: string;
  ubicacion: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  estado: 'Hospitalizado' | 'En observación' | 'Listo para salida' | 'Finalizado';
  observaciones: string;
  evoluciones: Evolucion[];
}

interface Evolucion {
  id: number;
  fecha: string;
  hora: string;
  veterinario: string;
  estado: string;
  observaciones: string;
}

interface FormularioHospitalizacion {
  paciente: string;
  propietario: string;
  especie: string;
  raza: string;
  edad: string;
  motivo: string;
  diagnostico: string;
  fechaIngreso: string;
  horaIngreso: string;
  fechaSalidaEstimada: string;
  veterinario: string;
  ubicacion: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  estado: 'Hospitalizado' | 'En observación' | 'Listo para salida';
  observaciones: string;
}

interface FormularioEvolucion {
  estado: string;
  observaciones: string;
}

@Component({
  selector: 'app-hospitalizacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitalizacion.component.html',
  styleUrl: './hospitalizacion.component.scss',
})
export class HospitalizacionComponent {

  private siguienteId = 10;
  private siguienteEvolucionId = 100;

  readonly hospitalizaciones = signal<Hospitalizacion[]>([
    {
      id: 1,
      paciente: 'Max',
      propietario: 'Carlos Rodríguez',
      especie: 'Canino',
      raza: 'Labrador',
      edad: '4 años',
      motivo: 'Postoperatorio',
      diagnostico: 'Recuperación posterior a procedimiento quirúrgico',
      fechaIngreso: '2026-09-13',
      horaIngreso: '14:30',
      fechaSalidaEstimada: '2026-09-16',
      veterinario: 'Dra. Laura Gómez',
      ubicacion: 'Jaula A-01',
      prioridad: 'Media',
      estado: 'Hospitalizado',
      observaciones: 'Control de signos vitales cada 4 horas.',
      evoluciones: [
        {
          id: 1,
          fecha: '2026-09-14',
          hora: '08:00',
          veterinario: 'Dra. Laura Gómez',
          estado: 'Estable',
          observaciones: 'Paciente alerta. Tolera alimentación y permanece estable.',
        },
        {
          id: 2,
          fecha: '2026-09-14',
          hora: '16:00',
          veterinario: 'Dr. Andrés Pérez',
          estado: 'Estable',
          observaciones: 'Sin signos de complicación. Herida quirúrgica en buen estado.',
        },
      ],
    },
    {
      id: 2,
      paciente: 'Luna',
      propietario: 'María Fernández',
      especie: 'Felino',
      raza: 'Criollo',
      edad: '2 años',
      motivo: 'Deshidratación',
      diagnostico: 'Deshidratación moderada',
      fechaIngreso: '2026-09-14',
      horaIngreso: '09:15',
      fechaSalidaEstimada: '2026-09-15',
      veterinario: 'Dr. Andrés Pérez',
      ubicacion: 'Jaula B-02',
      prioridad: 'Alta',
      estado: 'En observación',
      observaciones: 'Fluidoterapia y monitoreo de hidratación.',
      evoluciones: [
        {
          id: 3,
          fecha: '2026-09-14',
          hora: '13:00',
          veterinario: 'Dr. Andrés Pérez',
          estado: 'Mejorando',
          observaciones: 'Mejora progresiva del estado de hidratación.',
        },
      ],
    },
    {
      id: 3,
      paciente: 'Rocky',
      propietario: 'Juan Martínez',
      especie: 'Canino',
      raza: 'Bulldog',
      edad: '6 años',
      motivo: 'Gastroenteritis',
      diagnostico: 'Gastroenteritis aguda',
      fechaIngreso: '2026-09-12',
      horaIngreso: '18:45',
      fechaSalidaEstimada: '2026-09-15',
      veterinario: 'Dra. Laura Gómez',
      ubicacion: 'Jaula A-03',
      prioridad: 'Alta',
      estado: 'Listo para salida',
      observaciones: 'Evolución favorable. Pendiente autorización de salida.',
      evoluciones: [
        {
          id: 4,
          fecha: '2026-09-14',
          hora: '10:00',
          veterinario: 'Dra. Laura Gómez',
          estado: 'Mejorado',
          observaciones: 'Paciente activo y con apetito recuperado.',
        },
      ],
    },
    {
      id: 4,
      paciente: 'Milo',
      propietario: 'Ana Torres',
      especie: 'Felino',
      raza: 'Siamés',
      edad: '1 año',
      motivo: 'Intoxicación',
      diagnostico: 'Intoxicación alimentaria',
      fechaIngreso: '2026-09-14',
      horaIngreso: '21:10',
      fechaSalidaEstimada: '2026-09-17',
      veterinario: 'Dr. Andrés Pérez',
      ubicacion: 'Jaula B-04',
      prioridad: 'Crítica',
      estado: 'Hospitalizado',
      observaciones: 'Monitoreo permanente.',
      evoluciones: [],
    },
    {
      id: 5,
      paciente: 'Coco',
      propietario: 'Pedro Sánchez',
      especie: 'Canino',
      raza: 'Beagle',
      edad: '3 años',
      motivo: 'Observación',
      diagnostico: 'Trauma leve',
      fechaIngreso: '2026-09-14',
      horaIngreso: '11:30',
      fechaSalidaEstimada: '2026-09-15',
      veterinario: 'Dra. Laura Gómez',
      ubicacion: 'Jaula A-05',
      prioridad: 'Baja',
      estado: 'En observación',
      observaciones: 'Observación por trauma posterior a caída.',
      evoluciones: [],
    },
  ]);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('Todos');
  readonly filtroPrioridad = signal('Todas');
  readonly filtroEspecie = signal('Todas');

  readonly modalDetalleAbierto = signal(false);
  readonly modalHospitalizacionAbierto = signal(false);
  readonly modalEvolucionAbierto = signal(false);

  readonly hospitalizacionSeleccionada =
    signal<Hospitalizacion | null>(null);

  readonly modoEdicion = signal(false);
  readonly hospitalizacionEditandoId = signal<number | null>(null);

  readonly formulario = signal<FormularioHospitalizacion>(
    this.formularioInicial()
  );

  readonly formularioEvolucion = signal<FormularioEvolucion>({
    estado: '',
    observaciones: '',
  });

  readonly hospitalizacionesFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    const prioridad = this.filtroPrioridad();
    const especie = this.filtroEspecie();

    return this.hospitalizaciones().filter((item) => {

      const coincideTexto =
        !texto ||
        item.paciente.toLowerCase().includes(texto) ||
        item.propietario.toLowerCase().includes(texto) ||
        item.motivo.toLowerCase().includes(texto) ||
        item.diagnostico.toLowerCase().includes(texto) ||
        item.ubicacion.toLowerCase().includes(texto);

      const coincideEstado =
        estado === 'Todos' || item.estado === estado;

      const coincidePrioridad =
        prioridad === 'Todas' || item.prioridad === prioridad;

      const coincideEspecie =
        especie === 'Todas' || item.especie === especie;

      return (
        coincideTexto &&
        coincideEstado &&
        coincidePrioridad &&
        coincideEspecie
      );
    });
  });

  readonly totalHospitalizados = computed(() =>
    this.hospitalizaciones().filter(
      (item) => item.estado === 'Hospitalizado'
    ).length
  );

  readonly totalObservacion = computed(() =>
    this.hospitalizaciones().filter(
      (item) => item.estado === 'En observación'
    ).length
  );

  readonly totalListosSalida = computed(() =>
    this.hospitalizaciones().filter(
      (item) => item.estado === 'Listo para salida'
    ).length
  );

  readonly totalCriticos = computed(() =>
    this.hospitalizaciones().filter(
      (item) =>
        item.prioridad === 'Crítica' ||
        item.prioridad === 'Alta'
    ).length
  );

  readonly totalEvoluciones = computed(() =>
    this.hospitalizaciones().reduce(
      (total, item) => total + item.evoluciones.length,
      0
    )
  );

  formularioInicial(): FormularioHospitalizacion {
    return {
      paciente: '',
      propietario: '',
      especie: 'Canino',
      raza: '',
      edad: '',
      motivo: '',
      diagnostico: '',
      fechaIngreso: '',
      horaIngreso: '',
      fechaSalidaEstimada: '',
      veterinario: '',
      ubicacion: '',
      prioridad: 'Media',
      estado: 'Hospitalizado',
      observaciones: '',
    };
  }

  abrirDetalle(item: Hospitalizacion): void {
    this.hospitalizacionSeleccionada.set(item);
    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.hospitalizacionSeleccionada.set(null);
  }

  abrirNuevaHospitalizacion(): void {
    this.modoEdicion.set(false);
    this.hospitalizacionEditandoId.set(null);
    this.formulario.set(this.formularioInicial());
    this.modalHospitalizacionAbierto.set(true);
  }

  editarHospitalizacion(item: Hospitalizacion): void {
    this.modoEdicion.set(true);
    this.hospitalizacionEditandoId.set(item.id);

    this.formulario.set({
      paciente: item.paciente,
      propietario: item.propietario,
      especie: item.especie,
      raza: item.raza,
      edad: item.edad,
      motivo: item.motivo,
      diagnostico: item.diagnostico,
      fechaIngreso: item.fechaIngreso,
      horaIngreso: item.horaIngreso,
      fechaSalidaEstimada: item.fechaSalidaEstimada,
      veterinario: item.veterinario,
      ubicacion: item.ubicacion,
      prioridad: item.prioridad,
      estado: item.estado === 'Finalizado'
        ? 'Hospitalizado'
        : item.estado,
      observaciones: item.observaciones,
    });

    this.modalHospitalizacionAbierto.set(true);
  }

  cerrarHospitalizacion(): void {
    this.modalHospitalizacionAbierto.set(false);
  }

  actualizarFormulario(
    campo: keyof FormularioHospitalizacion,
    valor: string
  ): void {
    this.formulario.update((form) => ({
      ...form,
      [campo]: valor,
    }));
  }

  guardarHospitalizacion(): void {
    const form = this.formulario();
    const id = this.hospitalizacionEditandoId();

    if (
      !form.paciente ||
      !form.propietario ||
      !form.motivo ||
      !form.fechaIngreso ||
      !form.horaIngreso ||
      !form.fechaSalidaEstimada ||
      !form.veterinario ||
      !form.ubicacion
    ) {
      alert('Completa los campos obligatorios.');
      return;
    }

    if (id) {

      this.hospitalizaciones.update((lista) =>
        lista.map((item) =>
          item.id === id
            ? {
                ...item,
                paciente: form.paciente,
                propietario: form.propietario,
                especie: form.especie,
                raza: form.raza,
                edad: form.edad,
                motivo: form.motivo,
                diagnostico: form.diagnostico,
                fechaIngreso: form.fechaIngreso,
                horaIngreso: form.horaIngreso,
                fechaSalidaEstimada:
                  form.fechaSalidaEstimada,
                veterinario: form.veterinario,
                ubicacion: form.ubicacion,
                prioridad: form.prioridad,
                estado: form.estado,
                observaciones: form.observaciones,
              }
            : item
        )
      );

    } else {

      const nuevaHospitalizacion: Hospitalizacion = {
        id: this.siguienteId++,
        paciente: form.paciente,
        propietario: form.propietario,
        especie: form.especie,
        raza: form.raza,
        edad: form.edad,
        motivo: form.motivo,
        diagnostico: form.diagnostico,
        fechaIngreso: form.fechaIngreso,
        horaIngreso: form.horaIngreso,
        fechaSalidaEstimada:
          form.fechaSalidaEstimada,
        veterinario: form.veterinario,
        ubicacion: form.ubicacion,
        prioridad: form.prioridad,
        estado: form.estado,
        observaciones: form.observaciones,
        evoluciones: [],
      };

      this.hospitalizaciones.update((lista) => [
        ...lista,
        nuevaHospitalizacion,
      ]);
    }

    this.modalHospitalizacionAbierto.set(false);
  }

  eliminarHospitalizacion(id: number): void {
    if (
      !confirm(
        '¿Deseas eliminar este registro de hospitalización?'
      )
    ) {
      return;
    }

    this.hospitalizaciones.update((lista) =>
      lista.filter((item) => item.id !== id)
    );

    if (
      this.hospitalizacionSeleccionada()?.id === id
    ) {
      this.cerrarDetalle();
    }
  }

  registrarSalida(item: Hospitalizacion): void {
    if (
      !confirm(
        `¿Registrar salida de ${item.paciente}?`
      )
    ) {
      return;
    }

    this.hospitalizaciones.update((lista) =>
      lista.map((hospitalizacion) =>
        hospitalizacion.id === item.id
          ? {
              ...hospitalizacion,
              estado: 'Finalizado',
            }
          : hospitalizacion
      )
    );

    this.actualizarSeleccionado(item.id);
  }

  abrirNuevaEvolucion(): void {
    if (!this.hospitalizacionSeleccionada()) {
      return;
    }

    this.formularioEvolucion.set({
      estado: '',
      observaciones: '',
    });

    this.modalEvolucionAbierto.set(true);
  }

  cerrarEvolucion(): void {
    this.modalEvolucionAbierto.set(false);
  }

  actualizarFormularioEvolucion(
    campo: keyof FormularioEvolucion,
    valor: string
  ): void {
    this.formularioEvolucion.update((form) => ({
      ...form,
      [campo]: valor,
    }));
  }

  guardarEvolucion(): void {
    const paciente =
      this.hospitalizacionSeleccionada();

    const form = this.formularioEvolucion();

    if (!paciente) {
      return;
    }

    if (!form.estado || !form.observaciones) {
      alert('Completa el estado y las observaciones.');
      return;
    }

    const ahora = new Date();

    const fecha = ahora.toISOString().split('T')[0];

    const hora = ahora
      .toTimeString()
      .substring(0, 5);

    const nuevaEvolucion: Evolucion = {
      id: this.siguienteEvolucionId++,
      fecha,
      hora,
      veterinario: 'Usuario actual',
      estado: form.estado,
      observaciones: form.observaciones,
    };

    this.hospitalizaciones.update((lista) =>
      lista.map((item) =>
        item.id === paciente.id
          ? {
              ...item,
              evoluciones: [
                ...item.evoluciones,
                nuevaEvolucion,
              ],
            }
          : item
      )
    );

    this.actualizarSeleccionado(paciente.id);
    this.modalEvolucionAbierto.set(false);
  }

  private actualizarSeleccionado(id: number): void {
    const actualizado =
      this.hospitalizaciones().find(
        (item) => item.id === id
      );

    this.hospitalizacionSeleccionada.set(
      actualizado ?? null
    );
  }

  obtenerClaseEstado(estado: string): string {
    return estado
      .toLowerCase()
      .replaceAll(' ', '-')
      .replace('ó', 'o');
  }

  obtenerClasePrioridad(
    prioridad: string
  ): string {
    return prioridad
      .toLowerCase()
      .replace('í', 'i');
  }

  formatearFecha(fecha: string): string {
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
    this.filtroEspecie.set('Todas');
  }
}