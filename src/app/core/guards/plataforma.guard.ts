import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

const ROLES_POR_DEFECTO = ['super_admin', 'soporte'];

/**
 * Permite el acceso al área de plataforma solo al personal de VetNova
 * (super_admin y soporte).
 */
export const plataformaGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.esPersonalPlataforma()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/**
 * Restringe cada ruta hija según data.roles.
 * Si la ruta no declara roles, solo entra super_admin.
 */
export const plataformaChildGuard: CanActivateChildFn = (childRoute) => {
  const session = inject(SessionService);
  const router = inject(Router);

  const permitidos: string[] = childRoute.data?.['roles'] ?? ROLES_POR_DEFECTO;
  const codigo = session.codigoRol();

  if (codigo && permitidos.includes(codigo)) {
    return true;
  }

  router.navigate([
    session.esPersonalPlataforma() ? '/super-usuario/dashboard' : '/login',
  ]);
  return false;
};