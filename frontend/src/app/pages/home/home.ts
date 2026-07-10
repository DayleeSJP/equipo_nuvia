import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CatalogoService, SalonCard } from '../../services/catalogo';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginResponse } from '../../services/auth';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  usuarioActual: LoginResponse | null = null;
  menuPerfilAbierto = false;
  catalogoCompleto: SalonCard[] = [];

  ubicacionSeleccionada = '';
  servicioSeleccionado = '';
  fechaSeleccionada = '';

  busquedaRealizada = false;
  sinResultados = false;
  cargandoCatalogo = false;
  errorCatalogo = '';

  recomendados: SalonCard[] = [];
  nuevos: SalonCard[] = [];

  constructor(
    private catalogoService: CatalogoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.obtenerSesion();
    this.cargarCatalogo();
  }

  verDetalle(card: SalonCard): void {
    this.router.navigate(['/catalogo/detalle', card.id]);
  }

  cargarCatalogo(): void {
    this.cargandoCatalogo = true;
    this.errorCatalogo = '';

    this.catalogoService.listarPeluquerias().subscribe({
      next: (data) => {
        this.catalogoCompleto = data || [];
        this.recomendados = [...this.catalogoCompleto];
        this.nuevos = [...this.catalogoCompleto];
        this.busquedaRealizada = false;
        this.sinResultados = this.catalogoCompleto.length === 0;
        this.cargandoCatalogo = false;
      },
      error: (error) => {
        console.error('Error al cargar el catálogo:', error);
        this.catalogoCompleto = [];
        this.recomendados = [];
        this.nuevos = [];
        this.sinResultados = true;
        this.cargandoCatalogo = false;
        this.errorCatalogo = 'No se pudo cargar el catálogo desde MySQL.';
      }
    });
  }

  buscarCatalogo(): void {
    let resultado = [...this.catalogoCompleto];

    if (this.ubicacionSeleccionada.trim()) {
      resultado = resultado.filter(card =>
        this.normalizarTexto(card.distrito || card.direccion).includes(
          this.normalizarTexto(this.ubicacionSeleccionada)
        )
      );
    }

    if (this.servicioSeleccionado.trim()) {
      resultado = resultado.filter(card =>
        card.servicios.some(servicio =>
          this.normalizarTexto(servicio).includes(
            this.normalizarTexto(this.servicioSeleccionado)
          )
        )
      );
    }

    this.recomendados = resultado;
    this.nuevos = resultado;
    this.busquedaRealizada = true;
    this.sinResultados = resultado.length === 0;
  }

  normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  limpiarFiltros(): void {
    this.ubicacionSeleccionada = '';
    this.servicioSeleccionado = '';
    this.fechaSeleccionada = '';
    this.recomendados = [...this.catalogoCompleto];
    this.nuevos = [...this.catalogoCompleto];
    this.busquedaRealizada = false;
    this.sinResultados = this.catalogoCompleto.length === 0;
  }

  toggleMenuPerfil(): void {
    this.menuPerfilAbierto = !this.menuPerfilAbierto;
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.usuarioActual = null;
    this.menuPerfilAbierto = false;
    this.router.navigate(['/']);
  }

  esNegocio(): boolean {
    return this.usuarioActual?.rol?.toUpperCase() === 'NEGOCIO';
  }

  inicialUsuario(): string {
    return this.usuarioActual?.nombre?.charAt(0).toUpperCase() || 'U';
  }

  nombreCompleto(): string {
    if (!this.usuarioActual) return '';
    return `${this.usuarioActual.nombre} ${this.usuarioActual.apellido || ''}`.trim();
  }

  slide(contenedor: HTMLElement): void {
    contenedor.scrollBy({ left: 230, behavior: 'smooth' });
  }
}
