package com.utp.nuvia.controller;

import com.utp.nuvia.service.NegocioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/catalogo")
public class CatalogoController {

    private final NegocioService negocioService;

    public CatalogoController(NegocioService negocioService) {
        this.negocioService = negocioService;
    }

    @GetMapping("/peluquerias")
    public ResponseEntity<?> listarPeluquerias() {
        return ResponseEntity.ok(negocioService.listarCatalogo());
    }

    @GetMapping("/peluquerias/{id}")
    public ResponseEntity<?> obtenerDetalle(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(negocioService.obtenerDetalle(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }
}