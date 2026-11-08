import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlcanceApi, urlRecurso } from '../utils/alcance-api';

export interface ConfiguracionFacturacionClinica {
  servicio_id: string;
  cuenta_atencion_id?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class FacturacionClinicaService {
  private readonly http = inject(HttpClient);

  configurarProcedimiento(
    procedimientoId: string,
    datos: ConfiguracionFacturacionClinica,
    alcance?: AlcanceApi
  ): Observable<unknown> {
    const url = `${urlRecurso(environment.apiUrl, 'procedimientos', alcance)}/${encodeURIComponent(procedimientoId)}/configurar-facturacion`;
    return this.http.patch(url, datos);
  }

  configurarHospitalizacion(
    hospitalizacionId: string,
    datos: ConfiguracionFacturacionClinica,
    alcance?: AlcanceApi
  ): Observable<unknown> {
    const url = `${urlRecurso(environment.apiUrl, 'hospitalizacion', alcance)}/${encodeURIComponent(hospitalizacionId)}/configurar-facturacion`;
    return this.http.patch(url, datos);
  }
}
