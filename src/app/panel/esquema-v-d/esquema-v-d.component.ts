import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Vacuna {
  id: number;
  nombre: string;
  tipo: string;
  fechaAplicacion: string;
  proximaFecha: string;
  lote: string;
  veterinario: string;
  observaciones: string;
}

interface Desparasitacion {
  id: number;
  producto: string;
  tipo: string;
  fechaAplicacion: string;
  proximaFecha: string;
  veterinario: string;
  observaciones: string;
}

interface EsquemaPaciente {
  id: number;
  paciente: string;
  propietario: string;
  especie: string;
  raza: string;
  edad: string;
  estado: 'Al día' | 'Próxima' | 'Vencida';
  vacunas: Vacuna[];
  desparasitaciones: Desparasitacion[];
}

interface FormularioRegistro {
  tipo: 'vacuna' | 'desparasitacion';
  nombre: string;
  tipoRegistro: string;
  fechaAplicacion: string;
  proximaFecha: string;
  lote: string;
  veterinario: string;
  observaciones: string;
}

@Component({
  selector: 'app-esquema-v-d',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './esquema-v-d.component.html',
  styleUrl: './esquema-v-d.component.scss',
})
export class EsquemaVDComponent {

  private siguienteId = 100;

  readonly pacientes = signal<EsquemaPaciente[]>([
    {
      id: 1,
      paciente: 'Max',
      propietario: 'Carlos Rodríguez',
      especie: 'Canino',
      raza: 'Labrador',
      edad: '4 años',
      estado: 'Al día',
      vacunas: [
        {
          id: 1,
          nombre: 'Rabia',
          tipo: 'Antirrábica',
          fechaAplicacion: '2026-06-15',
          proximaFecha: '2027-06-15',
          lote: 'RAB-2026-045',
          veterinario: 'Dra. Laura Gómez',
          observaciones: 'Aplicación sin novedades.',
        },
        {
          id: 2,
          nombre: 'Séxtuple Canina',
          tipo: 'Polivalente',
          fechaAplicacion: '2026-05-10',
          proximaFecha: '2027-05-10',
          lote: 'SEX-2026-112',
          veterinario: 'Dra. Laura Gómez',
          observaciones: '',
        },
      ],
      desparasitaciones: [
        {
          id: 1,
          producto: 'Drontal Plus',
          tipo: 'Interna',
          fechaAplicacion: '2026-08-10',
          proximaFecha: '2026-11-10',
          veterinario: 'Dra. Laura Gómez',
          observaciones: 'Dosis administrada según peso.',
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
      estado: 'Próxima',
      vacunas: [
        {
          id: 3,
          nombre: 'Triple Felina',
          tipo: 'Polivalente',
          fechaAplicacion: '2025-10-05',
          proximaFecha: '2026-10-05',
          lote: 'TRI-2025-087',
          veterinario: 'Dr. Andrés Pérez',
          observaciones: 'Próxima dosis de refuerzo.',
        },
      ],
      desparasitaciones: [
        {
          id: 2,
          producto: 'Milbemax',
          tipo: 'Interna',
          fechaAplicacion: '2026-07-20',
          proximaFecha: '2026-10-20',
          veterinario: 'Dr. Andrés Pérez',
          observaciones: '',
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
      estado: 'Vencida',
      vacunas: [
        {
          id: 4,
          nombre: 'Rabia',
          tipo: 'Antirrábica',
          fechaAplicacion: '2025-07-12',
          proximaFecha: '2026-07-12',
          lote: 'RAB-2025-031',
          veterinario: 'Dra. Laura Gómez',
          observaciones: 'Debe actualizar esquema.',
        },
      ],
      desparasitaciones: [],
    },
    {
      id: 4,
      paciente: 'Milo',
      propietario: 'Ana Torres',
      especie: 'Felino',
      raza: 'Siamés',
      edad: '1 año',
      estado: 'Al día',
      vacunas: [
        {
          id: 5,
          nombre: 'Triple Felina',
          tipo: 'Polivalente',
          fechaAplicacion: '2026-04-18',
          proximaFecha: '2027-04-18',
          lote: 'TRI-2026-042',
          veterinario: 'Dr. Andrés Pérez',
          observaciones: '',
        },
      ],
      desparasitaciones: [
        {
          id: 3,
          producto: 'Revolution Plus',
          tipo: 'Externa',
          fechaAplicacion: '2026-08-01',
          proximaFecha: '2026-09-01',
          veterinario: 'Dr. Andrés Pérez',
          observaciones: 'Tratamiento tópico.',
        },
      ],
    },
    {
      id: 5,
      paciente: 'Coco',
      propietario: 'Pedro Sánchez',
      especie: 'Canino',
      raza: 'Beagle',
      edad: '3 años',
      estado: 'Próxima',
      vacunas: [],
      desparasitaciones: [
        {
          id: 4,
          producto: 'NexGard',
          tipo: 'Externa',
          fechaAplicacion: '2026-08-25',
          proximaFecha: '2026-09-25',
          veterinario: 'Dra. Laura Gómez',
          observaciones: '',
        },
      ],
    },
  ]);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('Todos');
  readonly filtroEspecie = signal('Todas');

  readonly pacienteSeleccionado = signal<EsquemaPaciente | null>(null);
  readonly modalPacienteAbierto = signal(false);
  readonly modalRegistroAbierto = signal(false);

  readonly modoEdicion = signal(false);
  readonly registroEditandoId = signal<number | null>(null);

  readonly formulario = signal<FormularioRegistro>(
    this.formularioInicial()
  );

  readonly pacientesFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    const especie = this.filtroEspecie();

    return this.pacientes().filter((paciente) => {

      const coincideTexto =
        !texto ||
        paciente.paciente.toLowerCase().includes(texto) ||
        paciente.propietario.toLowerCase().includes(texto) ||
        paciente.raza.toLowerCase().includes(texto);

      const coincideEstado =
        estado === 'Todos' || paciente.estado === estado;

      const coincideEspecie =
        especie === 'Todas' || paciente.especie === especie;

      return coincideTexto && coincideEstado && coincideEspecie;
    });
  });

  readonly totalVacunas = computed(() =>
    this.pacientes().reduce(
      (total, paciente) => total + paciente.vacunas.length,
      0
    )
  );

  readonly totalDesparasitaciones = computed(() =>
    this.pacientes().reduce(
      (total, paciente) => total + paciente.desparasitaciones.length,
      0
    )
  );

  readonly pacientesAlDia = computed(() =>
    this.pacientes().filter((p) => p.estado === 'Al día').length
  );

  readonly pacientesProximos = computed(() =>
    this.pacientes().filter((p) => p.estado === 'Próxima').length
  );

  readonly pacientesVencidos = computed(() =>
    this.pacientes().filter((p) => p.estado === 'Vencida').length
  );

  formularioInicial(): FormularioRegistro {
    return {
      tipo: 'vacuna',
      nombre: '',
      tipoRegistro: '',
      fechaAplicacion: '',
      proximaFecha: '',
      lote: '',
      veterinario: '',
      observaciones: '',
    };
  }

  abrirPaciente(paciente: EsquemaPaciente): void {
    this.pacienteSeleccionado.set(paciente);
    this.modalPacienteAbierto.set(true);
  }

  cerrarPaciente(): void {
    this.modalPacienteAbierto.set(false);
    this.pacienteSeleccionado.set(null);
  }

  abrirNuevoRegistro(
    tipo: 'vacuna' | 'desparasitacion'
  ): void {
    if (!this.pacienteSeleccionado()) return;

    this.modoEdicion.set(false);
    this.registroEditandoId.set(null);

    this.formulario.set({
      ...this.formularioInicial(),
      tipo,
    });

    this.modalRegistroAbierto.set(true);
  }

  editarVacuna(vacuna: Vacuna): void {
    this.modoEdicion.set(true);
    this.registroEditandoId.set(vacuna.id);

    this.formulario.set({
      tipo: 'vacuna',
      nombre: vacuna.nombre,
      tipoRegistro: vacuna.tipo,
      fechaAplicacion: vacuna.fechaAplicacion,
      proximaFecha: vacuna.proximaFecha,
      lote: vacuna.lote,
      veterinario: vacuna.veterinario,
      observaciones: vacuna.observaciones,
    });

    this.modalRegistroAbierto.set(true);
  }

  editarDesparasitacion(
    registro: Desparasitacion
  ): void {
    this.modoEdicion.set(true);
    this.registroEditandoId.set(registro.id);

    this.formulario.set({
      tipo: 'desparasitacion',
      nombre: registro.producto,
      tipoRegistro: registro.tipo,
      fechaAplicacion: registro.fechaAplicacion,
      proximaFecha: registro.proximaFecha,
      lote: '',
      veterinario: registro.veterinario,
      observaciones: registro.observaciones,
    });

    this.modalRegistroAbierto.set(true);
  }

  cerrarRegistro(): void {
    this.modalRegistroAbierto.set(false);
  }

  actualizarFormulario(
    campo: keyof FormularioRegistro,
    valor: string
  ): void {
    this.formulario.update((form) => ({
      ...form,
      [campo]: valor,
    }));
  }

  guardarRegistro(): void {
    const paciente = this.pacienteSeleccionado();
    const form = this.formulario();

    if (!paciente) return;

    if (
      !form.nombre ||
      !form.tipoRegistro ||
      !form.fechaAplicacion ||
      !form.proximaFecha ||
      !form.veterinario
    ) {
      alert('Completa los campos obligatorios.');
      return;
    }

    const id = this.registroEditandoId();

    this.pacientes.update((lista) =>
      lista.map((p) => {

        if (p.id !== paciente.id) {
          return p;
        }

        if (form.tipo === 'vacuna') {

          const vacuna: Vacuna = {
            id: id ?? this.siguienteId++,
            nombre: form.nombre,
            tipo: form.tipoRegistro,
            fechaAplicacion: form.fechaAplicacion,
            proximaFecha: form.proximaFecha,
            lote: form.lote,
            veterinario: form.veterinario,
            observaciones: form.observaciones,
          };

          const vacunas = id
            ? p.vacunas.map((v) =>
                v.id === id ? vacuna : v
              )
            : [...p.vacunas, vacuna];

          return {
            ...p,
            vacunas,
          };
        }

        const desparasitacion: Desparasitacion = {
          id: id ?? this.siguienteId++,
          producto: form.nombre,
          tipo: form.tipoRegistro,
          fechaAplicacion: form.fechaAplicacion,
          proximaFecha: form.proximaFecha,
          veterinario: form.veterinario,
          observaciones: form.observaciones,
        };

        const desparasitaciones = id
          ? p.desparasitaciones.map((d) =>
              d.id === id ? desparasitacion : d
            )
          : [...p.desparasitaciones, desparasitacion];

        return {
          ...p,
          desparasitaciones,
        };
      })
    );

    const actualizado = this.pacientes().find(
      (p) => p.id === paciente.id
    );

    if (actualizado) {
      this.pacienteSeleccionado.set(actualizado);
    }

    this.modalRegistroAbierto.set(false);
  }

  eliminarVacuna(vacunaId: number): void {
    const paciente = this.pacienteSeleccionado();

    if (!paciente) return;

    if (!confirm('¿Deseas eliminar esta vacuna?')) {
      return;
    }

    this.pacientes.update((lista) =>
      lista.map((p) =>
        p.id === paciente.id
          ? {
              ...p,
              vacunas: p.vacunas.filter(
                (v) => v.id !== vacunaId
              ),
            }
          : p
      )
    );

    this.actualizarPacienteSeleccionado(paciente.id);
  }

  eliminarDesparasitacion(id: number): void {
    const paciente = this.pacienteSeleccionado();

    if (!paciente) return;

    if (
      !confirm(
        '¿Deseas eliminar esta desparasitación?'
      )
    ) {
      return;
    }

    this.pacientes.update((lista) =>
      lista.map((p) =>
        p.id === paciente.id
          ? {
              ...p,
              desparasitaciones:
                p.desparasitaciones.filter(
                  (d) => d.id !== id
                ),
            }
          : p
      )
    );

    this.actualizarPacienteSeleccionado(paciente.id);
  }

  private actualizarPacienteSeleccionado(
    pacienteId: number
  ): void {
    const actualizado = this.pacientes().find(
      (p) => p.id === pacienteId
    );

    this.pacienteSeleccionado.set(
      actualizado ?? null
    );
  }

  obtenerUltimaVacuna(
    paciente: EsquemaPaciente
  ): string {
    if (!paciente.vacunas.length) {
      return 'Sin registros';
    }

    return paciente.vacunas
      .map((v) => v.fechaAplicacion)
      .sort()
      .reverse()[0];
  }

  obtenerProximaVacuna(
    paciente: EsquemaPaciente
  ): string {
    if (!paciente.vacunas.length) {
      return 'Sin programar';
    }

    return paciente.vacunas
      .map((v) => v.proximaFecha)
      .sort()[0];
  }

  obtenerClaseEstado(
    estado: string
  ): string {
    return estado
      .toLowerCase()
      .replace(' ', '-')
      .replace('í', 'i');
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';

    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('Todos');
    this.filtroEspecie.set('Todas');
  }
}