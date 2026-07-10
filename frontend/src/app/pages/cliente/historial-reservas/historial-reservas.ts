import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CitaResponse, CitaService } from '../../../services/cita';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-historial-reservas',
  imports: [CommonModule, RouterLink],
  templateUrl: './historial-reservas.html',
  styleUrl: './historial-reservas.css'
})
export class HistorialReservas implements OnInit {

  citas: CitaResponse[] = [];
  nombreCliente = 'Cliente';
  clienteId: number | null = null;
  error = '';
  cargando = true;

  constructor(
    private citaService: CitaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.obtenerSesion();

    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }

    if (usuario.rol?.toUpperCase() !== 'CLIENTE') {
      this.router.navigate(['/negocio/dashboard']);
      return;
    }

    this.clienteId = usuario.id;
    this.nombreCliente = usuario.nombre || 'Cliente';
    this.cargarCitas();
  }

  cargarCitas(): void {
    if (!this.clienteId) return;

    this.citaService.listarPorCliente(this.clienteId).subscribe({
      next: (citas) => {
        this.citas = citas;
        this.cargando = false;
      },
      error: (error) => {
        this.error = error.error?.mensaje || 'No se pudo cargar el historial.';
        this.cargando = false;
      }
    });
  }

  cancelarCita(citaId: number): void {
    if (!this.clienteId) return;

    this.citaService.cancelarCita(citaId, this.clienteId).subscribe({
      next: (citaActualizada) => {
        this.citas = this.citas.map(cita =>
          cita.id === citaActualizada.id ? citaActualizada : cita
        );
      },
      error: (error) => {
        this.error = error.error?.mensaje || 'No se pudo cancelar la cita.';
      }
    });
  }
}
