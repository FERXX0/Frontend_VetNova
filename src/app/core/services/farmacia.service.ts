import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';
import {
  FormularioMedicamento,
  FormularioMovimiento,
  Medicamento,
  MovimientoMedicamento,
  ResumenFarmacia,
} from '../models/farmacia.model';

export interface RespuestaPaginaMedicamentos {
  data: Medicamento[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class FarmaciaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  obtenerMedicamentos(
    alcance?: AlcanceApi,
    filtros?: {
      busqueda?: string;
      categoria?: string;
      estado?: string;
      stock?: string;
      page?: number;
      per_page?: number;
    }
  ): Observable<RespuestaPaginaMedicamentos> {
    const url = urlRecurso(this.apiUrl, 'farmacia', alcance);

    let params = new HttpParams();
    if (filtros?.busqueda) params = params.set('q', filtros.busqueda);
    if (filtros?.categoria) params = params.set('categoria', filtros.categoria);
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.stock) params = params.set('stock', filtros.stock);
    if (filtros?.page) params = params.set('page', filtros.page.toString());
    if (filtros?.per_page) params = params.set('per_page', filtros.per_page.toString());

    return this.http.get<RespuestaPaginaMedicamentos>(url, { params });
  }

  obtenerResumen(alcance?: AlcanceApi): Observable<ResumenFarmacia> {
    const url = urlRecurso(this.apiUrl, 'farmacia/resumen', alcance);
    return this.http.get<ResumenFarmacia>(url);
  }

  obtenerDetalle(id: string, alcance?: AlcanceApi): Observable<Medicamento> {
    const url = urlRecurso(this.apiUrl, `farmacia/${id}`, alcance);
    return this.http.get<Medicamento>(url);
  }

  crearMedicamento(
    payload: FormularioMedicamento,
    alcance?: AlcanceApi
  ): Observable<Medicamento> {
    const url = urlRecurso(this.apiUrl, 'farmacia', alcance);

    const body = {
      nombre: payload.nombre,
      principio_activo: payload.principioActivo,
      concentracion: payload.concentracion,
      concentracion_unidad: payload.concentracion_unidad,
      presentacion: payload.presentacion,
      categoria: payload.categoria,
      laboratorio: payload.laboratorio,
      lote: payload.lote,
      fecha_vencimiento: payload.fechaVencimiento,
      stock: payload.stock,
      stock_minimo: payload.stockMinimo,
      visible_en_formulaciones: payload.visible_en_formulaciones,
      visible_en_evoluciones: payload.visible_en_evoluciones,
      ubicacion: payload.ubicacion,
      precio_compra: payload.precioCompra,
      precio_venta: payload.precioVenta,
    };

    return this.http.post<Medicamento>(url, body);
  }

  actualizarMedicamento(
    id: string,
    payload: FormularioMedicamento,
    alcance?: AlcanceApi
  ): Observable<Medicamento> {
    const url = urlRecurso(this.apiUrl, `farmacia/${id}`, alcance);

    const body = {
      nombre: payload.nombre,
      principio_activo: payload.principioActivo,
      concentracion: payload.concentracion,
      concentracion_unidad: payload.concentracion_unidad,
      presentacion: payload.presentacion,
      categoria: payload.categoria,
      laboratorio: payload.laboratorio,
      lote: payload.lote,
      fecha_vencimiento: payload.fechaVencimiento,
      stock: payload.stock,
      stock_minimo: payload.stockMinimo,
      visible_en_formulaciones: payload.visible_en_formulaciones,
      visible_en_evoluciones: payload.visible_en_evoluciones,
      ubicacion: payload.ubicacion,
      precio_compra: payload.precioCompra,
      precio_venta: payload.precioVenta,
    };

    return this.http.put<Medicamento>(url, body);
  }

  cambiarEstado(
    id: string,
    estado: 'Activo' | 'Inactivo',
    alcance?: AlcanceApi
  ): Observable<Medicamento> {
    const url = urlRecurso(this.apiUrl, `farmacia/${id}/estado`, alcance);
    return this.http.put<Medicamento>(url, { estado });
  }

  registrarMovimiento(
    id: string,
    payload: FormularioMovimiento,
    alcance?: AlcanceApi
  ): Observable<{ movimiento: MovimientoMedicamento; medicamento: Medicamento }> {
    const url = urlRecurso(this.apiUrl, `farmacia/${id}/movimientos`, alcance);

    return this.http.post<{ movimiento: MovimientoMedicamento; medicamento: Medicamento }>(
      url,
      payload
    );
  }

  eliminarMedicamento(id: string, alcance?: AlcanceApi): Observable<void> {
    const url = urlRecurso(this.apiUrl, `farmacia/${id}`, alcance);
    return this.http.delete<void>(url);
  }
}
