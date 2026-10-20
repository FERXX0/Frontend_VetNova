import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login';
import { RecuperarContrasenaComponent } from './auth/recuperar-contrasena/recuperar-contrasena';
import { RestablecerContrasenaComponent } from './auth/restablecer-contrasena/restablecer-contrasena';

// ==========================================================
// SUPER USUARIO
// ==========================================================

import { SuperUsuarioLayoutComponent } from './super-usuario/super-usuario-layout/super-usuario-layout';
import { DashboardComponent } from './super-usuario/dashboard/dashboard';
import { EmpresasComponent } from './super-usuario/empresas/empresas';
import { EmpresaDetalleComponent } from './super-usuario/empresas/empresa-detalle/empresa-detalle';
import { UsuariosAdminComponent } from './super-usuario/usuarios/usuarios';
import { ConfiguracionGlobalComponent } from './super-usuario/configuracion-global/configuracion-global';
import { PlanesComponent } from './super-usuario/planes/planes';

// ==========================================================
// PANEL EMPRESA / TENANT
// ==========================================================

import { FarmaciaComponent } from './panel/farmacia/farmacia.component';
import { ProcedimientosComponent } from './panel/procedimientos/procedimientos.component';
import { HospitalizacionComponent } from './panel/hospitalizacion/hospitalizacion.component';
import { EsquemaVDComponent } from './panel/esquema-v-d/esquema-v-d.component';
import { HistoriasClinicasComponent } from './panel/historia-clinica/historias-clinicas.component';

import { PanelLayoutComponent } from './panel/panel-layout/panel-layout';
import { PanelDashboardComponent } from './panel/dashboard/panel-dashboard.component';

import { AgendaComponent } from './panel/agenda/agenda';
import { PacientesComponent } from './panel/pacientes/pacientes';
import { PacienteDetalleComponent } from './panel/pacientes/paciente-detalle/paciente-detalle';
import { ServiciosComponent } from './panel/servicios/servicios.component';

import { UsuariosEmpresaComponent } from './panel/usuarios-empresa/usuarios-empresa.component';

import { LaboratorioComponent } from './panel/laboratorio/laboratorio.component';
import { FormulacionesComponent } from './panel/formulaciones/formulaciones.component';
import { FacturacionComponent } from './panel/facturacion/facturacion.component';

// ==========================================================
// COMPARTIDOS
// ==========================================================

import { PerfilComponent } from './shared/components/perfil/perfil';
import { SinModulosComponent } from './shared/components/sin-modulos/sin-modulos';

// ==========================================================
// GUARDS
// ==========================================================

import { authGuard } from './core/guards/auth.guard';
import { plataformaGuard, plataformaChildGuard } from './core/guards/plataforma.guard';
import { moduloChildGuard } from './core/guards/modulo.guard';
import { panelGuard, panelChildGuard } from './core/guards/panel.guard';
import { inicioGuard, perfilGuard } from './core/guards/redireccion.guard';

