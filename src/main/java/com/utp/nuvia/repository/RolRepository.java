package com.utp.nuvia.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.utp.nuvia.model.Rol;

import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Integer> {

    Optional<Rol> findByNombre(String nombre);
}