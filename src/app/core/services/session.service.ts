import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UsuarioAutenticado } from '../models/auth.model';

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

  readonly usuario = signal<UsuarioAutenticado | null>(this.leerUsuario());

  guardar(token: string, usuario: UsuarioAutenticado): void {
    if (this.esNavegador) {
      localStorage.setItem(TOKEN_KEY, token);
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
