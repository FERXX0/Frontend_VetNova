import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Medicamento {
  nombre: string;
  concentracion: string;
  presentacion: string;
  cantidad: number;
  unidad: string;
  frecuencia: string;
  duracion: string;
  via: string;
  indicaciones: string;
}

interface Formulacion {
  id: number;
  numero: string;
  fecha: string;

  paciente: string;
  propietario: string;
  especie: 'Canino' | 'Felino' | 'Otro';
  raza: string;
  edad: string;

  veterinario: string;
  diagnostico: string;
  observaciones: string;

  estado: 'Activa' | 'Finalizada' | 'Cancelada';
  medicamentos: Medicamento[];
}

interface FormularioMedicamento {
  nombre: string;
  concentracion: string;
  presentacion: string;
  cantidad: number;
  unidad: string;
  frecuencia: string;
  duracion: string;
  via: string;
  indicaciones: string;
}

interface FormularioFormulacion {
  paciente: string;
  propietario: string;
  especie: 'Canino' | 'Felino' | 'Otro';
  raza: string;
  edad: string;
  veterinario: string;
  diagnostico: string;
  observaciones: string;
}

@Component({
  selector: 'app-formulaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulaciones.component.html',
  styleUrl: './formulaciones.component.scss',
})
export class FormulacionesComponent {

  private contador = 7;

  readonly formulaciones = signal<Formulacion[]>([
    {
      id: 1,
      numero: 'FORM-0001',
      fecha: '2026-09-08',
      paciente: 'Max',
      propietario: 'Carlos Rodríguez',
      especie: 'Canino',
      raza: 'Labrador',
      edad: '5 años',
      veterinario: 'Dra. Laura Martínez',
      diagnostico: 'Gastritis aguda',
      observaciones: 'Administrar después de los alimentos.',
      estado: 'Activa',
      medicamentos: [
        {
          nombre: 'Omeprazol',
          concentracion: '20 mg',
          presentacion: 'Cápsulas',
          cantidad: 1,
          unidad: 'cápsula',
          frecuencia: 'Cada 24 horas',
          duracion: '7 días',
          via: 'Oral',
          indicaciones: 'Administrar en ayunas.',
        },
        {
          nombre: 'Sucralfato',
          concentracion: '1 g',
          presentacion: 'Tabletas',
          cantidad: 1,
          unidad: 'tableta',
          frecuencia: 'Cada 8 horas',
          duracion: '5 días',
          via: 'Oral',
          indicaciones: 'Administrar separado de otros medicamentos.',
        },
      ],
    },
    {
      id: 2,
      numero: 'FORM-0002',
      fecha: '2026-09-09',
      paciente: 'Luna',
      propietario: 'María González',
      especie: 'Felino',
      raza: 'Criollo',
      edad: '3 años',
      veterinario: 'Dr. Andrés Pérez',
      diagnostico: 'Dermatitis alérgica',
      observaciones: 'Control dermatológico en 10 días.',
      estado: 'Activa',
      medicamentos: [
        {
          nombre: 'Prednisolona',
          concentracion: '5 mg',
          presentacion: 'Tabletas',
          cantidad: 1,
          unidad: 'tableta',
          frecuencia: 'Cada 24 horas',
          duracion: '5 días',
          via: 'Oral',
          indicaciones: 'No suspender abruptamente.',
        },
        {
          nombre: 'Clorhexidina',
          concentracion: '2%',
          presentacion: 'Solución tópica',
          cantidad: 1,
          unidad: 'aplicación',
          frecuencia: 'Cada 12 horas',
          duracion: '10 días',
          via: 'Tópica',
          indicaciones: 'Aplicar sobre la zona afectada.',
        },
      ],
    },
    {
      id: 3,
      numero: 'FORM-0003',
      fecha: '2026-09-10',
      paciente: 'Rocky',
      propietario: 'Juan Pérez',
      especie: 'Canino',
      raza: 'Golden Retriever',
      edad: '7 años',
      veterinario: 'Dra. Laura Martínez',
      diagnostico: 'Dolor articular',
      observaciones: 'Reposo moderado y control del peso.',
      estado: 'Finalizada',
      medicamentos: [
        {
          nombre: 'Carprofeno',
          concentracion: '50 mg',
          presentacion: 'Tabletas',
          cantidad: 1,
          unidad: 'tableta',
          frecuencia: 'Cada 12 horas',
          duracion: '7 días',
          via: 'Oral',
          indicaciones: 'Administrar con alimento.',
        },
      ],
    },
    {
      id: 4,
      numero: 'FORM-0004',
      fecha: '2026-09-11',
      paciente: 'Milo',
      propietario: 'Ana Torres',
      especie: 'Felino',
      raza: 'Persa',
      edad: '2 años',
      veterinario: 'Dr. Andrés Pérez',
      diagnostico: 'Infección respiratoria',
      observaciones: 'Mantener buena hidratación.',
      estado: 'Activa',
      medicamentos: [
        {
          nombre: 'Amoxicilina',
          concentracion: '250 mg',
          presentacion: 'Suspensión',
          cantidad: 2,
          unidad: 'ml',
          frecuencia: 'Cada 12 horas',
          duracion: '7 días',
          via: 'Oral',
          indicaciones: 'Agitar antes de usar.',
        },
      ],
    },
    {
      id: 5,
      numero: 'FORM-0005',
      fecha: '2026-09-12',
      paciente: 'Coco',
      propietario: 'Pedro Ramírez',
      especie: 'Canino',
      raza: 'Beagle',
      edad: '4 años',
      veterinario: 'Dra. Laura Martínez',
      diagnostico: 'Otitis externa',
      observaciones: 'Limpiar el oído antes de aplicar el medicamento.',
      estado: 'Activa',
      medicamentos: [
        {
          nombre: 'Solución ótica',
          concentracion: '0.3%',
          presentacion: 'Gotas',
          cantidad: 4,
          unidad: 'gotas',
          frecuencia: 'Cada 12 horas',
          duracion: '10 días',
          via: 'Ótica',
          indicaciones: 'Aplicar directamente en el canal auditivo.',
        },
      ],
    },
    {
      id: 6,
      numero: 'FORM-0006',
      fecha: '2026-09-13',
      paciente: 'Nala',
      propietario: 'Sofía Castro',
      especie: 'Felino',
      raza: 'Siamés',
      edad: '1 año',
      veterinario: 'Dr. Andrés Pérez',
      diagnostico: 'Parasitismo intestinal',
      observaciones: 'Repetir desparasitación según indicación médica.',
      estado: 'Cancelada',
      medicamentos: [
        {
          nombre: 'Antiparasitario',
          concentracion: '100 mg',
          presentacion: 'Tabletas',
          cantidad: 1,
          unidad: 'tableta',
          frecuencia: 'Dosis única',
          duracion: '1 día',
          via: 'Oral',
          indicaciones: 'Administrar según peso.',
        },
      ],
    },
  ]);

