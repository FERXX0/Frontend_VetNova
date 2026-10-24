import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UsuarioAutenticado } from '../models/auth.model';
import { InactivityService } from './inactivity.service';

const TOKEN_KEY = 'vn_token';
const USUARIO_KEY = 'vn_usuario';

/**
 * Guarda la sesión (token + usuario) en localStorage.
 * Aislado en un servicio propio porque en SSR (server.ts / main.server.ts)
 * no existe `window`/`localStorage`, así que todo el acceso al storage
 * se protege con isPlatformBrowser.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly esNavegador = isPlatformBrowser(this.platformId);
  private readonly inactividad = inject(InactivityService);

  readonly usuario = signal<UsuarioAutenticado | null>(this.leerUsuario());

  guardar(token: string, usuario: UsuarioAutenticado): void {
    if (this.esNavegador) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
    }
    this.usuario.set(usuario);
    // Login exitoso (o perfil actualizado): reinicia el contador de inactividad.
    this.inactividad.markActive();
  }

  /** Actualiza permisos y módulos sin renovar el token ni reiniciar inactividad. */
  actualizarUsuario(usuario: UsuarioAutenticado): void {
    if (this.esNavegador) {
      localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
    }
    this.usuario.set(usuario);
  }

  limpiar(): void {
    if (this.esNavegador) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USUARIO_KEY);
    }
    this.usuario.set(null);
    this.inactividad.clear();
  }

  obtenerToken(): string | null {
    return this.esNavegador ? localStorage.getItem(TOKEN_KEY) : null;
  }

  obtenerUsuario(): UsuarioAutenticado | null {
    return this.usuario();
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  esSuperAdministrador(): boolean {
    return !!this.usuario()?.es_super_administrador;
  }
  
  codigoRol(): string | null {
    return this.usuario()?.rol?.codigo ?? null;
  }

  esPersonalPlataforma(): boolean {
    const usuario = this.usuario();
    const codigo = usuario?.rol?.codigo;

    return !!usuario?.es_super_administrador && (codigo === 'super_admin' || codigo === 'soporte');
  }

  tienePermiso(codigo: string): boolean {
    const usuario = this.usuario();
    if (!usuario) return false;
    if (this.esPersonalPlataforma()) return true;
    const moduloCodigo = codigo.split('.')[0];
    const modulo = (usuario.modulos ?? []).find(m => m.codigo === moduloCodigo && m.activo !== false);
    return !!modulo && (usuario.permisos ?? []).some(p => p.codigo === codigo && p.activo !== false && p.modulo_id === modulo.id);
  }

  rutaInicio(): string {
    if (this.esPersonalPlataforma()) {
      return '/super-usuario/dashboard';
    }

    const modulosActivos = (this.usuario()?.modulos ?? []).filter((modulo) => modulo.activo !== false);

    return modulosActivos.length > 0 ? '/panel/dashboard' : '/panel/sin-modulos';
  }

  rutaPerfil(): string {
    return this.esPersonalPlataforma() ? '/super-usuario/perfil' : '/panel/perfil';
  }

  private leerUsuario(): UsuarioAutenticado | null {
    if (!this.esNavegador) {
      return null;
    }
    const crudo = localStorage.getItem(USUARIO_KEY);
    if (!crudo) {
      return null;
    }
    try {
      return JSON.parse(crudo) as UsuarioAutenticado;
    } catch {
      return null;
    }
  }
}