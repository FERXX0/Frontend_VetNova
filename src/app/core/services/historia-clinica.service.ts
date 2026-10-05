import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginacionLaravel } from '../models/empresa.model';
import { EstadoPaciente } from '../models/paciente.model';
import { Profesional } from '../models/cita.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';
import {
  ConsultaClinica,
  ConsultaPayload,
  DatosGeneralesPayload,
  HistoriaDetalle,
  HistoriaResumen,
  ResumenHistorias,
} from '../models/historia-clinica.model';

@Injectable({ providedIn: 'root' })
export class HistoriaClinicaService {
  private readonly http = inject(HttpClient);

  private url(alcance?: AlcanceApi): string {
    return urlRecurso(environment.apiUrl, 'historias-clinicas', alcance);
  }

  listar(
    params: {
      buscar?: string;
      especie?: string;
      estado?: EstadoPaciente;
      page?: number;
      per_page?: number;
    },
    alcance?: AlcanceApi
  ): Observable<PaginacionLaravel<HistoriaResumen>> {
    let httpParams = new HttpParams();
    if (params.buscar) httpParams = httpParams.set('buscar', params.buscar);
    if (params.especie) httpParams = httpParams.set('especie', params.especie);
    if (params.estado) httpParams = httpParams.set('estado', params.estado);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginacionLaravel<HistoriaResumen>>(this.url(alcance), {
      params: httpParams,
    });
  }

  resumen(alcance?: AlcanceApi): Observable<ResumenHistorias> {
    return this.http.get<ResumenHistorias>(`${this.url(alcance)}/resumen`);
  }

  profesionales(alcance?: AlcanceApi): Observable<Profesional[]> {
    return this.http.get<Profesional[]>(`${this.url(alcance)}/profesionales`);
  }

  obtener(id: string, alcance?: AlcanceApi): Observable<HistoriaDetalle> {
    return this.http.get<HistoriaDetalle>(`${this.url(alcance)}/${id}`);
  }

  actualizarDatosGenerales(
    id: string,
    payload: DatosGeneralesPayload,
    alcance?: AlcanceApi
  ): Observable<HistoriaDetalle> {
    return this.http.put<HistoriaDetalle>(`${this.url(alcance)}/${id}`, payload);
  }

  crearConsulta(
    id: string,
    payload: ConsultaPayload,
    alcance?: AlcanceApi
  ): Observable<ConsultaClinica> {
    return this.http.post<ConsultaClinica>(`${this.url(alcance)}/${id}/consultas`, payload);
  }

  actualizarConsulta(
    id: string,
    consultaId: string,
    payload: ConsultaPayload,
    alcance?: AlcanceApi
  ): Observable<ConsultaClinica> {
    return this.http.put<ConsultaClinica>(
      `${this.url(alcance)}/${id}/consultas/${consultaId}`,
      payload
    );
  }

  eliminarConsulta(id: string, consultaId: string, alcance?: AlcanceApi): Observable<void> {
    return this.http.delete<void>(`${this.url(alcance)}/${id}/consultas/${consultaId}`);
  }
}
