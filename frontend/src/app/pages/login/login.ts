import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  password = '';
  error = '';
  mensaje = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    this.error = '';
    this.mensaje = '';

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        this.authService.guardarSesion(response);
        this.mensaje = `Bienvenida, ${response.nombre}`;

        setTimeout(() => {
          if (response.rol?.toUpperCase() === 'NEGOCIO') {
            this.router.navigate(['/negocio/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        }, 400);
      },
      error: (error) => {
        this.error = error.error?.mensaje || 'Correo o contraseña incorrectos';
      }
    });
  }
}
