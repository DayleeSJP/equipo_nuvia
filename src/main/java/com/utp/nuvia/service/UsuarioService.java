package com.utp.nuvia.service;

import org.springframework.stereotype.Service;

import com.utp.nuvia.dto.UsuarioResumenResponse;
import com.utp.nuvia.model.Usuario;
import com.utp.nuvia.repository.UsuarioRepository;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public List<UsuarioResumenResponse> listarClientes() {
        return usuarioRepository
                .findByRolNombreIgnoreCaseOrderByNombreAscApellidoAsc("CLIENTE")
                .stream()
                .map(this::convertir)
                .toList();
    }

    private UsuarioResumenResponse convertir(Usuario usuario) {
        return new UsuarioResumenResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getTelefono()
        );
    }
}
