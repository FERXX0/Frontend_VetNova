import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cita, CitaPayload, EstadoCita, Profesional } from '../models/cita.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';

@Injectable({ providedIn: 'root' })
export class CitaService {
  private readonly http = inject(HttpClient);

  private url(alcance?: AlcanceApi): string {
    return urlRecurso(environment.apiUrl, 'citas', alcance);
  }

  listarPorFecha(fecha: string, alcance?: AlcanceApi): Observable<Cita[]> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<Cita[]>(this.url(alcance), { params });
  }

  listar(
    params: { fecha_inicio: string; fecha_fin: string; veterinario_id?: string; estado?: string },
    alcance?: AlcanceApi
  ): Observable<Cita[]> {
    let httpParams = new HttpParams()
      .set('fecha_inicio', params.fecha_inicio)
      .set('fecha_fin', params.fecha_fin);

    if (params.veterinario_id) {
      httpParams = httpParams.set('veterinario_id', params.veterinario_id);
    }
    if (params.estado) {
      httpParams = httpParams.set('estado', params.estado);
    }

    return this.http.get<Cita[]>(this.url(alcance), { params: httpParams });
  }

  listarProfesionales(alcance?: AlcanceApi): Observable<Profesional[]> {
    return this.http.get<Profesional[]>(`${this.url(alcance)}/profesionales`);
  }

  obtener(id: string, alcance?: AlcanceApi): Observable<Cita> {
    return this.http.get<Cita>(`${this.url(alcance)}/${id}`);
  }

  crear(payload: CitaPayload, alcance?: AlcanceApi): Observable<Cita> {
    return this.http.post<Cita>(this.url(alcance), payload);
  }

  actualizar(id: string, payload: CitaPayload, alcance?: AlcanceApi): Observable<Cita> {
    return this.http.put<Cita>(`${this.url(alcance)}/${id}`, payload);
  }

  cambiarEstado(id: string, estado: EstadoCita, alcance?: AlcanceApi): Observable<Cita> {
    return this.http.patch<Cita>(`${this.url(alcance)}/${id}/estado`, { estado });
  }

  eliminar(id: string, alcance?: AlcanceApi): Observable<void> {
    return this.http.delete<void>(`${this.url(alcance)}/${id}`);
  }
}