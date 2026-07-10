import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CitaService } from '../../../services/cita';
import {
  CatalogoService,
  CategoriaDetalle,
  ServicioDetalle,
  TrabajadorDetalle
} from '../../../services/catalogo';
import { AuthService } from '../../../services/auth';

interface FechaReserva {
  dia: string;
  numero: string;
  mes: string;
  valor: string;
}

@Component({
  selector: 'app-reserva-cita',
  imports: [CommonModule],
  templateUrl: './reserva-cita.html',
  styleUrl: './reserva-cita.css'
})
export class ReservaCita implements OnInit {

  paso = 1;
  peluqueriaId: number | null = null;

  nombreNegocio = '';
  direccion = '';
  distrito = '';
  portada = '';

  categorias: CategoriaDetalle[] = [];
  servicios: ServicioDetalle[] = [];
  trabajadores: TrabajadorDetalle[] = [];

  servicioSeleccionado: ServicioDetalle | null = null;
  trabajadorSeleccionado: TrabajadorDetalle | null = null;
  sinPreferencia = false;

  fechaSeleccionada = '';
  fechaSeleccionadaTexto = '';
  horaSeleccionada = '';

  error = '';
  cargando = true;
  guardando = false;

  fechas: FechaReserva[] = [];
  horas = ['09:00', '10:00', '11:00', '11:30', '12:00', '13:00', '15:00', '16:30', '17:00'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private citaService: CitaService,
    private catalogoService: CatalogoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fechas = this.generarFechas();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'No se encontró la peluquería seleccionada.';
      this.cargando = false;
      return;
    }

    this.peluqueriaId = id;
    this.cargarDetallePeluqueria(id);
  }

  cargarDetallePeluqueria(id: number): void {
    this.catalogoService.obtenerDetalle(id).subscribe({
      next: (data) => {
        this.nombreNegocio = data.nombreNegocio;
        this.direccion = data.direccion;
        this.distrito = data.distrito;
        this.portada = data.portada || '';
        this.categorias = data.categorias || [];
        this.trabajadores = data.trabajadores || [];
        this.servicios = this.categorias.flatMap(categoria => categoria.servicios || []);

        const servicioId = Number(this.route.snapshot.queryParamMap.get('servicioId'));
        if (servicioId) {
          this.servicioSeleccionado = this.servicios.find(s => s.id === servicioId) || null;
        }

        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar la peluquería:', error);
        this.error = error.error?.mensaje || 'No se pudo cargar la peluquería.';
        this.cargando = false;
      }
    });
  }

  seleccionarServicio(servicio: ServicioDetalle): void {
    this.servicioSeleccionado = servicio;
  }

  seleccionarSinPreferencia(): void {
    this.sinPreferencia = true;
    this.trabajadorSeleccionado = null;
  }

  seleccionarTrabajador(trabajador: TrabajadorDetalle): void {
    this.trabajadorSeleccionado = trabajador;
    this.sinPreferencia = false;
  }

  seleccionarFecha(fecha: FechaReserva): void {
    this.fechaSeleccionada = fecha.valor;
    this.fechaSeleccionadaTexto = `${fecha.dia} ${fecha.numero} ${fecha.mes}`;
  }

  seleccionarHora(hora: string): void {
    this.horaSeleccionada = hora;
  }

  puedeContinuar(): boolean {
    if (this.paso === 1) return !!this.servicioSeleccionado;
    if (this.paso === 2) return this.sinPreferencia || !!this.trabajadorSeleccionado;
    if (this.paso === 3) return !!this.fechaSeleccionada && !!this.horaSeleccionada;
    return !this.guardando;
  }

  continuar(): void {
    this.error = '';

    if (!this.puedeContinuar()) return;

    if (this.paso < 4) {
      this.paso++;
      return;
    }

    this.confirmarCita();
  }

  volver(): void {
    if (this.paso > 1) {
      this.paso--;
      return;
    }

    if (this.peluqueriaId) {
      this.router.navigate(['/catalogo/detalle', this.peluqueriaId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  cerrar(): void {
    if (this.peluqueriaId) {
      this.router.navigate(['/catalogo/detalle', this.peluqueriaId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  nombreTrabajador(): string {
    if (this.sinPreferencia) return 'Sin preferencia';
    if (this.trabajadorSeleccionado) {
      return `${this.trabajadorSeleccionado.nombre} ${this.trabajadorSeleccionado.apellido}`;
    }
    return 'Pendiente';
  }

  confirmarCita(): void {
    this.error = '';

    const usuario = this.authService.obtenerSesion();
    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }

    if (usuario.rol?.toUpperCase() !== 'CLIENTE') {
      this.error = 'Para reservar debes ingresar con una cuenta de cliente.';
      return;
    }

    if (!this.peluqueriaId || !this.servicioSeleccionado?.id) {
      this.error = 'Faltan los datos de la peluquería o el servicio.';
      return;
    }

    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      this.error = 'Selecciona una fecha y una hora.';
      return;
    }

    this.guardando = true;

    this.citaService.registrarCita({
      clienteId: usuario.id,
      peluqueriaId: this.peluqueriaId,
      servicioId: this.servicioSeleccionado.id,
      trabajadorId: this.sinPreferencia
        ? null
        : this.trabajadorSeleccionado?.id || null,
      fecha: this.fechaSeleccionada,
      hora: this.horaSeleccionada
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/cliente/mis-reservas']);
      },
      error: (error) => {
        this.guardando = false;
        this.error = error.error?.mensaje || 'No se pudo registrar la cita.';
      }
    });
  }

  private generarFechas(): FechaReserva[] {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const resultado: FechaReserva[] = [];

    for (let i = 1; i <= 7; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i);
      const valor = [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(2, '0'),
        String(fecha.getDate()).padStart(2, '0')
      ].join('-');

      resultado.push({
        dia: dias[fecha.getDay()],
        numero: String(fecha.getDate()),
        mes: meses[fecha.getMonth()],
        valor
      });
    }

    return resultado;
  }
}
