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

export interface CargoCuenta {
  id: string;
  origen_tipo: string;
  origen_id: string;
  descripcion: string;
  cantidad: string;
  precio_unitario: string;
  subtotal: string;
  anulado_en: string | null;
  anulado_por: string | null;
  motivo_anulacion: string | null;
  creado_en: string;
}

export interface PagoCuenta {
  id: string;
  monto: string;
  metodo_pago: string;
  referencia: string | null;
  notas: string | null;
  usuario?: { id: string; nombre: string } | null;
  creado_en: string;
}

export interface CuentaPaciente {
  id: string;
  empresa_id: string;
  atencion_id: string;
  estado: 'abierta' | 'cerrada';
  subtotal: string;
  descuentos: string;
  impuestos: string;
  total: string;
  pagado: string;
  cerrada_en: string | null;
  creado_en: string;
  atencion?: {
    paciente?: { id: string; nombre: string; especie?: string };
    propietario?: { id: string; nombre: string; numero_identificacion?: string; celular?: string };
    cita?: { id: string; estado: string };
  };
  detalles?: CargoCuenta[];
  pagos?: PagoCuenta[];
  facturas?: any[];
}

export interface RespuestaCuentas {
  data: CuentaPaciente[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
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

  listarCuentas(alcance?: AlcanceApi, filtros: { estado?: string; buscar?: string; page?: number } = {}): Observable<RespuestaCuentas> {
    const url = urlRecurso(environment.apiUrl, 'facturacion/cuentas', alcance);
    let params = new HttpParams().set('page', (filtros.page || 1).toString()).set('per_page', '15');
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    return this.http.get<RespuestaCuentas>(url, { params });
  }

  obtenerCuenta(cuentaId: string, alcance?: AlcanceApi): Observable<CuentaPaciente> {
    const url = urlRecurso(environment.apiUrl, `facturacion/cuentas/${encodeURIComponent(cuentaId)}`, alcance);
    return this.http.get<CuentaPaciente>(url);
  }

  registrarPago(
    cuentaId: string,
    payload: { monto: number; metodo_pago: string; referencia?: string; notas?: string },
    alcance?: AlcanceApi
  ): Observable<CuentaPaciente> {
    const url = urlRecurso(environment.apiUrl, `facturacion/cuentas/${encodeURIComponent(cuentaId)}/pagos`, alcance);
    return this.http.post<CuentaPaciente>(url, payload);
  }

  cerrarCuenta(cuentaId: string, alcance?: AlcanceApi): Observable<CuentaPaciente> {
    const url = urlRecurso(environment.apiUrl, `facturacion/cuentas/${encodeURIComponent(cuentaId)}/cerrar`, alcance);
    return this.http.post<CuentaPaciente>(url, {});
  }

  emitirFactura(cuentaId: string, alcance?: AlcanceApi): Observable<Factura> {
    const url = urlRecurso(environment.apiUrl, `facturacion/cuentas/${encodeURIComponent(cuentaId)}/emitir-factura`, alcance);
    return this.http.post<Factura>(url, {});
  }

  anularCargo(cuentaId: string, detalleId: string, motivo: string, alcance?: AlcanceApi): Observable<CuentaPaciente> {
    const url = urlRecurso(
      environment.apiUrl,
      `facturacion/cuentas/${encodeURIComponent(cuentaId)}/detalles/${encodeURIComponent(detalleId)}/anular`,
      alcance
    );
    return this.http.post<CuentaPaciente>(url, { motivo });
  }
}
