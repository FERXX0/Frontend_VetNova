import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Servicio, ServicioPayload } from '../models/servicio.model';

/**
 * Servicio para el catálogo de Servicios / Tipos de servicio de la empresa.
 * Módulo: 'servicios'.
 *
 * Backend: App\Http\Controllers\Api\ServicioController (rutas ya expuestas
 * mediante Route::apiResource('servicios', ...) en routes/api.php, dentro
 * del grupo autenticado con Sanctum). El alcance a la empresa se resuelve
 * en el backend a partir de $request->user()->empresa_id.
 */
@Injectable({ providedIn: 'root' })
export class ServicioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/servicios`;

  /**
   * Lista los servicios de la empresa autenticada.
   * @param soloActivos si es true, filtra por Servicio::activo = true
   *   (parámetro 'solo_activos' soportado por ServicioController::index).
   */
  listar(soloActivos = false): Observable<Servicio[]> {
    let params = new HttpParams();
    if (soloActivos) {
      params = params.set('solo_activos', 'true');
    }
    return this.http.get<Servicio[]>(this.baseUrl, { params });
  }

  obtener(id: string): Observable<Servicio> {
    return this.http.get<Servicio>(`${this.baseUrl}/${id}`);
  }

  crear(payload: ServicioPayload): Observable<Servicio> {
    return this.http.post<Servicio>(this.baseUrl, payload);
  }

  actualizar(id: string, payload: ServicioPayload): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.baseUrl}/${id}`, payload);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
