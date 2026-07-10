package com.utp.nuvia.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class DetallePeluqueriaResponse {

    private Integer id;
    private Integer usuarioId;
    private String nombreNegocio;
    private String direccion;
    private String distrito;
    private String portada;
    private String sobreNosotros;
    private String estado;
    private Boolean activa;

    private List<CategoriaDetalle> categorias;
    private List<TrabajadorDetalle> trabajadores;

    @Getter
    @Setter
    public static class CategoriaDetalle {
        private Integer id;
        private String nombre;
        private String descripcion;
        private String color;
        private List<ServicioDetalle> servicios;
    }

    @Getter
    @Setter
    public static class ServicioDetalle {
        private Integer id;
        private String nombre;
        private String descripcion;
        private Integer categoriaId;
        private BigDecimal precio;
        private String duracion;
    }

    @Getter
    @Setter
    public static class TrabajadorDetalle {
        private Integer id;
        private String nombre;
        private String apellido;
        private String especialidad;
    }
}
