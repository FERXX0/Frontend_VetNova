# Conexión con el backend

Este frontend ya quedó cableado para consumir la API real de VetNova
(Laravel + Sanctum). Resumen de lo que se agregó y lo que falta en el
backend para que todo funcione de punta a punta.

## Configuración

- `src/environments/environment.ts` → `apiUrl: 'http://localhost:8000/api'`
  (ajusta el puerto/host si tu `php artisan serve` corre distinto).
- `src/environments/environment.prod.ts` → placeholder para la URL de
  producción, reemplázala antes de desplegar.
- El token se guarda en `localStorage` (`SessionService`) y se adjunta
  automáticamente a cada petición vía `authInterceptor`
  (`Authorization: Bearer <token>`). Si el backend responde `401`, la
  sesión se limpia y se redirige a `/login`.

## Endpoints que YA existen en el backend subido y quedaron conectados

- `POST /api/auth/login` → `correo` + `contrasena`. El formulario de login
  sigue mostrando el campo "Usuario" (no se tocó el HTML), pero internamente
  se envía como `correo`, que es lo que valida `AuthController@login`.
- Tras un login exitoso, si `usuario.es_super_administrador` es `true`, se
  navega a `/dashboard`. Si es un administrador de empresa, se muestra un
  mensaje (el área "Administrador" todavía no tiene vistas en este
  frontend).

## Endpoints que el frontend YA está preparado para consumir, pero que
## todavía NO existen en el backend subido (`VetNova-develop.zip`)

Estos tres endpoints no están en `routes/api.php` del backend que
compartiste. El frontend ya hace las peticiones esperando este contrato;
si quieres que también te genere el código Laravel, lo puedo hacer:

1. `POST /api/auth/recuperar-contrasena` — body `{ correo }` → usado por
   `RecuperarContrasenaComponent`.
2. `POST /api/auth/restablecer-contrasena` — body
   `{ correo, token, contrasena, contrasena_confirmation }` → usado por la
   vista nueva `RestablecerContrasenaComponent`
   (`/restablecer-contrasena?correo=...&token=...`).
3. `GET /api/dashboard/resumen` (protegido, `super.admin`) → usado por
   `DashboardComponent`. Mientras no exista, el dashboard simplemente se
   queda con sus valores por defecto (no rompe la vista).

## Archivos nuevos

- `src/environments/*`
- `src/app/core/models/auth.model.ts`, `dashboard.model.ts`
- `src/app/core/services/session.service.ts`, `auth.service.ts`, `dashboard.service.ts`
- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/core/guards/auth.guard.ts`, `super-admin.guard.ts`
- `src/app/auth/restablecer-contrasena/*` (vista nueva, mismo lenguaje visual que login/recuperar)

## Archivos modificados (solo lógica, sin tocar el HTML/diseño existente)

- `src/app/app.config.ts` → se agregó `provideHttpClient` + el interceptor.
- `src/app/app.routes.ts` → se agregó la ruta `restablecer-contrasena` y los
  guards en `dashboard`.
- `src/app/auth/login/login.ts` → conectado a `AuthService.login`.
- `src/app/auth/recuperar-contrasena/recuperar-contrasena.ts` → conectado a
  `AuthService.solicitarRecuperacion`.
- `src/app/super-usuario/dashboard/dashboard.ts` → conectado a
  `DashboardService.resumen`, mismos títulos y tarjetas del diseño original.
- `angular.json` → `fileReplacements` para que `ng build --configuration
  production` use `environment.prod.ts`.
