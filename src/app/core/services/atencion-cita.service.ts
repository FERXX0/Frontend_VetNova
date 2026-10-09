import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';
import { AtencionCitaPayload, AtencionCitaResponse } from '../models/atencion-cita.model';

@Injectable({ providedIn: 'root' })
export class AtencionCitaService {
  private readonly http = inject(HttpClient);

  private url(alcance?: AlcanceApi): string {
    return urlRecurso(environment.apiUrl, 'citas', alcance);
  }

  obtener(citaId: string, alcance?: AlcanceApi): Observable<AtencionCitaResponse> {
    return this.http.get<AtencionCitaResponse>(`${this.url(alcance)}/${citaId}/atencion`);
  }

  registrar(citaId: string, payload: AtencionCitaPayload, alcance?: AlcanceApi): Observable<unknown> {
    return this.http.post(`${this.url(alcance)}/${citaId}/atencion`, payload);
  }
}
