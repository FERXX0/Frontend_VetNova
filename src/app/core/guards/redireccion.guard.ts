import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SessionService } from '../services/session.service';
import { InactivityService } from '../services/inactivity.service';

function haySesionVigente(): boolean {
  const session = inject(SessionService);
  const inactividad = inject(InactivityService);

  if (session.estaAutenticado() && inactividad.isExpired()) {
    session.limpiar();
  }

  return session.estaAutenticado();
}

/** Lleva al usuario a la pantalla de inicio que corresponde a su rol, o al login si no hay sesión. */
export const inicioGuard: CanActivateFn = (): UrlTree => {
  const session = inject(SessionService);
  const router = inject(Router);

  return haySesionVigente()
    ? router.createUrlTree([session.rutaInicio()])
    : router.createUrlTree(['/login']);
};

/** Lleva al usuario a la pantalla de perfil que corresponde a su rol, o al login si no hay sesión. */
export const perfilGuard: CanActivateFn = (): UrlTree => {
  const session = inject(SessionService);
  const router = inject(Router);

  return haySesionVigente()
    ? router.createUrlTree([session.rutaPerfil()])
    : router.createUrlTree(['/login']);
};
