import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Factura } from '../models/factura.model';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';

export interface RespuestaFacturas {
  data: Factura[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FiltrosFacturas {
  buscar?: string;
  desde?: string;
  hasta?: string;
}

@Injectable({ providedIn: 'root' })
export class FacturacionService {
  private readonly http = inject(HttpClient);

  listar(alcance?: AlcanceApi, filtros: FiltrosFacturas = {}, page = 1): Observable<RespuestaFacturas> {
    const url = urlRecurso(environment.apiUrl, 'facturacion', alcance);
    let params = new HttpParams().set('page', page.toString()).set('per_page', '15');

    if (filtros.buscar) { params = params.set('buscar', filtros.buscar); }
    if (filtros.desde) { params = params.set('desde', filtros.desde); }
    if (filtros.hasta) { params = params.set('hasta', filtros.hasta); }

    return this.http.get<RespuestaFacturas>(url, { params });
  }

  obtener(id: string, alcance?: AlcanceApi): Observable<Factura> {
    const url = urlRecurso(environment.apiUrl, `facturacion/${id}`, alcance);
    return this.http.get<Factura>(url);
  }
}
