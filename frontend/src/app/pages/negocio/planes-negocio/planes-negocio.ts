import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { PlanActual, PlanService } from '../../../services/plan';

@Component({
  selector: 'app-planes-negocio',
  imports: [CommonModule],
  templateUrl: './planes-negocio.html',
  styleUrl: './planes-negocio.css'
})
export class PlanesNegocio implements OnInit {
  planActual: PlanActual | null = null;
  cargando = true;
  procesando = false;
  error = '';
  mensaje = '';
  usuarioId: number | null = null;

  constructor(
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
    this.cargarPlan();
  }

  cargarPlan(): void {
    if (!this.usuarioId) return;

    this.cargando = true;
    this.error = '';

    this.planService.obtenerPlan(this.usuarioId).subscribe({
      next: plan => {
        this.planActual = plan;
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.error = error.error?.mensaje || 'No se pudo cargar el plan del negocio.';
      }
    });
  }

  activarPremium(): void {
    if (!this.usuarioId || this.procesando || this.esPremium()) return;

    const confirmar = window.confirm(
      '¿Deseas activar el Plan Premium por S/ 49 durante un mes?'
    );
    if (!confirmar) return;

    this.procesando = true;
    this.error = '';
    this.mensaje = '';

    this.planService.activarPremium(this.usuarioId).subscribe({
      next: plan => {
        this.planActual = plan;
        this.procesando = false;
        this.mensaje = plan.mensaje || 'Plan Premium activado correctamente.';
      },
      error: error => {
        this.procesando = false;
        this.error = error.error?.mensaje || 'No se pudo activar Premium.';
      }
    });
  }

  usarStandard(): void {
    if (!this.usuarioId || this.procesando || !this.esPremium()) return;

    const confirmar = window.confirm(
      '¿Deseas volver al Plan Standard? Tus servicios existentes se conservarán, pero el límite para agregar nuevos será de 5.'
    );
    if (!confirmar) return;

    this.procesando = true;
    this.error = '';
    this.mensaje = '';

    this.planService.activarStandard(this.usuarioId).subscribe({
      next: plan => {
        this.planActual = plan;
        this.procesando = false;
        this.mensaje = plan.mensaje || 'Plan Standard activado.';
      },
      error: error => {
        this.procesando = false;
        this.error = error.error?.mensaje || 'No se pudo cambiar el plan.';
      }
    });
  }

  esPremium(): boolean {
    return this.planActual?.plan === 'PREMIUM';
  }

  usoServicios(): string {
    if (!this.planActual) return '';
    if (this.planActual.limiteServicios === null) {
      return `${this.planActual.serviciosUsados} servicios registrados · sin límite`;
    }
    return `${this.planActual.serviciosUsados} de ${this.planActual.limiteServicios} servicios utilizados`;
  }
}
