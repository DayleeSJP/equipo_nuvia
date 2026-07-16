package com.utp.nuvia.repository;

import com.utp.nuvia.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Integer> {
    Optional<Plan> findByNombreIgnoreCase(String nombre);
}
