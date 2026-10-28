import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginacionLaravel } from '../models/empresa.model';
import { Profesional } from '../models/cita.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';
import {
  EstadoProcedimiento,
  NotaProcedimientoPayload,
  Procedimiento,
  ProcedimientoPayload,
  ResumenProcedimientos,
} from '../models/procedimiento.model';

@Injectable({ providedIn: 'root' })
export class ProcedimientoService {
  private readonly http = inject(HttpClient);

  private url(alcance?: AlcanceApi): string {
    return urlRecurso(environment.apiUrl, 'procedimientos', alcance);
  }

  listar(
    params: {
      buscar?: string;
      estado?: string;
      prioridad?: string;
      categoria?: string;
      especie?: string;
      paciente_id?: string;
      desde?: string;
      hasta?: string;
      page?: number;
      per_page?: number;
    },
    alcance?: AlcanceApi
  ): Observable<PaginacionLaravel<Procedimiento>> {
    let httpParams = new HttpParams();
    if (params.buscar) httpParams = httpParams.set('buscar', params.buscar);
    if (params.estado) httpParams = httpParams.set('estado', params.estado);
    if (params.prioridad) httpParams = httpParams.set('prioridad', params.prioridad);
    if (params.categoria) httpParams = httpParams.set('categoria', params.categoria);
    if (params.especie) httpParams = httpParams.set('especie', params.especie);
    if (params.paciente_id) httpParams = httpParams.set('paciente_id', params.paciente_id);
    if (params.desde) httpParams = httpParams.set('desde', params.desde);
    if (params.hasta) httpParams = httpParams.set('hasta', params.hasta);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginacionLaravel<Procedimiento>>(this.url(alcance), { params: httpParams });
  }

  resumen(alcance?: AlcanceApi): Observable<ResumenProcedimientos> {
    return this.http.get<ResumenProcedimientos>(`${this.url(alcance)}/resumen`);
  }

  profesionales(alcance?: AlcanceApi): Observable<Profesional[]> {
    return this.http.get<Profesional[]>(`${this.url(alcance)}/profesionales`);
  }

  obtener(id: string, alcance?: AlcanceApi): Observable<Procedimiento> {
    return this.http.get<Procedimiento>(`${this.url(alcance)}/${id}`);
  }

  crear(payload: ProcedimientoPayload, alcance?: AlcanceApi): Observable<Procedimiento> {
    return this.http.post<Procedimiento>(this.url(alcance), payload);
  }

  actualizar(id: string, payload: ProcedimientoPayload, alcance?: AlcanceApi): Observable<Procedimiento> {
    return this.http.put<Procedimiento>(`${this.url(alcance)}/${id}`, payload);
  }

  cambiarEstado(id: string, estado: EstadoProcedimiento, alcance?: AlcanceApi): Observable<Procedimiento> {
    return this.http.patch<Procedimiento>(`${this.url(alcance)}/${id}/estado`, { estado });
  }

  agregarNota(id: string, payload: NotaProcedimientoPayload, alcance?: AlcanceApi): Observable<Procedimiento> {
    return this.http.post<Procedimiento>(`${this.url(alcance)}/${id}/notas`, payload);
  }
}
