import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reportes-empresa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes-empresa.component.html',
  styleUrls: ['./reportes-empresa.component.scss']
})
export class ReportesEmpresaComponent {
  
  reportes = [
    {
      id: 'citas',
      title: 'Reporte de Citas',
      description: 'Estadísticas detalladas sobre las citas programadas, atendidas y canceladas en un periodo de tiempo.',
      icon: 'calendar'
    },
    {
      id: 'pacientes',
      title: 'Reporte de Pacientes',
      description: 'Análisis demográfico y de crecimiento de la base de pacientes registrados en la veterinaria.',
      icon: 'paw'
    },
    {
      id: 'ingresos',
      title: 'Reporte de Ingresos',
      description: 'Resumen financiero de los ingresos generados por consultas y servicios veterinarios.',
      icon: 'chart'
    }
  ];

}
