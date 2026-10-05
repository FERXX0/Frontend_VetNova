import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginacionLaravel } from '../models/empresa.model';
import { Profesional } from '../models/cita.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';
import {
  Desparasitacion,
  DesparasitacionPayload,
  EsquemaPacienteDetalle,
  EsquemaPacienteFila,
  ResumenEsquemaVD,
  Vacuna,
  VacunaPayload,
} from '../models/esquema-vd.model';

@Injectable({ providedIn: 'root' })
export class EsquemaVDService {
  private readonly http = inject(HttpClient);

  private url(alcance?: AlcanceApi): string {
    return urlRecurso(environment.apiUrl, 'esquema-v-d', alcance);
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
  ): Observable<PaginacionLaravel<EsquemaPacienteFila>> {
    let httpParams = new HttpParams();
    if (params.buscar) httpParams = httpParams.set('buscar', params.buscar);
    if (params.especie) httpParams = httpParams.set('especie', params.especie);
    if (params.estado) httpParams = httpParams.set('estado', params.estado);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<PaginacionLaravel<EsquemaPacienteFila>>(this.url(alcance), {
      params: httpParams,
    });
  }

  resumen(alcance?: AlcanceApi): Observable<ResumenEsquemaVD> {
    return this.http.get<ResumenEsquemaVD>(`${this.url(alcance)}/resumen`);
  }

  profesionales(alcance?: AlcanceApi): Observable<Profesional[]> {
    return this.http.get<Profesional[]>(`${this.url(alcance)}/profesionales`);
  }

  obtener(pacienteId: string, alcance?: AlcanceApi): Observable<EsquemaPacienteDetalle> {
    return this.http.get<EsquemaPacienteDetalle>(`${this.url(alcance)}/${pacienteId}`);
  }

  crearVacuna(
    pacienteId: string,
    payload: VacunaPayload,
    alcance?: AlcanceApi
  ): Observable<Vacuna> {
    return this.http.post<Vacuna>(`${this.url(alcance)}/${pacienteId}/vacunas`, payload);
  }

  actualizarVacuna(
    pacienteId: string,
    vacunaId: string,
    payload: VacunaPayload,
    alcance?: AlcanceApi
  ): Observable<Vacuna> {
    return this.http.put<Vacuna>(
      `${this.url(alcance)}/${pacienteId}/vacunas/${vacunaId}`,
      payload
    );
  }

  eliminarVacuna(
    pacienteId: string,
    vacunaId: string,
    alcance?: AlcanceApi
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.url(alcance)}/${pacienteId}/vacunas/${vacunaId}`
    );
  }

  crearDesparasitacion(
    pacienteId: string,
    payload: DesparasitacionPayload,
    alcance?: AlcanceApi
  ): Observable<Desparasitacion> {
    return this.http.post<Desparasitacion>(
      `${this.url(alcance)}/${pacienteId}/desparasitaciones`,
      payload
    );
  }

  actualizarDesparasitacion(
    pacienteId: string,
    desparasitacionId: string,
    payload: DesparasitacionPayload,
    alcance?: AlcanceApi
  ): Observable<Desparasitacion> {
    return this.http.put<Desparasitacion>(
      `${this.url(alcance)}/${pacienteId}/desparasitaciones/${desparasitacionId}`,
      payload
    );
  }

  eliminarDesparasitacion(
    pacienteId: string,
    desparasitacionId: string,
    alcance?: AlcanceApi
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.url(alcance)}/${pacienteId}/desparasitaciones/${desparasitacionId}`
    );
  }
}
