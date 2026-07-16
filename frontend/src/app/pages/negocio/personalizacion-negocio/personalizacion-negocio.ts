import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NegocioService } from '../../../services/negocio';
import { AuthService } from '../../../services/auth';
import { DetallePeluqueria } from '../../../services/catalogo';
import { PlanActual, PlanService } from '../../../services/plan';

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  tipoTratamiento: string;
  tipoPrecio: string;
  precio: number;
  duracion: string;
}

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  color: string;
  servicios: Servicio[];
}

interface Trabajador {
  id?: number;
  nombre: string;
  apellido: string;
  especialidad?: string;
}

@Component({
  selector: 'app-personalizacion-negocio',
  imports: [CommonModule, FormsModule],
  templateUrl: './personalizacion-negocio.html',
  styleUrl: './personalizacion-negocio.css'
})
export class PersonalizacionNegocio implements OnInit {

  usuarioId: number | null = null;
  peluqueriaId: number | null = null;
  nombreNegocio = '';

  portadaPreview = '';
  busqueda = '';

  mostrarModalCategoria = false;
  mostrarModalServicio = false;
  categoriaSeleccionada: number | 'todas' = 'todas';

  categorias: Categoria[] = [];
  trabajadores: Trabajador[] = [];
  sobreNosotros = '';

  cargando = true;
  guardando = false;
  error = '';
  planActual: PlanActual | null = null;

  nuevaCategoria = {
    nombre: '',
    descripcion: '',
    color: '#B9DDED'
  };

  nuevoServicio: Servicio = this.servicioVacio();

  nombreTrabajador = '';
  apellidoTrabajador = '';

  coloresCategoria = [
    { nombre: 'Azul claro', valor: '#B9DDED' },
    { nombre: 'Lila', valor: '#D8C5FF' },
    { nombre: 'Dorado', valor: '#C09C75' },
    { nombre: 'Rosa suave', valor: '#F8C8DC' },
    { nombre: 'Verde claro', valor: '#CDECCF' }
  ];

  constructor(
    private negocioService: NegocioService,
    private authService: AuthService,
    private planService: PlanService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.obtenerSesion();

    if (!usuario || usuario.rol?.toUpperCase() !== 'NEGOCIO') {
      this.router.navigate(['/login']);
      return;
    }

    this.usuarioId = usuario.id;
    this.peluqueriaId = usuario.peluqueriaId;
    this.cargarPlan();
    this.cargarPersonalizacion();
  }

  cargarPersonalizacion(): void {
    if (!this.usuarioId) return;

    this.negocioService.obtenerPorUsuario(this.usuarioId).subscribe({
      next: (data) => {
        this.aplicarDetalle(data);
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.error = error.error?.mensaje || 'No se pudo cargar la información del negocio.';
      }
    });
  }

  cargarPlan(): void {
    if (!this.usuarioId) return;

    this.planService.obtenerPlan(this.usuarioId).subscribe({
      next: plan => this.planActual = plan,
      error: () => this.planActual = null
    });
  }

  limiteServiciosAlcanzado(): boolean {
    if (!this.planActual || this.planActual.premium || this.planActual.limiteServicios === null) {
      return false;
    }
    return this.totalServicios() >= this.planActual.limiteServicios;
  }

  textoUsoPlan(): string {
    if (!this.planActual) return '';
    if (this.planActual.premium) {
      return `Premium · ${this.totalServicios()} servicios · sin límite`;
    }
    return `Standard · ${this.totalServicios()} de ${this.planActual.limiteServicios || 5} servicios`;
  }

  irAPlanes(): void {
    this.router.navigate(['/negocio/planes']);
  }

