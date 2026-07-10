package com.utp.nuvia.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistroClienteRequest {

    private String nombre;
    private String apellido;
    private String telefono;
    private String email;
    private String password;
}
