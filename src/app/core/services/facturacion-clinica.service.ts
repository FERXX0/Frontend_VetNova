import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConfiguracionFacturacionClinica {
  servicio_id: string;
  cuenta_atencion_id?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FacturacionClinicaService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  configurarProcedimiento(
    procedimientoId: string,
    datos: ConfiguracionFacturacionClinica,
    empresaId?: string
  ): Observable<unknown> {
    const prefijo = empresaId
      ? `plataforma/empresas/${encodeURIComponent(empresaId)}`
      : '';

    const ruta = [
      this.api,
      prefijo,
      'procedimientos',
      encodeURIComponent(procedimientoId),
      'configurar-facturacion'
    ].filter(Boolean).join('/');

    return this.http.patch(ruta, datos);
  }

  configurarHospitalizacion(
    hospitalizacionId: string,
    datos: ConfiguracionFacturacionClinica,
    empresaId?: string
  ): Observable<unknown> {
    const prefijo = empresaId
      ? `plataforma/empresas/${encodeURIComponent(empresaId)}`
      : '';

    const ruta = [
      this.api,
      prefijo,
      'hospitalizacion',
      encodeURIComponent(hospitalizacionId),
      'configurar-facturacion'
    ].filter(Boolean).join('/');

    return this.http.patch(ruta, datos);
  }
}
