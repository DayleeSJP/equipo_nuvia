package com.utp.nuvia.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.utp.nuvia.model.Rol;
import com.utp.nuvia.repository.RolRepository;

@RestController
@RequestMapping("/api/roles")
public class RolController {
    private final RolRepository rolRepository;

    public RolController(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    @GetMapping
    public List<Rol> listarRoles() {
        return rolRepository.findAll();
    }
}