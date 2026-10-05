import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Servicio, ServicioPayload } from '../models/servicio.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';

@Injectable({ providedIn: 'root' })
export class ServicioService {
  private readonly http = inject(HttpClient);

  private url(alcance?: AlcanceApi): string {
    return urlRecurso(environment.apiUrl, 'servicios', alcance);
  }

  listar(soloActivos = false, alcance?: AlcanceApi): Observable<Servicio[]> {
    let params = new HttpParams();
    if (soloActivos) {
      params = params.set('solo_activos', 'true');
    }
    return this.http.get<Servicio[]>(this.url(alcance), { params });
  }

  obtener(id: string, alcance?: AlcanceApi): Observable<Servicio> {
    return this.http.get<Servicio>(`${this.url(alcance)}/${id}`);
  }

  crear(payload: ServicioPayload, alcance?: AlcanceApi): Observable<Servicio> {
    return this.http.post<Servicio>(this.url(alcance), payload);
  }

  actualizar(id: string, payload: ServicioPayload, alcance?: AlcanceApi): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.url(alcance)}/${id}`, payload);
  }

  eliminar(id: string, alcance?: AlcanceApi): Observable<void> {
    return this.http.delete<void>(`${this.url(alcance)}/${id}`);
  }
}
