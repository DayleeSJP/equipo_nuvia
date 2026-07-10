package com.utp.nuvia.controller;

import com.utp.nuvia.dto.UsuarioResumenResponse;
import com.utp.nuvia.service.UsuarioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/clientes")
    public List<UsuarioResumenResponse> listarClientes() {
        return usuarioService.listarClientes();
    }
}
