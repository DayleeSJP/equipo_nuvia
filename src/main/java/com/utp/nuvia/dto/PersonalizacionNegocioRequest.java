package com.utp.nuvia.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class PersonalizacionNegocioRequest {

    private Integer usuarioId;
    private Integer peluqueriaId;
    private String portadaImagen;
    private String sobreNosotros;
    private List<CategoriaRequest> categorias;
    private List<TrabajadorRequest> trabajadores;

    @Getter
    @Setter
    public static class CategoriaRequest {
        private Integer id;
        private String nombre;
        private String descripcion;
        private String color;
        private List<ServicioRequest> servicios;
    }

    @Getter
    @Setter
    public static class ServicioRequest {
        private Integer id;
        private String nombre;
        private String descripcion;
        private String tipoTratamiento;
        private String tipoPrecio;
        private BigDecimal precio;
        private String duracion;
    }

    @Getter
    @Setter
    public static class TrabajadorRequest {
        private Integer id;
        private String nombre;
        private String apellido;
        private String especialidad;
    }
}
