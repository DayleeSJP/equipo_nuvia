import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CitaResponse, CitaService } from '../../../services/cita';
import { AuthService } from '../../../services/auth';
import { NegocioService } from '../../../services/negocio';
import { ServicioDetalle, TrabajadorDetalle } from '../../../services/catalogo';
import { ClienteResumen, UsuarioService } from '../../../services/usuario';

interface ReservaCalendario {
  id: number;
  dia: number;
  fecha: string;
  inicio: string;
  fin: string;
  cliente: string;
  servicio: string;
  trabajador: string;
  estado: string;
  cita: CitaResponse;
}

interface NuevaReservaManual {
  clienteId: number | null;
  servicioId: number | null;
  trabajadorId: number | null;
  fecha: string;
  inicio: string;
}

@Component({
  selector: 'app-calendario-negocio',
  imports: [CommonModule, FormsModule],
  templateUrl: './calendario-negocio.html',
  styleUrl: './calendario-negocio.css'
})
export class CalendarioNegocio implements OnInit {

  peluqueriaId: number | null = null;
  reservaSeleccionada: ReservaCalendario | null = null;
  detalleX = 0;
  detalleY = 0;

  dias: string[] = [];
  fechasSemana: string[] = [];
  tituloSemana = '';
  inicioSemana = this.obtenerInicioSemana(new Date());

  horas = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  reservas: ReservaCalendario[] = [];
  todasLasCitas: CitaResponse[] = [];

  servicios: ServicioDetalle[] = [];
  trabajadores: TrabajadorDetalle[] = [];
  clientes: ClienteResumen[] = [];

  mostrarModal = false;
  nuevaReserva: NuevaReservaManual = this.reservaManualVacia();

  horaBase = 9;
  altoHora = 48;
  cargando = true;
  guardando = false;
  error = '';

  constructor(
    private citaService: CitaService,
    private authService: AuthService,
    private negocioService: NegocioService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.obtenerSesion();
    if (!usuario || usuario.rol?.toUpperCase() !== 'NEGOCIO') {
      this.router.navigate(['/login']);
      return;
    }

    this.actualizarSemana();
    this.usuarioService.listarClientes().subscribe({
      next: clientes => this.clientes = clientes,
      error: () => this.clientes = []
    });

    this.negocioService.obtenerPorUsuario(usuario.id).subscribe({
      next: negocio => {
        this.peluqueriaId = negocio.id;
        this.servicios = negocio.categorias.flatMap(categoria => categoria.servicios || []);
        this.trabajadores = negocio.trabajadores || [];
        usuario.peluqueriaId = negocio.id;
        this.authService.guardarSesion(usuario);
        this.cargarReservas();
      },
      error: error => {
        this.cargando = false;
        this.error = error.error?.mensaje || 'No se pudo cargar el negocio.';
      }
    });
  }

  cargarReservas(): void {
    if (!this.peluqueriaId) return;

    this.citaService.listarPorPeluqueria(this.peluqueriaId).subscribe({
      next: citas => {
        this.todasLasCitas = citas;
        this.mapearReservasSemana();
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.error = error.error?.mensaje || 'No se pudieron cargar las reservas.';
      }
    });
  }

  abrirModal(): void {
    this.reservaSeleccionada = null;
    this.nuevaReserva = this.reservaManualVacia();
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  guardarReserva(): void {
    if (!this.peluqueriaId
        || !this.nuevaReserva.clienteId
        || !this.nuevaReserva.servicioId
        || !this.nuevaReserva.fecha
        || !this.nuevaReserva.inicio) {
      this.error = 'Selecciona cliente, servicio, fecha y hora.';
      return;
    }

    this.guardando = true;
    this.error = '';

    this.citaService.registrarCita({
      clienteId: Number(this.nuevaReserva.clienteId),
      peluqueriaId: this.peluqueriaId,
      servicioId: Number(this.nuevaReserva.servicioId),
      trabajadorId: this.nuevaReserva.trabajadorId
        ? Number(this.nuevaReserva.trabajadorId)
        : null,
      fecha: this.nuevaReserva.fecha,
      hora: this.nuevaReserva.inicio
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarModal = false;
        this.cargarReservas();
      },
      error: error => {
        this.guardando = false;
        this.error = error.error?.mensaje || 'No se pudo guardar la reserva.';
      }
    });
  }

