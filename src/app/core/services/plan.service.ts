import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginacionLaravel, Plan, PlanPayload } from '../models/suscripcion.model';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/planes`;

  /** GET /api/planes (paginado, incluye planes inactivos y sus módulos). */
  listar(pagina = 1): Observable<PaginacionLaravel<Plan>> {
    const params = new HttpParams().set('page', pagina);
    return this.http.get<PaginacionLaravel<Plan>>(this.baseUrl, { params });
  }

  /** POST /api/planes */
  crear(payload: PlanPayload): Observable<{ message: string; plan: Plan }> {
    return this.http.post<{ message: string; plan: Plan }>(this.baseUrl, payload);
  }

  /** PUT /api/planes/{plan} — `modulos` reemplaza los módulos del plan. */
  actualizar(id: string, payload: PlanPayload): Observable<{ message: string; plan: Plan }> {
    return this.http.put<{ message: string; plan: Plan }>(`${this.baseUrl}/${id}`, payload);
  }

  /** DELETE /api/planes/{plan} */
  eliminar(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}