import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { SessionService } from '../services/session.service';

/**
 * Restringe el árbol /panel a los usuarios de una veterinaria.
 * El personal de plataforma tiene su propia área en /super-usuario.
 */
function validarAccesoPanel(): boolean | UrlTree {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  if (session.esPersonalPlataforma()) {
    return router.createUrlTree(['/super-usuario/dashboard']);
  }

  return true;
}

export const panelGuard: CanActivateFn = () => validarAccesoPanel();

export const panelChildGuard: CanActivateChildFn = () => validarAccesoPanel();