  moverSemana(dias: number): void {
    const nueva = new Date(this.inicioSemana);
    nueva.setDate(nueva.getDate() + dias);
    this.inicioSemana = nueva;
    this.actualizarSemana();
    this.mapearReservasSemana();
  }

  irHoy(): void {
    this.inicioSemana = this.obtenerInicioSemana(new Date());
    this.actualizarSemana();
    this.mapearReservasSemana();
  }

  minutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  topReserva(reserva: ReservaCalendario): number {
    const inicio = this.minutos(reserva.inicio);
    const base = this.horaBase * 60;
    return Math.max(((inicio - base) / 60) * this.altoHora + 8, 0);
  }

  altoReserva(reserva: ReservaCalendario): number {
    const duracion = this.minutos(reserva.fin) - this.minutos(reserva.inicio);
    return Math.max((duracion / 60) * this.altoHora - 8, 42);
  }

  leftReserva(reserva: ReservaCalendario): string {
    return `calc(60px + ((100% - 60px) / 7) * ${reserva.dia} + 5px)`;
  }

  anchoReserva(): string {
    return 'calc((100% - 60px) / 7 - 10px)';
  }

  abrirDetalle(reserva: ReservaCalendario, event: MouseEvent): void {
    this.reservaSeleccionada = reserva;

    const anchoCuadro = 280;
    const altoCuadro = 220;
    let x = event.clientX + 12;
    let y = event.clientY + 12;

    if (x + anchoCuadro > window.innerWidth) x = event.clientX - anchoCuadro - 12;
    if (y + altoCuadro > window.innerHeight) y = event.clientY - altoCuadro - 12;

    this.detalleX = x;
    this.detalleY = y;
  }

  cerrarDetalle(): void {
    this.reservaSeleccionada = null;
  }

  cambiarEstado(reserva: ReservaCalendario, estado: string): void {
    if (!this.peluqueriaId) return;

    this.citaService.actualizarEstado(reserva.id, this.peluqueriaId, estado).subscribe({
      next: () => {
        this.reservaSeleccionada = null;
        this.cargarReservas();
      },
      error: error => this.error = error.error?.mensaje || 'No se pudo actualizar la reserva.'
    });
  }

  private mapearReservasSemana(): void {
    this.reservas = this.todasLasCitas
      .filter(cita => this.fechasSemana.includes(cita.fecha))
      .map(cita => ({
        id: cita.id,
        dia: this.fechasSemana.indexOf(cita.fecha),
        fecha: cita.fecha,
        inicio: cita.hora.slice(0, 5),
        fin: this.sumarMinutos(cita.hora, cita.duracionMin),
        cliente: cita.cliente,
        servicio: cita.servicio,
        trabajador: cita.trabajador,
        estado: cita.estado,
        cita
      }));
  }

  private actualizarSemana(): void {
    const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    this.dias = [];
    this.fechasSemana = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(this.inicioSemana);
      fecha.setDate(fecha.getDate() + i);
      this.dias.push(`${nombres[fecha.getDay()]} ${fecha.getDate()}`);
      this.fechasSemana.push(this.fechaLocal(fecha));
    }

    const fin = new Date(this.inicioSemana);
    fin.setDate(fin.getDate() + 6);
    this.tituloSemana = `${this.inicioSemana.getDate()} ${meses[this.inicioSemana.getMonth()]} – ${fin.getDate()} ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
  }

  private obtenerInicioSemana(fecha: Date): Date {
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    return inicio;
  }

  private reservaManualVacia(): NuevaReservaManual {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return {
      clienteId: null,
      servicioId: null,
      trabajadorId: null,
      fecha: this.fechaLocal(manana),
      inicio: '09:00'
    };
  }

  private sumarMinutos(hora: string, duracion: number): string {
    const total = this.minutos(hora) + duracion;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  private fechaLocal(fecha: Date): string {
    return [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0')
    ].join('-');
  }
}
