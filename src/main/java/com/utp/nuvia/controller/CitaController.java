package com.utp.nuvia.controller;

import com.utp.nuvia.dto.EstadoCitaRequest;
import com.utp.nuvia.dto.RegistroCitaRequest;
import com.utp.nuvia.service.CitaService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @PostMapping
    public ResponseEntity<?> registrarCita(@RequestBody RegistroCitaRequest request) {
        try {
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(citaService.registrarCita(request));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<?> listarPorCliente(@PathVariable Integer clienteId) {
        try {
            return ResponseEntity.ok(citaService.listarPorCliente(clienteId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }

    @GetMapping("/peluqueria/{peluqueriaId}")
    public ResponseEntity<?> listarPorPeluqueria(@PathVariable Integer peluqueriaId) {
        try {
            return ResponseEntity.ok(citaService.listarPorPeluqueria(peluqueriaId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PatchMapping("/{citaId}/cancelar")
    public ResponseEntity<?> cancelarCita(
            @PathVariable Integer citaId,
            @RequestParam Integer clienteId
    ) {
        try {
            return ResponseEntity.ok(citaService.cancelarCita(citaId, clienteId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PatchMapping("/{citaId}/estado")
    public ResponseEntity<?> actualizarEstado(
            @PathVariable Integer citaId,
            @RequestBody EstadoCitaRequest request
    ) {
        try {
            return ResponseEntity.ok(
                    citaService.actualizarEstado(
                            citaId,
                            request.getPeluqueriaId(),
                            request.getEstado()
                    )
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
        }
    }
}
