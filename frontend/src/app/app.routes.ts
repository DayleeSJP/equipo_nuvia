import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { SeleccionUsuario } from './pages/seleccion-usuario/seleccion-usuario';
import { RegistroCliente } from './pages/registro-cliente/registro-cliente';
import { RegistroNegocio } from './pages/registro-negocio/registro-negocio';
import { NegocioLayout } from './pages/negocio/negocio-layout/negocio-layout';
import { DashboardNegocio } from './pages/negocio/dashboard-negocio/dashboard-negocio';
import { CalendarioNegocio } from './pages/negocio/calendario-negocio/calendario-negocio'
import { PersonalizacionNegocio } from './pages/negocio/personalizacion-negocio/personalizacion-negocio';
import { DetalleNegocio } from './pages/cliente/detalle-negocio/detalle-negocio';
import { ReservaCita } from './pages/cliente/reserva-cita/reserva-cita';
import { HistorialReservas } from './pages/cliente/historial-reservas/historial-reservas';
import { PlanesNegocio } from './pages/negocio/planes-negocio/planes-negocio';



export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'seleccion-usuario',
        component: SeleccionUsuario
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'registro-cliente',
        component: RegistroCliente
    },
    {
        path: 'registro-negocio',
        component: RegistroNegocio
    },

    {
        path: 'catalogo/detalle/:id',
        component: DetalleNegocio
    },
    {
        path: 'cliente/reserva/:id',
        component: ReservaCita
    },
    {
        path: 'cliente/mis-reservas',
        component: HistorialReservas
    },




    {
        path: 'negocio',
        component: NegocioLayout,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                component: DashboardNegocio
            },
            {
                path: 'calendario',
                component: CalendarioNegocio
            },
            {
                path: 'personalizacion',
                component: PersonalizacionNegocio
            },
            {
                path: 'planes',
                component: PlanesNegocio
            }
        ]
    }

];
