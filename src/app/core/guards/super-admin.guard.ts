import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

/**
 * Restringe rutas del área Super Usuario. Se asume que authGuard ya validó
 * que exista sesión; aquí solo se valida el rol es_super_administrador.
 */
export const superAdminGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.esSuperAdministrador()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
