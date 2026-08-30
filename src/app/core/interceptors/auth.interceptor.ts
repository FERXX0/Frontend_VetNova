import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';

/**
 * Adjunta el token Bearer (Sanctum) a cada petición hacia la API y, si el
 * backend responde 401 (token vencido o inválido), limpia la sesión y
 * redirige al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);

  const token = session.obtenerToken();

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        session.limpiar();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
