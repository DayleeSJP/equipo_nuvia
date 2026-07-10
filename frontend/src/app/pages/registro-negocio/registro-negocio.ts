import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginResponse } from '../../services/auth';

@Component({
  selector: 'app-registro-negocio',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro-negocio.html',
  styleUrl: './registro-negocio.css'
})
export class RegistroNegocio {

  paso = 1;
  estaLogueado = false;
  usuarioId: number | null = null;

  nombre = '';
  apellido = '';
  telefono = '';
  email = '';
  password = '';

  nombreNegocio = '';
  direccion = '';
  distrito = '';

  error = '';
  guardando = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    const usuario = this.authService.obtenerSesion();

    if (usuario) {
      this.estaLogueado = true;
      this.usuarioId = usuario.id;
      this.nombre = usuario.nombre || '';
      this.apellido = usuario.apellido || '';
      this.email = usuario.email || '';
      this.telefono = usuario.telefono || '';
    }
  }

  continuarCuenta(): void {
    this.error = '';

    if (!this.nombre || !this.apellido || !this.telefono) {
      this.error = 'Completa tu nombre, apellido y teléfono.';
      return;
    }

    if (!this.estaLogueado && (!this.email || !this.password)) {
      this.error = 'Completa tu correo y contraseña.';
      return;
    }

    this.paso = 2;
  }

  continuarNegocio(): void {
    this.error = '';

    if (!this.nombreNegocio.trim()) {
      this.error = 'Ingresa el nombre de tu negocio.';
      return;
    }

    this.paso = 3;
  }

  finalizarRegistro(): void {
    this.error = '';

    if (!this.direccion.trim() || !this.distrito.trim()) {
      this.error = 'Completa la dirección y distrito del establecimiento.';
      return;
    }

    if (!this.estaLogueado &&
        (!this.nombre || !this.apellido || !this.telefono || !this.email || !this.password)) {
      this.error = 'Completa tus datos personales.';
      return;
    }

    this.guardando = true;

    this.authService.registrarNegocio({
      usuarioId: this.usuarioId,
      nombre: this.nombre,
      apellido: this.apellido,
      telefono: this.telefono,
      email: this.email,
      password: this.password,
      nombreNegocio: this.nombreNegocio,
      direccion: this.direccion,
      distrito: this.distrito
    }).subscribe({
      next: (usuarioNegocio: LoginResponse) => {
        this.authService.guardarSesion(usuarioNegocio);
        this.guardando = false;
        this.router.navigate(['/negocio/dashboard']);
      },
      error: (error) => {
        this.guardando = false;
        this.error = error.error?.mensaje || 'No se pudo registrar el negocio.';
      }
    });
  }

  volver(): void {
    if (this.paso > 1) {
      this.paso--;
    }
  }
}
