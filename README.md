# VetNova - Frontend

VetNova es un sistema multitenant para la gestión integral de clínicas veterinarias, diseñado para administrar empresas, sedes, historias clínicas, citas, vacunaciones, hospitalización, procedimientos, farmacia, laboratorio y facturación.

## Tecnologías

- **Angular 21**
- **Standalone Components**
- **Angular Signals**
- **RxJS**
- **SCSS**

## Requisitos

- **Node.js** (v20 o superior recomendado)
- **npm** (o el gestor de paquetes configurado en el proyecto)

## Instalación

Instala las dependencias del proyecto ejecutando:

```bash
npm install
```

## Servidor de desarrollo

Para iniciar el servidor de desarrollo local, ejecuta:

```bash
ng serve
```

o bien:

```bash
npm start
```

Navega a `http://localhost:4200/` en tu navegador. La aplicación se recargará automáticamente al modificar los archivos de origen.

## Compilación

Para compilar el proyecto para producción:

```bash
ng build
```

Los artefactos compilados se almacenan en el directorio `dist/`.

## Configuración de la URL del Backend

La URL base de la API REST se encuentra definida en los archivos de entorno del proyecto:

- **Desarrollo (`src/environments/environment.ts`)**:
  ```typescript
  export const environment = {
    production: false,
    apiUrl: 'http://127.0.0.1:8000/api',
  };
  ```
- **Producción (`src/environments/environment.prod.ts`)**:
  ```typescript
  export const environment = {
    production: true,
    apiUrl: 'https://api.vetnova.com/api',
  };
  ```

En compilaciones de producción (`ng build`), Angular CLI sustituye automáticamente `src/environments/environment.ts` por `src/environments/environment.prod.ts` según la regla de `fileReplacements` configurada en `angular.json`. Para apuntar a un backend local o remoto específico en desarrollo, ajusta la propiedad `apiUrl` en `src/environments/environment.ts`.
