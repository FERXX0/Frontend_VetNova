import { Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, fromEvent, merge, timer } from 'rxjs';
import { catchError, exhaustMap, filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionService } from './core/services/session.service';
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
  private readonly session = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    // Si pasan 2 horas sin actividad: cierra la sesión y vuelve al login.
    if (this.isBrowser) {
      // Mantiene sincronizadas las sesiones abiertas sin realizar un nuevo login.
      // También revalida inmediatamente al volver a la pestaña.
      merge(
        timer(0, 15000),
        fromEvent(window, 'focus'),
        fromEvent(document, 'visibilitychange').pipe(filter(() => !document.hidden))
      ).pipe(
        filter(() => this.session.estaAutenticado()),
        exhaustMap(() => this.auth.refrescarUsuario().pipe(
          catchError((error: HttpErrorResponse) => {
            // Un problema temporal de red no debe cerrar la sesión.
            // El interceptor existente gestiona las respuestas 401.
            if (error.status !== 401) {
              console.warn('No se pudieron actualizar los permisos de la sesión.');
            }
            return EMPTY;
          })
        )),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => this.verificarRutaActual());
    }

    this.inactividad.start(() => {
      this.auth.logout();
      this.router.navigate(['/login']);
    });
  }

  /** Si el módulo abierto fue revocado, sale inmediatamente de su pantalla. */
  private verificarRutaActual(): void {
    if (this.session.esPersonalPlataforma() || !this.router.url.startsWith('/panel')) return;

    let actual = this.router.routerState.snapshot.root;
    while (actual.firstChild) {
      actual = actual.firstChild;
    }
    const modulo = actual.data['modulo'] as string | undefined;
    if (!modulo) return;

    const autorizado = (this.session.obtenerUsuario()?.modulos ?? []).some(
      (item) => item.codigo === modulo && item.activo !== false
    ) && this.session.tienePermiso(`${modulo}.ver`);

    if (!autorizado) {
      void this.router.navigateByUrl(this.session.rutaInicio(), { replaceUrl: true });
    }
  }
}