import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { SessionService } from '../services/session.service';

const ROLES_POR_DEFECTO = ['super_admin', 'soporte'];

/**
 * Permite el acceso al área de plataforma solo al personal de VetNova.
 * Cualquier otro usuario autenticado es devuelto a su propia vista.
 */
export const plataformaGuard: CanActivateFn = (): boolean | UrlTree => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  if (session.esPersonalPlataforma()) {
    return true;
  }

  return router.createUrlTree([session.rutaInicio()]);
};

/**
 * Restringe cada ruta hija según data.roles.
 * Si la ruta no declara roles, se permiten super_admin y soporte.
 */
export const plataformaChildGuard: CanActivateChildFn = (childRoute): boolean | UrlTree => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.esPersonalPlataforma()) {
    return router.createUrlTree([session.rutaInicio()]);
  }

  const permitidos: string[] = childRoute.data?.['roles'] ?? ROLES_POR_DEFECTO;
  const codigo = session.codigoRol();

  if (codigo && permitidos.includes(codigo)) {
    return true;
  }

  return router.createUrlTree(['/super-usuario/dashboard']);
};