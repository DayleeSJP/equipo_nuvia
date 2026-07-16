package com.utp.nuvia.controller;

import com.utp.nuvia.service.PlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/planes")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> obtenerPlan(@PathVariable Integer usuarioId) {
        try {
            return ResponseEntity.ok(planService.obtenerPlanPorUsuario(usuarioId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping("/usuario/{usuarioId}/premium")
    public ResponseEntity<?> activarPremium(@PathVariable Integer usuarioId) {
        try {
            return ResponseEntity.ok(planService.activarPremium(usuarioId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping("/usuario/{usuarioId}/standard")
    public ResponseEntity<?> activarStandard(@PathVariable Integer usuarioId) {
        try {
            return ResponseEntity.ok(planService.activarStandard(usuarioId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }
}
