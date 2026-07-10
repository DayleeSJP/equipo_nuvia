import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClienteResumen {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = 'http://localhost:8080/api/usuarios';

  constructor(private http: HttpClient) {}

  listarClientes(): Observable<ClienteResumen[]> {
    return this.http.get<ClienteResumen[]>(`${this.apiUrl}/clientes`);
  }
}
