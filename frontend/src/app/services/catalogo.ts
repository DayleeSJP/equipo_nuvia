import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SalonCard {
  id: number;
  nombre: string;
  direccion: string;
  distrito: string;
  tipo: string;
  rating: string;
  imagen: string;
  servicios: string[];
}

export interface ServicioDetalle {
  id: number;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  precio: number;
  duracion: string;
}

export interface CategoriaDetalle {
  id: number;
  nombre: string;
  descripcion: string;
  color: string;
  servicios: ServicioDetalle[];
}

export interface TrabajadorDetalle {
  id: number;
  nombre: string;
  apellido: string;
  especialidad?: string;
}

export interface DetallePeluqueria {
  id: number;
  usuarioId: number;
  nombreNegocio: string;
  direccion: string;
  distrito: string;
  portada: string;
  sobreNosotros: string;
  estado: string;
  activa: boolean;
  categorias: CategoriaDetalle[];
  trabajadores: TrabajadorDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  private apiUrl = 'http://localhost:8080/api/catalogo';

  constructor(private http: HttpClient) {}

  listarPeluquerias(): Observable<SalonCard[]> {
    return this.http.get<SalonCard[]>(`${this.apiUrl}/peluquerias`);
  }

  obtenerDetalle(id: number): Observable<DetallePeluqueria> {
    return this.http.get<DetallePeluqueria>(`${this.apiUrl}/peluquerias/${id}`);
  }
}
