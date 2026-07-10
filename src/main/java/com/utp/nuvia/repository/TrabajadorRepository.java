package com.utp.nuvia.repository;

import com.utp.nuvia.model.Trabajador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrabajadorRepository extends JpaRepository<Trabajador, Integer> {

    List<Trabajador> findByPeluqueriaIdAndActivoTrueOrderByNombreAsc(Integer peluqueriaId);

    Optional<Trabajador> findByIdAndPeluqueriaId(Integer id, Integer peluqueriaId);
}
