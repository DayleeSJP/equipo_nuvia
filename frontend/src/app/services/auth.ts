import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroClienteRequest {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
}

export interface RegistroNegocioCompletoRequest {
  usuarioId?: number | null;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
  nombreNegocio: string;
  direccion: string;
  distrito: string;
}

export interface LoginResponse {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  rol: string;
  peluqueriaId: number | null;
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data);
  }

  loginCliente(data: LoginRequest): Observable<LoginResponse> {
    return this.login(data);
  }

  registrarCliente(data: RegistroClienteRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/registro-cliente`, data);
  }

  registrarNegocio(data: RegistroNegocioCompletoRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/registro-negocio`, data);
  }

  guardarSesion(usuario: LoginResponse): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  obtenerSesion(): LoginResponse | null {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuario');
  }
}
