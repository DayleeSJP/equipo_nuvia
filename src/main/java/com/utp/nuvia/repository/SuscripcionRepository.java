package com.utp.nuvia.repository;

import com.utp.nuvia.model.Suscripcion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SuscripcionRepository extends JpaRepository<Suscripcion, Integer> {
    Optional<Suscripcion> findByPeluqueriaId(Integer peluqueriaId);
}
