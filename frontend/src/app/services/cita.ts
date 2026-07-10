import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistroCitaRequest {
  clienteId: number;
  peluqueriaId: number;
  servicioId: number;
  trabajadorId: number | null;
  fecha: string;
  hora: string;
}

export interface CitaResponse {
  id: number;
  codigoConfirmacion: string;

  clienteId: number;
  cliente: string;
  clienteEmail: string;

  peluqueriaId: number;
  negocio: string;
  direccion: string;

  servicioId: number;
  servicio: string;
  duracionMin: number;
  precio: number;

  trabajadorId: number | null;
  trabajador: string;

  fecha: string;
  hora: string;
  estado: string;
  fechaRegistro: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitaService {

  private apiUrl = 'http://localhost:8080/api/citas';

  constructor(private http: HttpClient) {}

  registrarCita(cita: RegistroCitaRequest): Observable<CitaResponse> {
    return this.http.post<CitaResponse>(this.apiUrl, cita);
  }

  listarPorCliente(clienteId: number): Observable<CitaResponse[]> {
    return this.http.get<CitaResponse[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  listarPorPeluqueria(peluqueriaId: number): Observable<CitaResponse[]> {
    return this.http.get<CitaResponse[]>(`${this.apiUrl}/peluqueria/${peluqueriaId}`);
  }

  cancelarCita(citaId: number, clienteId: number): Observable<CitaResponse> {
    return this.http.patch<CitaResponse>(
      `${this.apiUrl}/${citaId}/cancelar?clienteId=${clienteId}`,
      {}
    );
  }

  actualizarEstado(
    citaId: number,
    peluqueriaId: number,
    estado: string
  ): Observable<CitaResponse> {
    return this.http.patch<CitaResponse>(`${this.apiUrl}/${citaId}/estado`, {
      peluqueriaId,
      estado
    });
  }
}
