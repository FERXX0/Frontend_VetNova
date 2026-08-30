import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'super-usuario/empresas/:empresaId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'super-usuario/empresas/:empresaId/suscripciones',
    renderMode: RenderMode.Server,
  },
  {
    path: 'panel/pacientes/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
