package com.utp.nuvia.repository;

import com.utp.nuvia.model.CategoriaServicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaServicioRepository extends JpaRepository<CategoriaServicio, Integer> {

    List<CategoriaServicio> findByPeluqueriaIdOrderByIdAsc(Integer peluqueriaId);

    Optional<CategoriaServicio> findByIdAndPeluqueriaId(Integer id, Integer peluqueriaId);

    Optional<CategoriaServicio> findByPeluqueriaIdAndNombreIgnoreCase(Integer peluqueriaId, String nombre);
}
