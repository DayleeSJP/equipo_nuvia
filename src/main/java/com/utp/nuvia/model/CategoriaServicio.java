package com.utp.nuvia.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categorias_servicio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    @Column(length = 20)
    private String color;

    @ManyToOne
    @JoinColumn(name = "peluqueria_id", nullable = false)
    private Peluqueria peluqueria;
}
