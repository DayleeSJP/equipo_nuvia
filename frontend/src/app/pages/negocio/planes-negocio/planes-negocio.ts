import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { PlanActual, PlanService } from '../../../services/plan';

interface BeneficioPlan {
  icono: 'servicios' | 'reservas' | 'estadisticas' | 'destacado' | 'ilimitado' | 'soporte';
  nombre: string;
  incluidoEnStandard: boolean;
}

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

  modalPremiumAbierto = false;
  premiumActivado = false;

  readonly beneficios: BeneficioPlan[] = [
    {
      icono: 'servicios',
      nombre: 'Hasta 5 servicios',
      incluidoEnStandard: true
    },
    {
      icono: 'reservas',
      nombre: 'Recibir reservas',
      incluidoEnStandard: true
    },
    {
      icono: 'estadisticas',
      nombre: 'Estadísticas básicas',
      incluidoEnStandard: true
    },
    {
      icono: 'destacado',
      nombre: 'Perfil en Recomendado',
      incluidoEnStandard: false
    },
    {
      icono: 'ilimitado',
      nombre: 'Servicios ilimitados',
      incluidoEnStandard: false
    },
    {
      icono: 'soporte',
      nombre: 'Soporte prioritario',
      incluidoEnStandard: false
    }
  ];

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

  abrirModalPremium(): void {
    if (this.procesando || this.esPremium()) return;

    this.error = '';
    this.mensaje = '';
    this.premiumActivado = false;
    this.modalPremiumAbierto = true;
  }

  cerrarModalPremium(): void {
    if (this.procesando) return;

    this.modalPremiumAbierto = false;
    this.premiumActivado = false;
  }

  cerrarModalDesdeFondo(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cerrarModalPremium();
    }
  }

  confirmarPremium(): void {
    if (!this.usuarioId || this.procesando || this.esPremium()) return;

    this.procesando = true;
    this.error = '';
    this.mensaje = '';

    this.planService.activarPremium(this.usuarioId).subscribe({
      next: plan => {
        this.planActual = plan;
        this.procesando = false;
        this.premiumActivado = true;
        this.mensaje = plan.mensaje || 'Plan Premium activado correctamente.';

        window.setTimeout(() => {
          this.modalPremiumAbierto = false;
          this.premiumActivado = false;
        }, 1300);
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
      '¿Deseas volver al Plan Standard? Tus servicios existentes se conservarán, pero solo podrás agregar nuevos si tienes menos de 5.'
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

  beneficioActivo(beneficio: BeneficioPlan): boolean {
    return beneficio.incluidoEnStandard || this.esPremium();
  }

  textoPrecio(): string {
    return this.esPremium() ? 'S/ 49 al mes' : 'Sin costo mensual';
  }

  textoEstadoServicios(): string {
    if (!this.planActual) return '';

    if (this.esPremium() || this.planActual.limiteServicios === null) {
      return 'Servicios ilimitados · perfil destacado activo';
    }

    return `Servicios: ${this.planActual.serviciosUsados}/${this.planActual.limiteServicios} usados`;
  }

  fechaFinPremium(): string | null {
    return this.esPremium() ? this.planActual?.fechaFin || null : null;
  }
}
