import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuarios-empresa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios-empresa.component.html',
  styleUrls: ['./usuarios-empresa.component.scss']
})
export class UsuariosEmpresaComponent {
  
  // Dummy data for skeleton table
  skeletonRows = Array(5).fill(0);

}
