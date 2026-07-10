package com.utp.nuvia.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.utp.nuvia.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    List<Usuario> findByRolNombreIgnoreCaseOrderByNombreAscApellidoAsc(String rolNombre);
}
