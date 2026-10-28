import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginacionLaravel } from '../models/empresa.model';
import { Profesional } from '../models/cita.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';
import {
  AgregarMedicamentoPayload,
  EvolucionFormulacion,
  FormulacionFila,
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
      dispensacion?: 'pendientes' | 'completas' | 'todas';
      page?: number;
      per_page?: number;
    },
    alcance?: AlcanceApi
  ): Observable<PaginacionLaravel<FormulacionFila>> {
    let httpParams = new HttpParams();
    if (params.buscar) httpParams = httpParams.set('buscar', params.buscar);
    if (params.especie) httpParams = httpParams.set('especie', params.especie);
    if (params.estado) httpParams = httpParams.set('estado', params.estado);
    if (params.dispensacion) httpParams = httpParams.set('dispensacion', params.dispensacion);
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

  dispensar(id: string, lineaId: string): Observable<FormulacionFila> {
    return this.http.post<FormulacionFila>(
      `${this.url()}/${id}/medicamentos/${lineaId}/dispensar`,
      {}
    );
  }

  cambiarEstado(
    id: string,
    estado: 'Finalizada' | 'Cancelada',
    alcance?: AlcanceApi
  ): Observable<FormulacionFila> {
    return this.http.patch<FormulacionFila>(`${this.url(alcance)}/${id}/estado`, { estado });
  }

  evoluciones(id: string, alcance?: AlcanceApi): Observable<EvolucionFormulacion[]> {
    return this.http.get<EvolucionFormulacion[]>(`${this.url(alcance)}/${id}/evoluciones`);
  }

  agregarMedicamento(
    id: string,
    payload: AgregarMedicamentoPayload,
    alcance?: AlcanceApi
  ): Observable<FormulacionFila> {
    return this.http.post<FormulacionFila>(`${this.url(alcance)}/${id}/medicamentos`, payload);
  }

  retirarMedicamento(
    id: string,
    lineaId: string,
    alcance?: AlcanceApi
  ): Observable<FormulacionFila> {
    return this.http.delete<FormulacionFila>(`${this.url(alcance)}/${id}/medicamentos/${lineaId}`);
  }
}
