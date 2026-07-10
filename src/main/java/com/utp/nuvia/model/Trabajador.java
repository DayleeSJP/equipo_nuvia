package com.utp.nuvia.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trabajadores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Trabajador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "peluqueria_id", nullable = false)
    private Peluqueria peluqueria;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellido;

    @Column(length = 255)
    private String foto;

    @Column(length = 100)
    private String especialidad;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(nullable = false)
    private Boolean activo = true;
}