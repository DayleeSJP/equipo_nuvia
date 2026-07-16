package com.utp.nuvia.repository;

import com.utp.nuvia.model.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServicioRepository extends JpaRepository<Servicio, Integer> {

    List<Servicio> findByPeluqueriaIdOrderByIdAsc(Integer peluqueriaId);

    Optional<Servicio> findByIdAndPeluqueriaId(Integer id, Integer peluqueriaId);

    long countByPeluqueriaId(Integer peluqueriaId);
}
