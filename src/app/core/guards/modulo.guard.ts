import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

/**
 * Mapa de redirección de códigos de catálogo a rutas del panel de la empresa.
 */
const MODULO_RUTAS: Record<string, string> = {
  citas: '/panel/agenda',
  clientes_pacientes: '/panel/pacientes',
};

/**
 * Valida que el usuario autenticado tenga asignado en `usuario.modulos`
 * el módulo especificado en `route.data['modulo']`.
 * 
 * Si no tiene el módulo:
 * 1. Si no tiene NINGÚN módulo asignado (usuario.modulos = []), redirige a `/panel/sin-modulos` (evita bucles infinitos).
 * 2. Si tiene otros módulos, redirige al primero que tenga disponible.
 */
export const moduloGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  const usuario = session.obtenerUsuario();
  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }

  // Superadministrador tiene acceso global irrestricto
  if (usuario.es_super_administrador) {
    return true;
  }

  const moduloRequerido = route.data['modulo'] as string | undefined;

  // Si la ruta no especifica un módulo concreto (ej. layout contenedor o perfil),
  // se permite si tiene sesión
  if (!moduloRequerido) {
    return true;
  }

  const modulos = usuario.modulos || [];

  // Caso borde: usuario sin ningún módulo asignado
  if (modulos.length === 0) {
    router.navigate(['/panel/sin-modulos']);
    return false;
  }

  // Verificar si tiene el módulo requerido
  const tieneModulo = modulos.some((m) => m.codigo === moduloRequerido && m.activo !== false);

  if (tieneModulo) {
    return true;
  }

  // Si no tiene el módulo solicitado, buscar la primera ruta disponible
  for (const mod of modulos) {
    if (MODULO_RUTAS[mod.codigo]) {
      router.navigate([MODULO_RUTAS[mod.codigo]]);
      return false;
    }
  }

  // Si ninguno de sus módulos coincide con una ruta implementada
  router.navigate(['/panel/sin-modulos']);
  return false;
};

export const moduloChildGuard: CanActivateChildFn = (route, state) => {
  return moduloGuard(route, state);
};
