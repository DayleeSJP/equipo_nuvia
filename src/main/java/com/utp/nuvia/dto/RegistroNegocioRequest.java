package com.utp.nuvia.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistroNegocioRequest {

    private Integer usuarioId;

    private String nombre;
    private String apellido;
    private String telefono;
    private String email;
    private String password;

    private String nombreNegocio;
    private String direccion;
    private String distrito;
}
