import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paciente, PacientePayload } from '../models/paciente.model';
import { PaginacionLaravel } from '../models/empresa.model';

/**
 * Servicio para gestión de Pacientes (Mascotas y Propietarios).
 * Módulo: 'clientes_pacientes' (Administración de Mascotas).
 * 
 * ⚠️ CONTRATO PENDIENTE EN BACKEND:
 * Los siguientes endpoints REST aún no han sido implementados en el backend Laravel
 * (devolverán 404 hasta que las rutas y el PacienteController sean creados).
 * 
 * Rutas propuestas:
 * - Opción 1 (por token de empresa - usada por defecto):
 *     GET    /pacientes
 *     POST   /pacientes
 *     GET    /pacientes/{id}
 *     PUT    /pacientes/{id}
 *     DELETE /pacientes/{id}
 * - Opción 2 (anidada bajo empresa para superadmin):
 *     GET    /empresas/{empresa}/pacientes
 *     POST   /empresas/{empresa}/pacientes
 *     GET    /empresas/{empresa}/pacientes/{id}
 *     PUT    /empresas/{empresa}/pacientes/{id}
 *     DELETE /empresas/{empresa}/pacientes/{id}
 */
@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/pacientes`;

  listar(params?: { buscar?: string; especie?: string; page?: number }): Observable<PaginacionLaravel<Paciente>> {
    let httpParams = new HttpParams();
    if (params?.buscar) httpParams = httpParams.set('buscar', params.buscar);
    if (params?.especie) httpParams = httpParams.set('especie', params.especie);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());

    return this.http.get<PaginacionLaravel<Paciente>>(this.baseUrl, { params: httpParams });
  }

  obtener(id: string): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.baseUrl}/${id}`);
  }

  crear(payload: PacientePayload): Observable<Paciente> {
    return this.http.post<Paciente>(this.baseUrl, payload);
  }

  actualizar(id: string, payload: PacientePayload): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.baseUrl}/${id}`, payload);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
