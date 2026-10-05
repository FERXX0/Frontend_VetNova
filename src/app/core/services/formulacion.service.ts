import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginacionLaravel } from '../models/empresa.model';
import { Profesional } from '../models/cita.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';
import {
  FormulacionFila,
  FormulacionPayload,
  ResumenFormulaciones,
} from '../models/formulacion.model';

@Injectable({ providedIn: 'root' })
export class FormulacionService {
  private readonly http = inject(HttpClient);

  private url(alcance?: AlcanceApi): string {
    return urlRecurso(environment.apiUrl, 'formulaciones', alcance);
  }

  listar(
    params: {
      buscar?: string;
      especie?: string;
      estado?: string;
      page?: number;
      per_page?: number;
    },
    alcance?: AlcanceApi
  ): Observable<PaginacionLaravel<FormulacionFila>> {
    let httpParams = new HttpParams();
    if (params.buscar) httpParams = httpParams.set('buscar', params.buscar);
    if (params.especie) httpParams = httpParams.set('especie', params.especie);
    if (params.estado) httpParams = httpParams.set('estado', params.estado);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginacionLaravel<FormulacionFila>>(this.url(alcance), {
      params: httpParams,
    });
  }

  resumen(alcance?: AlcanceApi): Observable<ResumenFormulaciones> {
    return this.http.get<ResumenFormulaciones>(`${this.url(alcance)}/resumen`);
  }

  profesionales(alcance?: AlcanceApi): Observable<Profesional[]> {
    return this.http.get<Profesional[]>(`${this.url(alcance)}/profesionales`);
  }

  obtener(id: string, alcance?: AlcanceApi): Observable<FormulacionFila> {
    return this.http.get<FormulacionFila>(`${this.url(alcance)}/${id}`);
  }

  crear(
    payload: FormulacionPayload,
    alcance?: AlcanceApi
  ): Observable<FormulacionFila> {
    return this.http.post<FormulacionFila>(this.url(alcance), payload);
  }

  actualizar(
    id: string,
    payload: FormulacionPayload,
    alcance?: AlcanceApi
  ): Observable<FormulacionFila> {
    return this.http.put<FormulacionFila>(`${this.url(alcance)}/${id}`, payload);
  }

  cambiarEstado(
    id: string,
    estado: 'Finalizada' | 'Cancelada',
    alcance?: AlcanceApi
  ): Observable<FormulacionFila> {
    return this.http.patch<FormulacionFila>(`${this.url(alcance)}/${id}/estado`, {
      estado,
    });
  }

  eliminar(id: string, alcance?: AlcanceApi): Observable<void> {
    return this.http.delete<void>(`${this.url(alcance)}/${id}`);
  }
}
