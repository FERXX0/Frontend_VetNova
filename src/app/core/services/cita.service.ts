import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cita, CitaPayload, EstadoCita } from '../models/cita.model';

/**
 * Servicio para gestión de Agenda Médica y Agendamiento de Citas.
 * Módulo: 'citas' (Agendamiento).
 * 
 * ⚠️ CONTRATO PENDIENTE EN BACKEND:
 * Los siguientes endpoints REST aún no han sido implementados en el backend Laravel
 * (devolverán 404 hasta que las rutas y el CitaController sean creados en el backend).
 * 
 * Rutas propuestas:
 * - GET    /citas?fecha=YYYY-MM-DD
 * - POST   /citas
 * - GET    /citas/{id}
 * - PUT    /citas/{id}
 * - DELETE /citas/{id}
 */
@Injectable({ providedIn: 'root' })
export class CitaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/citas`;

  listarPorFecha(fecha: string): Observable<Cita[]> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<Cita[]>(this.baseUrl, { params });
  }

  listar(params?: { fecha_inicio?: string; fecha_fin?: string }): Observable<Cita[]> {
    let httpParams = new HttpParams();
    if (params?.fecha_inicio) httpParams = httpParams.set('fecha_inicio', params.fecha_inicio);
    if (params?.fecha_fin) httpParams = httpParams.set('fecha_fin', params.fecha_fin);

    return this.http.get<Cita[]>(this.baseUrl, { params: httpParams });
  }

  obtener(id: string): Observable<Cita> {
    return this.http.get<Cita>(`${this.baseUrl}/${id}`);
  }

  crear(payload: CitaPayload): Observable<Cita> {
    return this.http.post<Cita>(this.baseUrl, payload);
  }

  actualizar(id: string, payload: CitaPayload): Observable<Cita> {
    return this.http.put<Cita>(`${this.baseUrl}/${id}`, payload);
  }

  cambiarEstado(id: string, estado: EstadoCita): Observable<Cita> {
    return this.http.patch<Cita>(`${this.baseUrl}/${id}/estado`, { estado });
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
