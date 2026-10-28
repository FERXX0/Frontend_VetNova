import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  listarPorEmpresa(
    empresaId: string,
    opciones: { page?: number; per_page?: number } = {}
  ): Observable<PaginacionUsuarios> {
    let params = new HttpParams();
    if (opciones.page) params = params.set('page', opciones.page);
    if (opciones.per_page) params = params.set('per_page', opciones.per_page);

    return this.http.get<PaginacionUsuarios>(
      `${this.apiUrl}/empresas/${empresaId}/usuarios`,
      { params }
    );
  }

  modulosDisponibles(empresaId: string): Observable<{ id: string; codigo: string; nombre: string }[]> {
    return this.http.get<{ id: string; codigo: string; nombre: string }[]>(
      `${this.apiUrl}/empresas/${empresaId}/modulos-disponibles`
    );
  }

  listarPermisos(): Observable<{ permisos: { id: string; modulo_id: string; codigo: string; nombre: string; activo: boolean }[] }> {
    return this.http.get<{ permisos: { id: string; modulo_id: string; codigo: string; nombre: string; activo: boolean }[] }>(`${this.apiUrl}/catalogos/permisos-empresa`);
  }

  crear(empresaId: string, payload: UsuarioPayload): Observable<Usuario> {
    return this.http
    .post<{ message: string; usuario: Usuario }>(`${this.apiUrl}/empresas/${empresaId}/usuarios`, payload)
    .pipe(map((respuesta) => respuesta.usuario));
  }
  
  actualizar(empresaId: string, usuarioId: string, payload: UsuarioPayload): Observable<Usuario> {
    return this.http
    .put<{ message: string; usuario: Usuario }>(`${this.apiUrl}/empresas/${empresaId}/usuarios/${usuarioId}`, payload)
    .pipe(map((respuesta) => respuesta.usuario));
  }

  eliminar(empresaId: string, usuarioId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/empresas/${empresaId}/usuarios/${usuarioId}`);
  }
}