export const routes: Routes = [

  // ========================================================
  // AUTENTICACIÓN
  // ========================================================

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'recuperar-contrasena',
    component: RecuperarContrasenaComponent
  },

  {
    path: 'restablecer-contrasena',
    component: RestablecerContrasenaComponent
  },

  // ========================================================
  // SUPER ADMINISTRADOR
  //
  // SOLO entra un usuario con:
  // es_super_administrador = true
  // y rol.codigo = super_admin
  // ========================================================

  {
    path: 'super-usuario',
    component: SuperUsuarioLayoutComponent,

    canActivate: [
      authGuard,
      plataformaGuard
    ],

    canActivateChild: [
      authGuard,
      plataformaChildGuard
    ],

    children: [
      
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { roles: ['super_admin', 'soporte'] }
      },

      {
        path: 'empresas',
        component: EmpresasComponent
      },

      {
        path: 'empresas/:empresaId',
        component: EmpresaDetalleComponent
      },


      {
        path: 'usuarios',
        // component: UsuariosAdminComponent
        component: UsuariosEmpresaComponent

      },

      // ----------------------------------------------------
      // MÓDULOS OPERATIVOS DE LA VETERINARIA
      //
      // Mismos componentes que usa /panel/..., anidados aquí
      // para que el super administrador navegue sin salir de
      // /super-usuario/... . No llevan `data: { modulo }` porque
      // moduloChildGuard NO está aplicado a este árbol de rutas
      // (aquí solo corren authGuard + superAdminGuard).
      // ----------------------------------------------------

      {
        path: 'agenda',
        component: AgendaComponent
      },

      {
        path: 'pacientes',
        component: PacientesComponent
      },

      {
        path: 'pacientes/:id',
        component: PacienteDetalleComponent
      },

      {
        path: 'servicios',
        component: ServiciosComponent
      },

      {
        path: 'historias-clinicas',
        component: HistoriasClinicasComponent
      },

      {
        path: 'hospitalizacion',
        component: HospitalizacionComponent
      },

      {
        path: 'procedimientos',
        component: ProcedimientosComponent
      },

      {
        path: 'laboratorio',
        component: LaboratorioComponent
      },

      {
        path: 'formulaciones',
        component: FormulacionesComponent
      },

      {
        path: 'esquema-v-d',
        component: EsquemaVDComponent
      },

      {
        path: 'farmacia',
        component: FarmaciaComponent
      },

      {
        path: 'facturacion',
        component: FacturacionComponent
      },

      {
        path: 'configuracion',
        component: ConfiguracionGlobalComponent,
        data: { roles: ['super_admin', 'soporte'] }
      },

      
      {
        path: 'planes',
        component: PlanesComponent,
        data: { roles: ['super_admin', 'soporte'] }
      },

      {
        path: 'perfil',
        component: PerfilComponent,
        data: { roles: ['super_admin', 'soporte'] }
      },

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }

    ]
  },

  // ========================================================
  // PANEL DE LA VETERINARIA
  //
  // IMPORTANTE:
  // AQUÍ DEBE USARSE PanelLayoutComponent
  // Y NO SuperUsuarioLayoutComponent.
  // ========================================================

  {
    path: 'panel',

    component: PanelLayoutComponent,

    canActivate: [
      authGuard,
      panelGuard
    ],

    canActivateChild: [
      authGuard,
      panelChildGuard,
      moduloChildGuard
    ],

    children: [

      // ----------------------------------------------------
      // DASHBOARD
      // ----------------------------------------------------

      {
        path: 'dashboard',
        component: PanelDashboardComponent
      },

      // ----------------------------------------------------
      // AGENDA
      // ----------------------------------------------------

      {
        path: 'agenda',
        component: AgendaComponent,
        data: {
          modulo: 'citas'
        }
      },

      // ----------------------------------------------------
      // PACIENTES
      // ----------------------------------------------------

      {
        path: 'pacientes',
        component: PacientesComponent,
        data: {
          modulo: 'clientes_pacientes'
        }
      },

      {
        path: 'pacientes/:id',
        component: PacienteDetalleComponent,
        data: {
          modulo: 'clientes_pacientes'
        }
      },

      // ----------------------------------------------------
      // SERVICIOS
      // ----------------------------------------------------

      {
        path: 'servicios',
        component: ServiciosComponent,
        data: {
          modulo: 'servicios'
        }
      },

      // ----------------------------------------------------
      // USUARIOS DE LA EMPRESA
      // ----------------------------------------------------

      {
        path: 'usuarios',
        component: UsuariosEmpresaComponent,
        data: {
          modulo: 'usuarios'
        }
      },

      // ----------------------------------------------------
      // HISTORIAS CLÍNICAS
      // ----------------------------------------------------

      {
        path: 'historias-clinicas',
        component: HistoriasClinicasComponent,
        data: {
          modulo: 'historias_clinicas'
        }
      },

      // ----------------------------------------------------
      // HOSPITALIZACIÓN
      // ----------------------------------------------------

      {
        path: 'hospitalizacion',
        component: HospitalizacionComponent,
        data: {
          modulo: 'hospitalizacion'
        }
      },

      // ----------------------------------------------------
      // PROCEDIMIENTOS
      // ----------------------------------------------------

      {
        path: 'procedimientos',
        component: ProcedimientosComponent,
        data: {
          modulo: 'procedimientos'
        }
      },

      // ----------------------------------------------------
      // LABORATORIO
      // ----------------------------------------------------

      {
        path: 'laboratorio',
        component: LaboratorioComponent,
        data: {
          modulo: 'laboratorio'
        }
      },

      // ----------------------------------------------------
      // FORMULACIONES
      // ----------------------------------------------------

      {
        path: 'formulaciones',
        component: FormulacionesComponent,
        data: {
          modulo: 'formulaciones'
        }
      },

      // ----------------------------------------------------
      // ESQUEMA V-D
      // ----------------------------------------------------

      {
        path: 'esquema-v-d',
        component: EsquemaVDComponent,
        data: {
          modulo: 'esquema_v_d'
        }
      },

      // ----------------------------------------------------
      // FARMACIA
      // ----------------------------------------------------

      {
        path: 'farmacia',
        component: FarmaciaComponent,
        data: {
          modulo: 'farmacia'
        }
      },

      // ----------------------------------------------------
      // FACTURACIÓN
      // ----------------------------------------------------

      {
        path: 'facturacion',
        component: FacturacionComponent,
        data: {
          modulo: 'facturacion'
        }
      },

      // ----------------------------------------------------
      // PERFIL
      // ----------------------------------------------------

      {
        path: 'perfil',
        component: PerfilComponent
      },

      // ----------------------------------------------------
      // SIN MÓDULOS
      // ----------------------------------------------------

      {
        path: 'sin-modulos',
        component: SinModulosComponent
      },

      // ----------------------------------------------------
      // REDIRECCIÓN
      // ----------------------------------------------------

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }

    ]
  },

  // ========================================================
  // PERFIL DIRECTO
  // ========================================================

  {
    path: 'perfil',
    canActivate: [authGuard, perfilGuard],
    children: []
  },

  // ========================================================
  // REDIRECCIONES
  // ========================================================

  {
    path: '',
    pathMatch: 'full',
    canActivate: [inicioGuard],
    children: []
  },

  {
    path: '**',
    canActivate: [inicioGuard],
    children: []
  }

];