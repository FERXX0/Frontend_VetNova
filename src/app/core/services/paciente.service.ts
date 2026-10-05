import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paciente, PacientePayload } from '../models/paciente.model';
import { PaginacionLaravel } from '../models/empresa.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';

@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly http = inject(HttpClient);

  private url(alcance?: AlcanceApi): string {
    return urlRecurso(environment.apiUrl, 'pacientes', alcance);
  }

  listar(
    params?: { buscar?: string; especie?: string; page?: number; per_page?: number },
    alcance?: AlcanceApi
  ): Observable<PaginacionLaravel<Paciente>> {
    let httpParams = new HttpParams();
    if (params?.buscar) httpParams = httpParams.set('buscar', params.buscar);
    if (params?.especie) httpParams = httpParams.set('especie', params.especie);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginacionLaravel<Paciente>>(this.url(alcance), { params: httpParams });
  }

  obtener(id: string, alcance?: AlcanceApi): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.url(alcance)}/${id}`);
  }

  crear(payload: PacientePayload, alcance?: AlcanceApi): Observable<Paciente> {
    return this.http.post<Paciente>(this.url(alcance), payload);
  }

  actualizar(id: string, payload: PacientePayload, alcance?: AlcanceApi): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.url(alcance)}/${id}`, payload);
  }

  eliminar(id: string, alcance?: AlcanceApi): Observable<void> {
    return this.http.delete<void>(`${this.url(alcance)}/${id}`);
  }
}