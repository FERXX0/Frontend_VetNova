import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResumenDashboard } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  resumen(): Observable<ResumenDashboard> {
    return this.http.get<ResumenDashboard>(`${environment.apiUrl}/dashboard/resumen`);
  }
}
