package com.utp.nuvia.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class RegistroCitaRequest {

    private Integer clienteId;
    private Integer peluqueriaId;
    private Integer servicioId;
    private Integer trabajadorId;

    private LocalDate fecha;
    private LocalTime hora;
}