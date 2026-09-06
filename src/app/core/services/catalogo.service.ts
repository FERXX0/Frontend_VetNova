import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rol, Modulo } from '../models/auth.model';
import { Plan } from '../models/suscripcion.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/catalogos`;

  // GET /api/catalogos/roles -> Rol::where('activo', true)->orderBy('nombre')->get()
  roles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.baseUrl}/roles`);
  }

  // GET /api/catalogos/modulos -> Modulo::where('activo', true)->orderBy('orden')->get()
  modulos(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.baseUrl}/modulos`);
  }

  // GET /api/catalogos/planes -> Plan::where('activo', true)->with('modulos')->orderBy('precio_mensual')->get()
  planes(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.baseUrl}/planes`);
  }
}