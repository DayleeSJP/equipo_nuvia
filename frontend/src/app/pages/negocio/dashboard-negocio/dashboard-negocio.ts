import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CitaResponse, CitaService } from '../../../services/cita';
import { AuthService } from '../../../services/auth';
import { NegocioService } from '../../../services/negocio';

@Component({
  selector: 'app-dashboard-negocio',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-negocio.html',
  styleUrl: './dashboard-negocio.css'
})
export class DashboardNegocio implements OnInit {

  nombreNegocio = 'Mi negocio';
  peluqueriaId: number | null = null;
  citas: CitaResponse[] = [];
  citasHoy: CitaResponse[] = [];
  proximasCitas: CitaResponse[] = [];
  cargando = true;
  error = '';

  constructor(
    private citaService: CitaService,
    private authService: AuthService,
    private negocioService: NegocioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.obtenerSesion();

    if (!usuario || usuario.rol?.toUpperCase() !== 'NEGOCIO') {
      this.router.navigate(['/login']);
      return;
    }

    if (usuario.peluqueriaId) {
      this.peluqueriaId = usuario.peluqueriaId;
      this.cargarCitas();
      this.cargarNombre(usuario.id);
      return;
    }

    this.negocioService.obtenerPorUsuario(usuario.id).subscribe({
      next: (negocio) => {
        this.peluqueriaId = negocio.id;
        this.nombreNegocio = negocio.nombreNegocio;
        usuario.peluqueriaId = negocio.id;
        this.authService.guardarSesion(usuario);
        this.cargarCitas();
      },
      error: (error) => {
        this.cargando = false;
        this.error = error.error?.mensaje || 'No se encontró el negocio registrado.';
      }
    });
  }

  cargarCitas(): void {
    if (!this.peluqueriaId) return;

    this.citaService.listarPorPeluqueria(this.peluqueriaId).subscribe({
      next: (citas) => {
        this.citas = citas;
        this.organizarCitas();
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.error = error.error?.mensaje || 'No se pudieron cargar las reservas.';
      }
    });
  }

  cambiarEstado(cita: CitaResponse, estado: string): void {
    if (!this.peluqueriaId) return;

    this.citaService.actualizarEstado(cita.id, this.peluqueriaId, estado).subscribe({
      next: (actualizada) => {
        this.citas = this.citas.map(item => item.id === actualizada.id ? actualizada : item);
        this.organizarCitas();
      },
      error: (error) => {
        this.error = error.error?.mensaje || 'No se pudo actualizar la cita.';
      }
    });
  }

  pendientes(): number {
    return this.citas.filter(c =>
      !['Cancelada', 'Completada'].includes(c.estado)
    ).length;
  }

  completadas(): number {
    return this.citas.filter(c => c.estado === 'Completada').length;
  }

  ingresos(): number {
    return this.citas
      .filter(c => c.estado !== 'Cancelada')
      .reduce((total, cita) => total + Number(cita.precio || 0), 0);
  }

  private cargarNombre(usuarioId: number): void {
    this.negocioService.obtenerPorUsuario(usuarioId).subscribe({
      next: negocio => this.nombreNegocio = negocio.nombreNegocio,
      error: () => undefined
    });
  }

  private organizarCitas(): void {
    const hoy = this.fechaLocal(new Date());
    const ahora = new Date();

    this.citasHoy = this.citas
      .filter(cita => cita.fecha === hoy)
      .sort((a, b) => a.hora.localeCompare(b.hora));

    this.proximasCitas = this.citas
      .filter(cita => {
        if (cita.estado === 'Cancelada' || cita.estado === 'Completada') return false;
        const fechaHora = new Date(`${cita.fecha}T${cita.hora}`);
        return fechaHora >= ahora;
      })
      .sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`))
      .slice(0, 8);
  }

  private fechaLocal(fecha: Date): string {
    return [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0')
    ].join('-');
  }
}
