import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlanActual {
  peluqueriaId: number;
  plan: 'STANDARD' | 'PREMIUM';
  descripcion: string;
  precioMensual: number;
  limiteServicios: number | null;
  serviciosUsados: number;
  premium: boolean;
  estado: string;
  fechaInicio: string;
  fechaFin: string | null;
  mensaje?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private apiUrl = 'http://localhost:8080/api/planes';

  constructor(private http: HttpClient) {}

  obtenerPlan(usuarioId: number): Observable<PlanActual> {
    return this.http.get<PlanActual>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  activarPremium(usuarioId: number): Observable<PlanActual> {
    return this.http.post<PlanActual>(`${this.apiUrl}/usuario/${usuarioId}/premium`, {});
  }

  activarStandard(usuarioId: number): Observable<PlanActual> {
    return this.http.post<PlanActual>(`${this.apiUrl}/usuario/${usuarioId}/standard`, {});
  }
}
