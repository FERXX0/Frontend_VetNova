import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';
import { InactivityService } from '../services/inactivity.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const inactividad = inject(InactivityService);
  const router = inject(Router);

  // Sesión vencida por inactividad (2 h): se limpia antes de decidir.
  if (session.estaAutenticado() && inactividad.isExpired()) {
    session.limpiar();
  }

  if (session.estaAutenticado()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
