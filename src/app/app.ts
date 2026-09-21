import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { InactivityService } from './core/services/inactivity.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('vetnovafront');

  private readonly inactividad = inject(InactivityService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // Si pasan 2 horas sin actividad: cierra la sesión y vuelve al login.
    this.inactividad.start(() => {
      this.auth.logout();
      this.router.navigate(['/login']);
    });
  }
}