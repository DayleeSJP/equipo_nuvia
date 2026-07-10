package com.utp.nuvia.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@AllArgsConstructor
public class CitaResponse {

    private Integer id;
    private String codigoConfirmacion;

    private Integer clienteId;
    private String cliente;
    private String clienteEmail;

    private Integer peluqueriaId;
    private String negocio;
    private String direccion;

    private Integer servicioId;
    private String servicio;
    private Integer duracionMin;
    private BigDecimal precio;

    private Integer trabajadorId;
    private String trabajador;

    private LocalDate fecha;
    private LocalTime hora;
    private String estado;
    private LocalDateTime fechaRegistro;
}
