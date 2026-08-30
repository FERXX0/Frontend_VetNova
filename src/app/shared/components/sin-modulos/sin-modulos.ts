import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sin-modulos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sin-modulos.html',
  styleUrl: './sin-modulos.scss',
})
export class SinModulosComponent {
  private readonly session = inject(SessionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.session.usuario;

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
