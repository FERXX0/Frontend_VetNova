import { RenderMode, ServerRoute } from '@angular/ssr';

// Toda la app vive detrás de login y depende de localStorage (sesión,
// guards). RenderMode.Server/Prerender renderizan en el servidor, donde
// localStorage no existe: el guard ve "sin sesión" y manda a /login antes
// de que el navegador cargue el token real. Por eso TODO se sirve como
// Client (SPA pura, sin SSR) hasta que la auth deje de depender de
// localStorage.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];