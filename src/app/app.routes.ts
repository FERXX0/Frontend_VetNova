import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RecuperarContrasenaComponent } from './auth/recuperar-contrasena/recuperar-contrasena';
import { RestablecerContrasenaComponent } from './auth/restablecer-contrasena/restablecer-contrasena';

// Super Usuario
import { SuperUsuarioLayoutComponent } from './super-usuario/super-usuario-layout/super-usuario-layout';
import { DashboardComponent } from './super-usuario/dashboard/dashboard';
import { EmpresasComponent } from './super-usuario/empresas/empresas';
import { EmpresaDetalleComponent } from './super-usuario/empresas/empresa-detalle/empresa-detalle';
import { SuscripcionesComponent } from './super-usuario/suscripciones/suscripciones';
import { UsuariosAdminComponent } from './super-usuario/usuarios/usuarios';
import { MonitoreoComponent } from './super-usuario/monitoreo/monitoreo';
import { SoporteComponent } from './super-usuario/soporte/soporte';
import { ReportesAdminComponent } from './super-usuario/reportes-admin/reportes-admin';
import { ConfiguracionGlobalComponent } from './super-usuario/configuracion-global/configuracion-global';

// Panel Empresa / Tenant
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
import { UsuariosEmpresaComponent } from './panel/usuarios-empresa/usuarios-empresa.component';
import { ReportesEmpresaComponent } from './panel/reportes-empresa/reportes-empresa.component';

// Compartidos
import { PerfilComponent } from './shared/components/perfil/perfil';
import { SinModulosComponent } from './shared/components/sin-modulos/sin-modulos';

// Guards
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { moduloGuard, moduloChildGuard } from './core/guards/modulo.guard';
import { LaboratorioComponent } from './panel/laboratorio/laboratorio.component';
import { FormulacionesComponent } from './panel/formulaciones/formulaciones.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'recuperar-contrasena', component: RecuperarContrasenaComponent },
  { path: 'restablecer-contrasena', component: RestablecerContrasenaComponent },

  // Rutas exclusivas de Super Administrador (con layout compartido de plataforma)
  {
    path: 'super-usuario',
    component: SuperUsuarioLayoutComponent,
    canActivate: [authGuard, superAdminGuard],
    canActivateChild: [authGuard, superAdminGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'empresas', component: EmpresasComponent },
      { path: 'empresas/:empresaId', component: EmpresaDetalleComponent },
      { path: 'empresas/:empresaId/suscripciones', component: SuscripcionesComponent },
      { path: 'usuarios', component: UsuariosAdminComponent },
      { path: 'monitoreo', component: MonitoreoComponent },
      { path: 'soporte', component: SoporteComponent },
      { path: 'reportes', component: ReportesAdminComponent },
      { path: 'configuracion', component: ConfiguracionGlobalComponent },
      { path: 'perfil', component: PerfilComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Rutas del Área de Empresa / Tenant (con módulos dinámicos según suscripción)
  {
    path: 'panel',
    component: SuperUsuarioLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard, moduloChildGuard],
    children: [
      {
        path: 'dashboard',
        component: PanelDashboardComponent,
      },

      {
        path: 'agenda',
        component: AgendaComponent,
        data: { modulo: 'citas' },
      },
      {
        path: 'hospitalizacion',
        component: HospitalizacionComponent,
        data: { modulo: 'hospitalizacion' }
      },
      {
        path: 'pacientes',
        component: PacientesComponent,
        data: { modulo: 'clientes_pacientes' },
      },
      {
        path: 'procedimientos',component: ProcedimientosComponent,
        data: { modulo: 'procedimientos' }
      },
      {
        path: 'laboratorio',
        component: LaboratorioComponent,
        data: { modulo: ' laboratorio'}
      },
      {
        path: 'formulaciones',
        component: FormulacionesComponent,
        data: { modulo: ' formulaciones'}
      },

      {
        path: 'esquema-v-d',
        component: EsquemaVDComponent,
        data: { modulo: 'esquema_v_d' }
      },
      {
        path: 'farmacia',
        component: FarmaciaComponent,
        data: { modulo: 'farmacia'}
      },
      {
        path: 'pacientes/:id',
        component: PacienteDetalleComponent,
        data: { modulo: 'clientes_pacientes' },
      },
      {
        path: 'usuarios',
        component: UsuariosEmpresaComponent,
        data: {modulo: 'usuarios'},
      },
      {
        path: 'historias-clinicas',
        component: HistoriasClinicasComponent,
        data: { modulo: 'historias_clinicas' }
      },
      {
        path: 'reportes',
        component: ReportesEmpresaComponent,
        data: {modulo: 'reportes'},
      },
      {
        path: 'perfil',
        component: PerfilComponent,
      },
      {
        path: 'sin-modulos',
        component: SinModulosComponent,
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Ruta directa de perfil
  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [authGuard],
  },

  // Redirección por defecto
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];