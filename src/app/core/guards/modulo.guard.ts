import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  Router,
  UrlTree,
} from '@angular/router';
import { SessionService } from '../services/session.service';

const RUTAS_POR_MODULO: Record<string, string> = {
  citas: '/panel/agenda',
  clientes_pacientes: '/panel/pacientes',
  usuarios: '/panel/usuarios',
  historias_clinicas: '/panel/historias-clinicas',
  esquema_v_d: '/panel/esquema-v-d',
  hospitalizacion: '/panel/hospitalizacion',
  procedimientos: '/panel/procedimientos',
  laboratorio: '/panel/laboratorio',
  formulaciones: '/panel/formulaciones',
  farmacia: '/panel/farmacia',
  servicios: '/panel/servicios',
  facturacion: '/panel/facturacion',
};

/**
 * Valida que el usuario de la veterinaria tenga asignado el módulo indicado
 * en route.data['modulo']. Si no lo tiene, lo envía al primer módulo que sí
 * tenga o, si no tiene ninguno, a /panel/sin-modulos.
 */
export const moduloChildGuard: CanActivateChildFn = (
  route: ActivatedRouteSnapshot
): boolean | UrlTree => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  if (session.esPersonalPlataforma()) {
    return router.createUrlTree(['/super-usuario/dashboard']);
  }

  const usuario = session.obtenerUsuario();

  if (!usuario) {
    return router.createUrlTree(['/login']);
  }

  const moduloRequerido = route.data['modulo'] as string | undefined;

  if (!moduloRequerido) {
    return true;
  }

  const modulosActivos = (usuario.modulos ?? []).filter((modulo) => modulo.activo !== false);

  if (modulosActivos.some((modulo) => modulo.codigo === moduloRequerido) && session.tienePermiso(`${moduloRequerido}.ver`)) {
    return true;
  }

  const alternativo = modulosActivos.find((modulo) => RUTAS_POR_MODULO[modulo.codigo] && session.tienePermiso(`${modulo.codigo}.ver`));

  return router.createUrlTree([
    alternativo ? RUTAS_POR_MODULO[alternativo.codigo] : '/panel/sin-modulos',
  ]);
};
