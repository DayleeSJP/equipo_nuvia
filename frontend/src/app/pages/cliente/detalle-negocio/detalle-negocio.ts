import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CatalogoService,
  CategoriaDetalle,
  ServicioDetalle,
  TrabajadorDetalle
} from '../../../services/catalogo';

@Component({
  selector: 'app-detalle-negocio',
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-negocio.html',
  styleUrl: './detalle-negocio.css'
})
export class DetalleNegocio implements OnInit {

  peluqueriaId: number | null = null;

  nombreNegocio = '';
  direccion = '';
  distrito = '';
  portada = '';
  sobreNosotros = '';

  categorias: CategoriaDetalle[] = [];
  trabajadores: TrabajadorDetalle[] = [];

  cargando = true;
  error = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private catalogoService: CatalogoService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.error = 'No se encontró la peluquería seleccionada.';
      this.cargando = false;
      return;
    }

    this.peluqueriaId = id;
    this.cargarDetalleDesdeBackend(id);
  }

  cargarDetalleDesdeBackend(id: number): void {
    this.catalogoService.obtenerDetalle(id).subscribe({
      next: (data) => {
        this.nombreNegocio = data.nombreNegocio;
        this.direccion = data.direccion;
        this.distrito = data.distrito;
        this.portada = data.portada || '';
        this.sobreNosotros = data.sobreNosotros || '';
        this.categorias = data.categorias || [];
        this.trabajadores = data.trabajadores || [];
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar detalle:', error);
        this.error = error.error?.mensaje || 'No se pudo cargar la peluquería.';
        this.cargando = false;
      }
    });
  }

  totalServicios(): number {
    return this.categorias.reduce(
      (total, categoria) => total + categoria.servicios.length,
      0
    );
  }

  reservar(servicio?: ServicioDetalle): void {
    if (!this.peluqueriaId) {
      this.error = 'No se encontró el ID de la peluquería.';
      return;
    }

    this.router.navigate(
      ['/cliente/reserva', this.peluqueriaId],
      servicio ? { queryParams: { servicioId: servicio.id } } : undefined
    );
  }
}
