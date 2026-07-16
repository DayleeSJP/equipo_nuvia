package com.utp.nuvia.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class PlanActualResponse {
    private Integer peluqueriaId;
    private String plan;
    private String descripcion;
    private BigDecimal precioMensual;
    private Integer limiteServicios;
    private Integer serviciosUsados;
    private Boolean premium;
    private String estado;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private String mensaje;
}