  seleccionarPortada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) return;

    if (archivo.size > 4 * 1024 * 1024) {
      alert('La imagen debe pesar menos de 4 MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.portadaPreview = reader.result as string;
    };
    reader.readAsDataURL(archivo);
  }

  totalServicios(): number {
    return this.categorias.reduce((total, categoria) => total + categoria.servicios.length, 0);
  }

  categoriasParaMostrar(): Categoria[] {
    if (this.categoriaSeleccionada === 'todas') return this.categorias;
    return this.categorias.filter(categoria => categoria.id === Number(this.categoriaSeleccionada));
  }

  serviciosFiltrados(categoria: Categoria): Servicio[] {
    if (!this.busqueda.trim()) return categoria.servicios;

    const texto = this.busqueda.toLowerCase();
    return categoria.servicios.filter(servicio =>
      servicio.nombre.toLowerCase().includes(texto)
    );
  }

  abrirModalCategoria(): void {
    this.mostrarModalCategoria = true;
  }

  cerrarModalCategoria(): void {
    this.mostrarModalCategoria = false;
  }

  agregarCategoria(): void {
    if (!this.nuevaCategoria.nombre.trim()) return;

    const nuevaId = this.nuevoIdLocal();
    this.categorias.push({
      id: nuevaId,
      nombre: this.nuevaCategoria.nombre.trim(),
      descripcion: this.nuevaCategoria.descripcion.trim(),
      color: this.nuevaCategoria.color,
      servicios: []
    });

    this.categoriaSeleccionada = nuevaId;
    this.nuevaCategoria = {
      nombre: '',
      descripcion: '',
      color: '#B9DDED'
    };
    this.mostrarModalCategoria = false;
  }

  abrirModalServicio(): void {
    if (this.limiteServiciosAlcanzado()) {
      const irAPlanes = window.confirm(
        'Has alcanzado el límite de 5 servicios del Plan Standard. ¿Deseas ver el Plan Premium?'
      );
      if (irAPlanes) {
        this.router.navigate(['/negocio/planes']);
      }
      return;
    }

    this.nuevoServicio = this.servicioVacio();
    this.nuevoServicio.categoriaId =
      this.categoriaSeleccionada !== 'todas'
        ? Number(this.categoriaSeleccionada)
        : this.categorias[0]?.id || 0;

    if (this.categorias.length === 0) {
      alert('Primero agrega una categoría.');
      return;
    }

    this.mostrarModalServicio = true;
  }

  cerrarModalServicio(): void {
    this.mostrarModalServicio = false;
  }

  agregarServicio(): void {
    if (!this.nuevoServicio.nombre.trim()) return;
    if (Number(this.nuevoServicio.precio) <= 0) return;

    const categoria = this.categorias.find(
      c => c.id === Number(this.nuevoServicio.categoriaId)
    );
    if (!categoria) return;

    categoria.servicios.push({
      ...this.nuevoServicio,
      id: this.nuevoIdLocal(),
      categoriaId: categoria.id,
      precio: Number(this.nuevoServicio.precio)
    });

    this.nuevoServicio = this.servicioVacio(categoria.id);
    this.mostrarModalServicio = false;
  }

  agregarTrabajador(): void {
    if (!this.nombreTrabajador.trim() || !this.apellidoTrabajador.trim()) return;

    this.trabajadores.push({
      id: this.nuevoIdLocal(),
      nombre: this.nombreTrabajador.trim(),
      apellido: this.apellidoTrabajador.trim()
    });

    this.nombreTrabajador = '';
    this.apellidoTrabajador = '';
  }

  guardarCambios(): void {
    if (!this.usuarioId || !this.peluqueriaId) {
      alert('No se pudo identificar el negocio.');
      return;
    }

    this.guardando = true;
    this.error = '';

    this.negocioService.guardarPersonalizacion({
      usuarioId: this.usuarioId,
      peluqueriaId: this.peluqueriaId,
      portadaImagen: this.portadaPreview,
      sobreNosotros: this.sobreNosotros,
      categorias: this.categorias.map(categoria => ({
        id: categoria.id > 0 ? categoria.id : null,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        color: categoria.color,
        servicios: categoria.servicios.map(servicio => ({
          id: servicio.id > 0 ? servicio.id : null,
          nombre: servicio.nombre,
          descripcion: servicio.descripcion,
          tipoTratamiento: servicio.tipoTratamiento,
          tipoPrecio: servicio.tipoPrecio,
          precio: Number(servicio.precio),
          duracion: servicio.duracion
        }))
      })),
      trabajadores: this.trabajadores.map(trabajador => ({
        id: trabajador.id && trabajador.id > 0 ? trabajador.id : null,
        nombre: trabajador.nombre,
        apellido: trabajador.apellido,
        especialidad: trabajador.especialidad || ''
      }))
    }).subscribe({
      next: (data) => {
        this.aplicarDetalle(data);
        this.guardando = false;
        alert('Personalización guardada correctamente en MySQL.');
      },
      error: (error) => {
        this.guardando = false;
        this.error = error.error?.mensaje || 'No se pudo guardar la personalización.';
        alert(this.error);
      }
    });
  }

  private aplicarDetalle(data: DetallePeluqueria): void {
    this.peluqueriaId = data.id;
    this.nombreNegocio = data.nombreNegocio;
    this.portadaPreview = data.portada || '';
    this.sobreNosotros = data.sobreNosotros || '';
    this.categorias = (data.categorias || []).map(categoria => ({
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      color: categoria.color || '#B9DDED',
      servicios: (categoria.servicios || []).map(servicio => ({
        id: servicio.id,
        nombre: servicio.nombre,
        descripcion: servicio.descripcion || '',
        categoriaId: categoria.id,
        tipoTratamiento: '',
        tipoPrecio: 'Fijo',
        precio: Number(servicio.precio),
        duracion: servicio.duracion
      }))
    }));
    this.trabajadores = (data.trabajadores || []).map(trabajador => ({
      id: trabajador.id,
      nombre: trabajador.nombre,
      apellido: trabajador.apellido,
      especialidad: trabajador.especialidad || ''
    }));
    this.categoriaSeleccionada = 'todas';
  }

  private servicioVacio(categoriaId = 0): Servicio {
    return {
      id: 0,
      nombre: '',
      descripcion: '',
      categoriaId,
      tipoTratamiento: '',
      tipoPrecio: 'Fijo',
      precio: 0,
      duracion: '45 min'
    };
  }

  private nuevoIdLocal(): number {
    return -Math.floor(Math.random() * 1_000_000) - 1;
  }
}
