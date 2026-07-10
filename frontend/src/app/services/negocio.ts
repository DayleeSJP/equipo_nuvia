import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetallePeluqueria } from './catalogo';

export interface ServicioRequest {
  id?: number | null;
  nombre: string;
  descripcion: string;
  tipoTratamiento: string;
  tipoPrecio: string;
  precio: number;
  duracion: string;
}

export interface CategoriaRequest {
  id?: number | null;
  nombre: string;
  descripcion: string;
  color: string;
  servicios: ServicioRequest[];
}

export interface TrabajadorRequest {
  id?: number | null;
  nombre: string;
  apellido: string;
  especialidad?: string;
}

export interface PersonalizacionNegocioRequest {
  usuarioId: number;
  peluqueriaId: number;
  portadaImagen: string;
  sobreNosotros: string;
  categorias: CategoriaRequest[];
  trabajadores: TrabajadorRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class NegocioService {

  private apiUrl = 'http://localhost:8080/api/negocio';

  constructor(private http: HttpClient) {}

  obtenerPorUsuario(usuarioId: number): Observable<DetallePeluqueria> {
    return this.http.get<DetallePeluqueria>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  guardarPersonalizacion(
    data: PersonalizacionNegocioRequest
  ): Observable<DetallePeluqueria> {
    return this.http.put<DetallePeluqueria>(`${this.apiUrl}/personalizacion`, data);
  }
}
