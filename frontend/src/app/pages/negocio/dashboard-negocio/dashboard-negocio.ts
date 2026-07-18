import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CitaResponse, CitaService } from '../../../services/cita';
import { AuthService } from '../../../services/auth';
import { NegocioService } from '../../../services/negocio';
import { PlanActual, PlanService } from '../../../services/plan';

interface ServicioRentable {
  servicio: string;
  reservas: number;
  ingresos: number;
  porcentaje: number;
}

interface CeldaDemanda {
  hora: number;
  cantidad: number;
  intensidad: number;
}

interface DiaDemanda {
  etiqueta: string;
  celdas: CeldaDemanda[];
}

interface EtiquetaGrafico {
  x: number;
  texto: string;
}

interface LineaGrafico {
  y: number;
  ingreso: number;
  reservas: number;
}

interface ResumenPeriodo {
  ingresos: number;
  reservas: number;
  ticket: number;
  clientes: number;
  retorno: number;
  cancelaciones: number;
}

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
  planActual: PlanActual | null = null;

  periodoDias = 30;
  readonly opcionesPeriodo = [
    { dias: 7, etiqueta: '7 días' },
    { dias: 30, etiqueta: '30 días' },
    { dias: 90, etiqueta: '3 meses' },
    { dias: 365, etiqueta: 'Este año' }
  ];

  ingresosPeriodo = 0;
  reservasPeriodo = 0;
  ticketPromedio = 0;
  clientesUnicos = 0;
  tasaRetorno = 0;
  cancelacionesPeriodo = 0;

  variacionIngresos = 0;
  variacionReservas = 0;
  variacionTicket = 0;
  variacionClientes = 0;
  variacionRetorno = 0;
  variacionCancelaciones = 0;

  serviciosRentables: ServicioRentable[] = [];
  diasDemanda: DiaDemanda[] = [];
  readonly horasDemanda = [8, 10, 12, 14, 16, 18, 20];

  clientesNuevos = 0;
  clientesRecurrentes = 0;
  porcentajeNuevos = 0;
  porcentajeRecurrentes = 0;
  visitasPromedio = 0;
  gastoPromedio = 0;
  donutClientes = 'conic-gradient(#D9D0FF 0 100%)';

  puntosIngresos = '';
  puntosReservas = '';
  etiquetasGrafico: EtiquetaGrafico[] = [];
  lineasGrafico: LineaGrafico[] = [];

  constructor(
    private citaService: CitaService,
    private authService: AuthService,
    private negocioService: NegocioService,
    private planService: PlanService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.obtenerSesion();

    if (!usuario || usuario.rol?.toUpperCase() !== 'NEGOCIO') {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarPlan(usuario.id);

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

  cargarPlan(usuarioId: number): void {
    this.planService.obtenerPlan(usuarioId).subscribe({
      next: (plan) => {
        this.planActual = plan;
        this.recalcularAnaliticas();
      },
      error: () => this.planActual = null
    });
  }

  cargarCitas(): void {
    if (!this.peluqueriaId) return;

    this.citaService.listarPorPeluqueria(this.peluqueriaId).subscribe({
      next: (citas) => {
        this.citas = citas;
        this.organizarCitas();
        this.recalcularAnaliticas();
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
        this.recalcularAnaliticas();
      },
      error: (error) => {
        this.error = error.error?.mensaje || 'No se pudo actualizar la cita.';
      }
    });
  }

  seleccionarPeriodo(dias: number): void {
    this.periodoDias = dias;
    this.recalcularAnaliticas();
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

  flecha(valor: number): string {
    if (valor > 0) return '↑';
    if (valor < 0) return '↓';
    return '—';
  }

  absoluto(valor: number): number {
    return Math.abs(valor);
  }

  exportarInforme(): void {
    const citas = this.obtenerCitasPeriodo(0);
    const encabezados = [
      'Código',
      'Fecha',
      'Hora',
      'Cliente',
      'Servicio',
      'Profesional',
      'Estado',
      'Precio'
    ];

    const filas = citas.map(cita => [
      cita.codigoConfirmacion,
      cita.fecha,
      cita.hora.slice(0, 5),
      cita.cliente,
      cita.servicio,
      cita.trabajador,
      cita.estado,
      Number(cita.precio || 0).toFixed(2)
    ]);

    const contenido = [encabezados, ...filas]
      .map(fila => fila.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const archivo = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const enlace = document.createElement('a');
    const url = URL.createObjectURL(archivo);
    const nombreSeguro = this.nombreNegocio.toLowerCase().replace(/[^a-z0-9]+/gi, '-');

    enlace.href = url;
    enlace.download = `reporte-${nombreSeguro}-${this.fechaLocal(new Date())}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
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

  private recalcularAnaliticas(): void {
    const actuales = this.obtenerCitasPeriodo(0);
    const anteriores = this.obtenerCitasPeriodo(1);
    const resumenActual = this.resumirPeriodo(actuales);
    const resumenAnterior = this.resumirPeriodo(anteriores);

    this.ingresosPeriodo = resumenActual.ingresos;
    this.reservasPeriodo = resumenActual.reservas;
    this.ticketPromedio = resumenActual.ticket;
    this.clientesUnicos = resumenActual.clientes;
    this.tasaRetorno = resumenActual.retorno;
    this.cancelacionesPeriodo = resumenActual.cancelaciones;

    this.variacionIngresos = this.variacionPorcentual(resumenActual.ingresos, resumenAnterior.ingresos);
    this.variacionReservas = this.variacionPorcentual(resumenActual.reservas, resumenAnterior.reservas);
    this.variacionTicket = this.variacionPorcentual(resumenActual.ticket, resumenAnterior.ticket);
    this.variacionClientes = this.variacionPorcentual(resumenActual.clientes, resumenAnterior.clientes);
    this.variacionRetorno = resumenActual.retorno - resumenAnterior.retorno;
    this.variacionCancelaciones = resumenActual.cancelaciones - resumenAnterior.cancelaciones;

    this.construirServiciosRentables(actuales);
    this.construirDemanda(actuales);
    this.construirClientes(actuales);
    this.construirGrafico(actuales);
  }

  private obtenerCitasPeriodo(desfase: number): CitaResponse[] {
    const hoy = this.inicioDia(new Date());
    const finActual = new Date(hoy);
    finActual.setDate(finActual.getDate() - (desfase * this.periodoDias));

    const inicioActual = new Date(finActual);
    inicioActual.setDate(inicioActual.getDate() - this.periodoDias + 1);

    return this.citas.filter(cita => {
      const fecha = this.inicioDia(new Date(`${cita.fecha}T00:00:00`));
      return fecha >= inicioActual && fecha <= finActual;
    });
  }

  private resumirPeriodo(citas: CitaResponse[]): ResumenPeriodo {
    const validas = citas.filter(cita => cita.estado !== 'Cancelada');
    const ingresos = validas.reduce((total, cita) => total + Number(cita.precio || 0), 0);
    const reservas = validas.length;
    const conteoClientes = new Map<number, number>();

    validas.forEach(cita => {
      conteoClientes.set(cita.clienteId, (conteoClientes.get(cita.clienteId) || 0) + 1);
    });

    const clientes = conteoClientes.size;
    const recurrentes = Array.from(conteoClientes.values()).filter(cantidad => cantidad > 1).length;

    return {
      ingresos,
      reservas,
      ticket: reservas > 0 ? ingresos / reservas : 0,
      clientes,
      retorno: clientes > 0 ? (recurrentes / clientes) * 100 : 0,
      cancelaciones: citas.filter(cita => cita.estado === 'Cancelada').length
    };
  }

  private construirServiciosRentables(citas: CitaResponse[]): void {
    const acumulado = new Map<number, ServicioRentable>();

    citas
      .filter(cita => cita.estado !== 'Cancelada')
      .forEach(cita => {
        const actual = acumulado.get(cita.servicioId) || {
          servicio: cita.servicio,
          reservas: 0,
          ingresos: 0,
          porcentaje: 0
        };

        actual.reservas += 1;
        actual.ingresos += Number(cita.precio || 0);
        acumulado.set(cita.servicioId, actual);
      });

    const ordenados = Array.from(acumulado.values())
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 3);

    const mayorIngreso = Math.max(...ordenados.map(item => item.ingresos), 1);
    this.serviciosRentables = ordenados.map(item => ({
      ...item,
      porcentaje: (item.ingresos / mayorIngreso) * 100
    }));
  }

  private construirDemanda(citas: CitaResponse[]): void {
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const ordenDias = [1, 2, 3, 4, 5, 6, 0];
    const conteos = new Map<string, number>();

    citas
      .filter(cita => cita.estado !== 'Cancelada')
      .forEach(cita => {
        const fecha = new Date(`${cita.fecha}T00:00:00`);
        const hora = Number(cita.hora.slice(0, 2));
        const bloque = this.horasDemanda.reduce((mejor, actual) =>
          Math.abs(actual - hora) < Math.abs(mejor - hora) ? actual : mejor
        );
        const clave = `${fecha.getDay()}-${bloque}`;
        conteos.set(clave, (conteos.get(clave) || 0) + 1);
      });

    const maximo = Math.max(...Array.from(conteos.values()), 1);

    this.diasDemanda = ordenDias.map(dia => ({
      etiqueta: nombresDias[dia],
      celdas: this.horasDemanda.map(hora => {
        const cantidad = conteos.get(`${dia}-${hora}`) || 0;
        const intensidad = cantidad === 0 ? 0 : Math.max(1, Math.ceil((cantidad / maximo) * 4));
        return { hora, cantidad, intensidad };
      })
    }));
  }

  private construirClientes(citas: CitaResponse[]): void {
    const validas = citas.filter(cita => cita.estado !== 'Cancelada');
    const clientes = new Map<number, { reservas: number; gasto: number }>();

    validas.forEach(cita => {
      const actual = clientes.get(cita.clienteId) || { reservas: 0, gasto: 0 };
      actual.reservas += 1;
      actual.gasto += Number(cita.precio || 0);
      clientes.set(cita.clienteId, actual);
    });

    const valores = Array.from(clientes.values());
    this.clientesNuevos = valores.filter(cliente => cliente.reservas === 1).length;
    this.clientesRecurrentes = valores.filter(cliente => cliente.reservas > 1).length;

    const totalClientes = valores.length;
    this.porcentajeNuevos = totalClientes > 0 ? (this.clientesNuevos / totalClientes) * 100 : 0;
    this.porcentajeRecurrentes = totalClientes > 0 ? (this.clientesRecurrentes / totalClientes) * 100 : 0;
    this.visitasPromedio = totalClientes > 0 ? validas.length / totalClientes : 0;
    this.gastoPromedio = totalClientes > 0
      ? validas.reduce((total, cita) => total + Number(cita.precio || 0), 0) / totalClientes
      : 0;

    this.donutClientes = totalClientes > 0
      ? `conic-gradient(#7357F4 0 ${this.porcentajeRecurrentes}%, #D9D0FF ${this.porcentajeRecurrentes}% 100%)`
      : 'conic-gradient(#E9EAF0 0 100%)';
  }

  private construirGrafico(citas: CitaResponse[]): void {
    const { inicio, fin } = this.obtenerRangoPeriodo(0);
    const fechas: Date[] = [];
    const cursor = new Date(inicio);

    while (cursor <= fin) {
      fechas.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const ingresosPorFecha = new Map<string, number>();
    const reservasPorFecha = new Map<string, number>();

    citas
      .filter(cita => cita.estado !== 'Cancelada')
      .forEach(cita => {
        ingresosPorFecha.set(
          cita.fecha,
          (ingresosPorFecha.get(cita.fecha) || 0) + Number(cita.precio || 0)
        );
        reservasPorFecha.set(cita.fecha, (reservasPorFecha.get(cita.fecha) || 0) + 1);
      });

    const ingresos = fechas.map(fecha => ingresosPorFecha.get(this.fechaLocal(fecha)) || 0);
    const reservas = fechas.map(fecha => reservasPorFecha.get(this.fechaLocal(fecha)) || 0);
    const maxIngresos = Math.max(...ingresos, 1);
    const maxReservas = Math.max(...reservas, 1);

    const xInicio = 54;
    const xFin = 704;
    const yInicio = 22;
    const yFin = 176;
    const ancho = xFin - xInicio;
    const alto = yFin - yInicio;
    const divisor = Math.max(fechas.length - 1, 1);

    this.puntosIngresos = ingresos.map((valor, indice) => {
      const x = xInicio + (indice / divisor) * ancho;
      const y = yFin - (valor / maxIngresos) * alto;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    this.puntosReservas = reservas.map((valor, indice) => {
      const x = xInicio + (indice / divisor) * ancho;
      const y = yFin - (valor / maxReservas) * alto;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const indices = Array.from(new Set([
      0,
      Math.round(divisor * 0.25),
      Math.round(divisor * 0.5),
      Math.round(divisor * 0.75),
      divisor
    ]));

    this.etiquetasGrafico = indices.map(indice => ({
      x: xInicio + (indice / divisor) * ancho,
      texto: fechas[indice].toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    }));

    this.lineasGrafico = [0, 1, 2, 3].map(indice => {
      const proporcion = 1 - (indice / 3);
      return {
        y: yInicio + (indice / 3) * alto,
        ingreso: maxIngresos * proporcion,
        reservas: Math.round(maxReservas * proporcion)
      };
    });
  }

  private obtenerRangoPeriodo(desfase: number): { inicio: Date; fin: Date } {
    const hoy = this.inicioDia(new Date());
    const fin = new Date(hoy);
    fin.setDate(fin.getDate() - (desfase * this.periodoDias));

    const inicio = new Date(fin);
    inicio.setDate(inicio.getDate() - this.periodoDias + 1);

    return { inicio, fin };
  }

  private variacionPorcentual(actual: number, anterior: number): number {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
  }

  private inicioDia(fecha: Date): Date {
    const copia = new Date(fecha);
    copia.setHours(0, 0, 0, 0);
    return copia;
  }

  private fechaLocal(fecha: Date): string {
    return [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0')
    ].join('-');
  }
}
