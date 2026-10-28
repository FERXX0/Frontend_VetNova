import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginacionLaravel } from '../models/empresa.model';
import { Profesional } from '../models/cita.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';
import {
  EvolucionPayload,
  Hospitalizacion,
  HospitalizacionPayload,
  ResumenHospitalizacion,
} from '../models/hospitalizacion.model';

@Injectable({ providedIn: 'root' })
export class HospitalizacionService {
  private readonly http = inject(HttpClient);

  private url(alcance?: AlcanceApi): string {
    return urlRecurso(environment.apiUrl, 'hospitalizacion', alcance);
  }

  listar(
    params: {
      buscar?: string;
      estado?: string;
      prioridad?: string;
      especie?: string;
      paciente_id?: string;
      desde?: string;
      hasta?: string;
      page?: number;
      per_page?: number;
    },
    alcance?: AlcanceApi
  ): Observable<PaginacionLaravel<Hospitalizacion>> {
    let httpParams = new HttpParams();
    if (params.buscar) httpParams = httpParams.set('buscar', params.buscar);
    if (params.estado) httpParams = httpParams.set('estado', params.estado);
    if (params.prioridad) httpParams = httpParams.set('prioridad', params.prioridad);
    if (params.especie) httpParams = httpParams.set('especie', params.especie);
    if (params.paciente_id) httpParams = httpParams.set('paciente_id', params.paciente_id);
    if (params.desde) httpParams = httpParams.set('desde', params.desde);
    if (params.hasta) httpParams = httpParams.set('hasta', params.hasta);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginacionLaravel<Hospitalizacion>>(this.url(alcance), { params: httpParams });
  }

  resumen(alcance?: AlcanceApi): Observable<ResumenHospitalizacion> {
    return this.http.get<ResumenHospitalizacion>(`${this.url(alcance)}/resumen`);
  }

  profesionales(alcance?: AlcanceApi): Observable<Profesional[]> {
    return this.http.get<Profesional[]>(`${this.url(alcance)}/profesionales`);
  }

  obtener(id: string, alcance?: AlcanceApi): Observable<Hospitalizacion> {
    return this.http.get<Hospitalizacion>(`${this.url(alcance)}/${id}`);
  }

  crear(payload: HospitalizacionPayload, alcance?: AlcanceApi): Observable<Hospitalizacion> {
    return this.http.post<Hospitalizacion>(this.url(alcance), payload);
  }

  actualizar(id: string, payload: HospitalizacionPayload, alcance?: AlcanceApi): Observable<Hospitalizacion> {
    return this.http.put<Hospitalizacion>(`${this.url(alcance)}/${id}`, payload);
  }

  darAlta(id: string, alcance?: AlcanceApi): Observable<Hospitalizacion> {
    return this.http.patch<Hospitalizacion>(`${this.url(alcance)}/${id}/alta`, {});
  }

  agregarEvolucion(id: string, payload: EvolucionPayload, alcance?: AlcanceApi): Observable<Hospitalizacion> {
    return this.http.post<Hospitalizacion>(`${this.url(alcance)}/${id}/evoluciones`, payload);
  }
}
