import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';
import {
  LoginRequest,
  LoginResponse,
  UsuarioAutenticado,
} from '../models/auth.model';

/**
 * Solo maneja las llamadas HTTP de autenticación. El estado de sesión
 * (token + usuario, con acceso seguro a localStorage en SSR) vive en
 * SessionService — así evitamos tener dos "fuentes de verdad" desincronizadas.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  readonly usuario = this.session.usuario;
  readonly estaAutenticado = computed(() => this.session.estaAutenticado());

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales)
      .pipe(
        tap((respuesta) => this.session.guardar(respuesta.token, respuesta.usuario)),
        catchError((error) => {
          const mensaje = this.mapearErrorLogin(error);
          return throwError(() => new Error(mensaje));
        })
      );
  }

  logout(): void {
    // Si tu backend maneja blacklist de tokens o refresh tokens,
    // aquí deberías llamar también a POST /auth/logout antes de limpiar local.
    this.session.limpiar();
  }

  getToken(): string | null {
    return this.session.obtenerToken();
  }

  /**
   * ⚠️ El backend actual (routes/api.php) NO expone estos endpoints todavía
   * (solo existe /auth/login, /auth/me y /auth/logout). Estos métodos compilan
   * y quedan listos, pero devolverán 404 hasta que el backend los implemente.
   */
  solicitarRecuperacion(payload: { correo: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/recuperar-contrasena`,
      payload
    );
  }

  restablecerContrasena(payload: {
    correo: string;
    token: string;
    contrasena: string;
    contrasena_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/restablecer-contrasena`,
      payload
    );
  }

  /**
   * ⚠️ Contrato pendiente en backend: PUT /auth/perfil (o PUT /usuarios/perfil)
   * Permite que el usuario autenticado actualice sus datos personales básicos
   * (nombre, celular, correo, fecha_nacimiento).
   */
  actualizarPerfil(payload: {
    nombre: string;
    celular?: string | null;
    correo: string;
    fecha_nacimiento?: string | null;
  }): Observable<{ message: string; usuario: UsuarioAutenticado }> {
    return this.http.put<{ message: string; usuario: UsuarioAutenticado }>(
      `${environment.apiUrl}/auth/perfil`,
      payload
    ).pipe(
      tap((respuesta) => {
        if (respuesta?.usuario) {
          const token = this.session.obtenerToken() ?? '';
          this.session.guardar(token, respuesta.usuario);
        }
      })
    );
  }

  private mapearErrorLogin(error: any): string {
    if (error.status === 401) {
      return 'Usuario o contraseña incorrectos.';
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    return 'Ocurrió un error al iniciar sesión. Intenta de nuevo.';
  }
}