import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FiltrosUsuariosGlobal, PaginacionUsuarios, Usuario, UsuarioPayload } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Listado global de usuarios de TODAS las empresas.
   * GET /api/usuarios (solo Super Administrador).
   */
  listarGlobal(filtros: FiltrosUsuariosGlobal = {}): Observable<PaginacionUsuarios> {
    let params = new HttpParams();
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros.empresa_id) params = params.set('empresa_id', filtros.empresa_id);
    if (filtros.rol_id) params = params.set('rol_id', filtros.rol_id);
    if (filtros.activo) params = params.set('activo', filtros.activo);
    if (filtros.page) params = params.set('page', filtros.page);

    return this.http.get<PaginacionUsuarios>(`${this.apiUrl}/usuarios`, { params });
  }

  /** Listado de usuarios de UNA empresa puntual (GET /api/empresas/{empresa}/usuarios). */
  listarPorEmpresa(empresaId: string): Observable<PaginacionUsuarios> {
    return this.http.get<PaginacionUsuarios>(`${this.apiUrl}/empresas/${empresaId}/usuarios`);
  }

  crear(empresaId: string, payload: UsuarioPayload): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/empresas/${empresaId}/usuarios`, payload);
  }

  actualizar(empresaId: string, usuarioId: string, payload: UsuarioPayload): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/empresas/${empresaId}/usuarios/${usuarioId}`, payload);
  }

  eliminar(empresaId: string, usuarioId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/empresas/${empresaId}/usuarios/${usuarioId}`);
  }
}
