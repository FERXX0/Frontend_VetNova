import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Empresa, EmpresaOpcion, EmpresaPayload, EstadoEmpresa, PaginacionLaravel } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly baseUrl = `${environment.apiUrl}/empresas`;

  constructor(private http: HttpClient) {}

  listar(params?: { page?: number; estado?: EstadoEmpresa }): Observable<PaginacionLaravel<Empresa>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);

    return this.http.get<PaginacionLaravel<Empresa>>(this.baseUrl, { params: httpParams });
  }

  listarOpciones(): Observable<EmpresaOpcion[]> {
    return this.http.get<EmpresaOpcion[]>(`${this.baseUrl}/opciones`);
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