import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.model';

export interface ModuloUsuarioPayload {
  modulo_id: string;
  vence_en?: string | null;
}

export interface ModuloUsuarioRespuesta {
  message: string;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class ModuloUsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** POST /api/empresas/{empresa}/usuarios/{usuario}/modulos */
  asignar(
    empresaId: string,
    usuarioId: string,
    payload: ModuloUsuarioPayload
  ): Observable<ModuloUsuarioRespuesta> {
    return this.http.post<ModuloUsuarioRespuesta>(
      `${this.apiUrl}/empresas/${empresaId}/usuarios/${usuarioId}/modulos`,
      payload
    );
  }

  /** DELETE /api/empresas/{empresa}/usuarios/{usuario}/modulos/{modulo} */
  quitar(
    empresaId: string,
    usuarioId: string,
    moduloId: string
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/empresas/${empresaId}/usuarios/${usuarioId}/modulos/${moduloId}`
    );
  }
}