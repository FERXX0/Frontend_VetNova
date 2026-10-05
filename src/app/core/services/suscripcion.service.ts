import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PaginacionLaravel } from '../models/empresa.model';
import { Suscripcion, SuscripcionPayload } from '../models/suscripcion.model';

@Injectable({ providedIn: 'root' })
export class SuscripcionService {
  constructor(private http: HttpClient) {}

  // Las suscripciones cuelgan siempre de una empresa: /empresas/{empresa}/suscripciones
  listarPorEmpresa(empresaId: string): Observable<PaginacionLaravel<Suscripcion>> {
    return this.http.get<PaginacionLaravel<Suscripcion>>(
      `${environment.apiUrl}/empresas/${empresaId}/suscripciones`
    );
  }

  crear(empresaId: string, payload: SuscripcionPayload): Observable<Suscripcion> {
    return this.http
      .post<{ message: string; suscripcion: Suscripcion }>(
        `${environment.apiUrl}/empresas/${empresaId}/suscripciones`,
        payload
      )
      .pipe(map((respuesta) => respuesta.suscripcion));
  }
}