  readonly busqueda = signal('');
  readonly filtroEstado = signal('Todos');
  readonly filtroEspecie = signal('Todas');

  readonly modalDetalleAbierto = signal(false);
  readonly modalFormularioAbierto = signal(false);
  readonly modalMedicamentoAbierto = signal(false);

  readonly formulacionSeleccionada = signal<Formulacion | null>(null);

  readonly modoEdicion = signal(false);
  readonly formulacionEditandoId = signal<number | null>(null);

  readonly formulario = signal<FormularioFormulacion>(
    this.formularioVacio()
  );

  readonly medicamentoFormulario = signal<FormularioMedicamento>(
    this.medicamentoVacio()
  );

  readonly medicamentosTemporales = signal<Medicamento[]>([]);

  readonly formulacionesFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    const especie = this.filtroEspecie();

    return this.formulaciones().filter((formulacion) => {
      const coincideTexto =
        !texto ||
        formulacion.numero.toLowerCase().includes(texto) ||
        formulacion.paciente.toLowerCase().includes(texto) ||
        formulacion.propietario.toLowerCase().includes(texto) ||
        formulacion.veterinario.toLowerCase().includes(texto) ||
        formulacion.diagnostico.toLowerCase().includes(texto);

      const coincideEstado =
        estado === 'Todos' || formulacion.estado === estado;

      const coincideEspecie =
        especie === 'Todas' || formulacion.especie === especie;

      return coincideTexto && coincideEstado && coincideEspecie;
    });
  });

  readonly totalFormulaciones = computed(
    () => this.formulaciones().length
  );

  readonly formulacionesActivas = computed(
    () => this.formulaciones().filter((f) => f.estado === 'Activa').length
  );

  readonly formulacionesFinalizadas = computed(
    () => this.formulaciones().filter((f) => f.estado === 'Finalizada').length
  );

  readonly totalMedicamentos = computed(() =>
    this.formulaciones().reduce(
      (total, formulacion) => total + formulacion.medicamentos.length,
      0
    )
  );

  private formularioVacio(): FormularioFormulacion {
    return {
      paciente: '',
      propietario: '',
      especie: 'Canino',
      raza: '',
      edad: '',
      veterinario: '',
      diagnostico: '',
      observaciones: '',
    };
  }

  private medicamentoVacio(): FormularioMedicamento {
    return {
      nombre: '',
      concentracion: '',
      presentacion: '',
      cantidad: 1,
      unidad: 'tableta',
      frecuencia: '',
      duracion: '',
      via: 'Oral',
      indicaciones: '',
    };
  }

  abrirDetalle(formulacion: Formulacion): void {
    this.formulacionSeleccionada.set(formulacion);
    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
  }

  abrirNuevaFormulacion(): void {
    this.modoEdicion.set(false);
    this.formulacionEditandoId.set(null);
    this.formulario.set(this.formularioVacio());
    this.medicamentosTemporales.set([]);
    this.modalFormularioAbierto.set(true);
  }

  editarFormulacion(formulacion: Formulacion): void {
    this.modoEdicion.set(true);
    this.formulacionEditandoId.set(formulacion.id);

    this.formulario.set({
      paciente: formulacion.paciente,
      propietario: formulacion.propietario,
      especie: formulacion.especie,
      raza: formulacion.raza,
      edad: formulacion.edad,
      veterinario: formulacion.veterinario,
      diagnostico: formulacion.diagnostico,
      observaciones: formulacion.observaciones,
    });

    this.medicamentosTemporales.set(
      formulacion.medicamentos.map((medicamento) => ({ ...medicamento }))
    );

    this.modalDetalleAbierto.set(false);
    this.modalFormularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    this.modalFormularioAbierto.set(false);
  }

  actualizarFormulario(
    campo: keyof FormularioFormulacion,
    valor: string
  ): void {
    this.formulario.update((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  abrirNuevoMedicamento(): void {
    this.medicamentoFormulario.set(this.medicamentoVacio());
    this.modalMedicamentoAbierto.set(true);
  }

  editarMedicamento(index: number): void {
    const medicamento = this.medicamentosTemporales()[index];

    this.medicamentoFormulario.set({
      nombre: medicamento.nombre,
      concentracion: medicamento.concentracion,
      presentacion: medicamento.presentacion,
      cantidad: medicamento.cantidad,
      unidad: medicamento.unidad,
      frecuencia: medicamento.frecuencia,
      duracion: medicamento.duracion,
      via: medicamento.via,
      indicaciones: medicamento.indicaciones,
    });

    this.modalMedicamentoAbierto.set(true);
  }

  eliminarMedicamento(index: number): void {
    this.medicamentosTemporales.update((medicamentos) =>
      medicamentos.filter((_, i) => i !== index)
    );
  }

  actualizarMedicamento(
    campo: keyof FormularioMedicamento,
    valor: string | number
  ): void {
    this.medicamentoFormulario.update((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  guardarMedicamento(): void {
    const medicamento = this.medicamentoFormulario();

    if (
      !medicamento.nombre.trim() ||
      !medicamento.concentracion.trim() ||
      !medicamento.frecuencia.trim() ||
      !medicamento.duracion.trim()
    ) {
      return;
    }

    const nuevoMedicamento: Medicamento = {
      ...medicamento,
      cantidad: Number(medicamento.cantidad) || 1,
    };

    const existeIndice = this.medicamentosTemporales().findIndex(
      (item) =>
        item.nombre === nuevoMedicamento.nombre &&
        item.concentracion === nuevoMedicamento.concentracion &&
        item.frecuencia === nuevoMedicamento.frecuencia
    );

    if (existeIndice >= 0) {
      this.medicamentosTemporales.update((medicamentos) =>
        medicamentos.map((item, index) =>
          index === existeIndice ? nuevoMedicamento : item
        )
      );
    } else {
      this.medicamentosTemporales.update((medicamentos) => [
        ...medicamentos,
        nuevoMedicamento,
      ]);
    }

    this.modalMedicamentoAbierto.set(false);
  }

  guardarFormulacion(): void {
    const formulario = this.formulario();

    if (
      !formulario.paciente.trim() ||
      !formulario.propietario.trim() ||
      !formulario.veterinario.trim() ||
      !formulario.diagnostico.trim() ||
      this.medicamentosTemporales().length === 0
    ) {
      return;
    }

    const idEdicion = this.formulacionEditandoId();

    if (this.modoEdicion() && idEdicion !== null) {
      this.formulaciones.update((formulaciones) =>
        formulaciones.map((formulacion) =>
          formulacion.id === idEdicion
            ? {
                ...formulacion,
                ...formulario,
                medicamentos: this.medicamentosTemporales(),
              }
            : formulacion
        )
      );

      this.formulacionSeleccionada.set(
        this.formulaciones().find((f) => f.id === idEdicion) ?? null
      );
    } else {
      const nuevaFormulacion: Formulacion = {
        id: this.contador,
        numero: `FORM-${String(this.contador).padStart(4, '0')}`,
        fecha: new Date().toISOString().split('T')[0],
        ...formulario,
        estado: 'Activa',
        medicamentos: this.medicamentosTemporales(),
      };

      this.contador++;

      this.formulaciones.update((formulaciones) => [
        nuevaFormulacion,
        ...formulaciones,
      ]);
    }

    this.modalFormularioAbierto.set(false);
  }

  cambiarEstado(
    formulacion: Formulacion,
    estado: Formulacion['estado']
  ): void {
    this.formulaciones.update((formulaciones) =>
      formulaciones.map((item) =>
        item.id === formulacion.id
          ? { ...item, estado }
          : item
      )
    );

    const actualizada = this.formulaciones().find(
      (item) => item.id === formulacion.id
    );

    if (actualizada) {
      this.formulacionSeleccionada.set(actualizada);
    }
  }

  eliminarFormulacion(formulacion: Formulacion): void {
    const confirmar = window.confirm(
      `¿Deseas eliminar la formulación ${formulacion.numero}?`
    );

    if (!confirmar) {
      return;
    }

    this.formulaciones.update((formulaciones) =>
      formulaciones.filter((item) => item.id !== formulacion.id)
    );

    this.modalDetalleAbierto.set(false);
    this.formulacionSeleccionada.set(null);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('Todos');
    this.filtroEspecie.set('Todas');
  }

  obtenerIniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }
}