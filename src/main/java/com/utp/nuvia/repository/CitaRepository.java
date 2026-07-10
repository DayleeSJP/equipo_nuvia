package com.utp.nuvia.repository;

import com.utp.nuvia.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface CitaRepository extends JpaRepository<Cita, Integer> {

    List<Cita> findByClienteIdOrderByFechaDescHoraDesc(Integer clienteId);

    List<Cita> findByPeluqueriaIdOrderByFechaAscHoraAsc(Integer peluqueriaId);

    Optional<Cita> findByIdAndClienteId(Integer citaId, Integer clienteId);

    Optional<Cita> findByIdAndPeluqueriaId(Integer citaId, Integer peluqueriaId);

    @Query("""
            select count(c)
            from Cita c
            where c.peluqueria.id = :peluqueriaId
              and c.trabajador.id = :trabajadorId
              and c.fecha = :fecha
              and c.hora = :hora
              and lower(c.estado) <> lower(:estadoExcluido)
            """)
    long contarConflictosTrabajador(
            @Param("peluqueriaId") Integer peluqueriaId,
            @Param("trabajadorId") Integer trabajadorId,
            @Param("fecha") LocalDate fecha,
            @Param("hora") LocalTime hora,
            @Param("estadoExcluido") String estadoExcluido
    );
}
