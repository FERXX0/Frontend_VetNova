import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AtencionVeterinaria, PaginaAtenciones, TipoAtencion } from '../models/atencion-cuenta.model';

@Injectable({ providedIn: 'root' })
export class AtencionCuentaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/atenciones`;

  listar(params: { paciente_id?: string; estado?: string; page?: number } = {}): Observable<PaginaAtenciones> {
    let query = new HttpParams();
    if (params.paciente_id) query = query.set('paciente_id', params.paciente_id);
    if (params.estado) query = query.set('estado', params.estado);
    if (params.page) query = query.set('page', params.page.toString());
    return this.http.get<PaginaAtenciones>(this.url, { params: query });
  }
  crear(datos: { paciente_id: string; tipo: TipoAtencion; motivo?: string }): Observable<AtencionVeterinaria> {
    return this.http.post<AtencionVeterinaria>(this.url, datos);
  }
  obtener(id: string): Observable<AtencionVeterinaria> {
    return this.http.get<AtencionVeterinaria>(`${this.url}/${encodeURIComponent(id)}`);
  }
  finalizar(id: string): Observable<AtencionVeterinaria> {
    return this.http.post<AtencionVeterinaria>(`${this.url}/${encodeURIComponent(id)}/finalizar`, {});
  }
}
