import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Empresa, EmpresaPayload, PaginacionLaravel } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly baseUrl = `${environment.apiUrl}/empresas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<PaginacionLaravel<Empresa>> {
    return this.http.get<PaginacionLaravel<Empresa>>(this.baseUrl);
  }

  obtener(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.baseUrl}/${id}`);
  }

  crear(payload: EmpresaPayload): Observable<Empresa> {
    return this.http.post<Empresa>(this.baseUrl, payload);
  }

  actualizar(id: string, payload: EmpresaPayload): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.baseUrl}/${id}`, payload);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}