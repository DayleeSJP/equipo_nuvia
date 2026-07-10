import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-registro-cliente',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro-cliente.html',
  styleUrl: './registro-cliente.css'
})
export class RegistroCliente {

  nombre = '';
  apellido = '';
  telefono = '';
  email = '';
  password = '';

  error = '';
  mensaje = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  registrar(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.nombre || !this.apellido || !this.telefono || !this.email || !this.password) {
      this.error = 'Completa todos los campos.';
      return;
    }

    this.authService.registrarCliente({
      nombre: this.nombre,
      apellido: this.apellido,
      telefono: this.telefono,
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        this.authService.guardarSesion(response);
        this.mensaje = response.mensaje;

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 800);
      },
      error: (error) => {
        this.error = error.error?.mensaje || 'No se pudo registrar el cliente.';
      }
    });
  }
}