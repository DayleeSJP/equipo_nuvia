package com.utp.nuvia.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.utp.nuvia.dto.LoginRequest;
import com.utp.nuvia.dto.RegistroClienteRequest;
import com.utp.nuvia.dto.RegistroNegocioRequest;
import com.utp.nuvia.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping("/login-cliente")
    public ResponseEntity<?> loginCliente(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.loginCliente(request));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping("/registro-cliente")
    public ResponseEntity<?> registrarCliente(@RequestBody RegistroClienteRequest request) {
        try {
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(authService.registrarCliente(request));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping("/registro-negocio")
    public ResponseEntity<?> registrarNegocio(@RequestBody RegistroNegocioRequest request) {
        try {
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(authService.registrarNegocio(request));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }
}
