
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from '../services/session.service';

/**
 * El token de VetNova se envía exclusivamente a su API.
 * Los errores 401 de servicios externos no deben cerrar la sesión local.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);

  const apiBase = environment.apiUrl.replace(/\/+$/, '');

  const esApiVetNova =
    req.url === apiBase ||
    req.url.startsWith(`${apiBase}/`) ||
    req.url.startsWith(`${apiBase}?`);

  // Las solicitudes externas no usan el token de VetNova.
  if (!esApiVetNova) {
    return next(req);
  }

  const token = session.obtenerToken();

  const peticion = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(peticion).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        session.limpiar();
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
