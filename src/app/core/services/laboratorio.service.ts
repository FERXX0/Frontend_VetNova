import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginacionLaravel } from '../models/empresa.model';
import { Profesional } from '../models/cita.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';
import {
    EstadoSolicitud,
    NotaPayload,
    ResultadoPayload,
    ResumenLaboratorio,
    SolicitudLaboratorio,
    SolicitudPayload,
    
} from '../models/laboratorio.model';

@Injectable({ providedIn: 'root' })
export class LaboratorioService {
    private readonly http = inject(HttpClient);

    private url(alcance?: AlcanceApi): string {
        return urlRecurso(environment.apiUrl, 'laboratorio', alcance);
    }

    listar(
        params: {
            buscar?: string;
            estado?: string;
            prioridad?: string;
            categoria?: string;
            page?: number;
            per_page?: number;
        },
        alcance?: AlcanceApi
    ): Observable<PaginacionLaravel<SolicitudLaboratorio>> {
        let httpParams = new HttpParams();
        if (params.buscar) httpParams = httpParams.set('buscar', params.buscar);
        if (params.estado) httpParams = httpParams.set('estado', params.estado);
        if (params.prioridad) httpParams = httpParams.set('prioridad', params.prioridad);
        if (params.categoria) httpParams = httpParams.set('categoria', params.categoria);
        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

        return this.http.get<PaginacionLaravel<SolicitudLaboratorio>>(this.url(alcance), {
            params: httpParams,
        });
    }

    resumen(alcance?: AlcanceApi): Observable<ResumenLaboratorio> {
        return this.http.get<ResumenLaboratorio>(`${this.url(alcance)}/resumen`);
    }

    profesionales(alcance?: AlcanceApi): Observable<Profesional[]> {
        return this.http.get<Profesional[]>(`${this.url(alcance)}/profesionales`);
    }

    obtener(id: string, alcance?: AlcanceApi): Observable<SolicitudLaboratorio> {
        return this.http.get<SolicitudLaboratorio>(`${this.url(alcance)}/${id}`);
    }

    crear(payload: SolicitudPayload, alcance?: AlcanceApi): Observable<SolicitudLaboratorio> {
        return this.http.post<SolicitudLaboratorio>(this.url(alcance), payload);
    }

    actualizar(
        id: string,
        payload: SolicitudPayload,
        alcance?: AlcanceApi
    ): Observable<SolicitudLaboratorio> {
        return this.http.put<SolicitudLaboratorio>(`${this.url(alcance)}/${id}`, payload);
    }

    cambiarEstado(
        id: string,
        estado: EstadoSolicitud,
        alcance?: AlcanceApi
    ): Observable<SolicitudLaboratorio> {
        return this.http.patch<SolicitudLaboratorio>(`${this.url(alcance)}/${id}/estado`, { estado });
    }

    agregarResultado(
        id: string,
        payload: ResultadoPayload,
        alcance?: AlcanceApi
    ): Observable<SolicitudLaboratorio> {
        return this.http.post<SolicitudLaboratorio>(`${this.url(alcance)}/${id}/resultados`, payload);
    }

    agregarNota(
        id: string,
        payload: NotaPayload,
        alcance?: AlcanceApi
    ): Observable<SolicitudLaboratorio> {
        return this.http.post<SolicitudLaboratorio>(`${this.url(alcance)}/${id}/notas`, payload);
    }

    eliminar(id: string, alcance?: AlcanceApi): Observable<void> {
        return this.http.delete<void>(`${this.url(alcance)}/${id}`);
    }
}