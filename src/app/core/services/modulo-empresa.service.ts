import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Modulo } from '../models/auth.model';

export interface ModuloEmpresaRegistro {
  empresa_id: string;
  modulo_id: string;
  activo: boolean;
  monto_mensual: string | number;
  moneda: string;
  adquirido_en?: string;
  vence_en?: string | null;
  modulo?: Modulo;
}

export interface ModuloEmpresaPayload {
  modulo_id: string;
  activo: boolean;
  monto_mensual: number;
  moneda: string;
  vence_en?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ModuloEmpresaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** GET /api/empresas/{empresa}/modulos — módulos ya aprovisionados para la empresa. */
  listar(empresaId: string): Observable<ModuloEmpresaRegistro[]> {
    return this.http.get<ModuloEmpresaRegistro[]>(`${this.apiUrl}/empresas/${empresaId}/modulos`);
  }

  /** POST /api/empresas/{empresa}/modulos — crea o actualiza (updateOrCreate) el estado de un módulo. */
  guardar(empresaId: string, payload: ModuloEmpresaPayload): Observable<ModuloEmpresaRegistro> {
    return this.http.post<ModuloEmpresaRegistro>(`${this.apiUrl}/empresas/${empresaId}/modulos`, payload);
  }
}