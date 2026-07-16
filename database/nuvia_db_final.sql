

CREATE DATABASE IF NOT EXISTS nuvia_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE nuvia_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS resenas;
DROP TABLE IF EXISTS horarios_trabajador;
DROP TABLE IF EXISTS horarios_peluqueria;
DROP TABLE IF EXISTS trabajador_servicio;
DROP TABLE IF EXISTS servicios_negocio;
DROP TABLE IF EXISTS beneficios_plan;
DROP TABLE IF EXISTS suscripciones;
DROP TABLE IF EXISTS planes;
DROP TABLE IF EXISTS cupones;
DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS trabajadores;
DROP TABLE IF EXISTS servicios;
DROP TABLE IF EXISTS categorias_servicio;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS peluquerias;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(30) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NULL,
  rol_id INT NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_email (email),
  KEY idx_usuarios_rol (rol_id),
  CONSTRAINT fk_usuarios_roles
    FOREIGN KEY (rol_id) REFERENCES roles (id)
) ENGINE=InnoDB;

CREATE TABLE peluquerias (
  id INT NOT NULL AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  direccion VARCHAR(255) NOT NULL,
  distrito VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NULL,
  imagen_logo LONGTEXT NULL,
  portada_imagen LONGTEXT NULL,
  sobre_nosotros TEXT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
  activa TINYINT(1) NOT NULL DEFAULT 1,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_peluquerias_usuario (usuario_id),
  CONSTRAINT fk_peluquerias_usuarios
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB;

CREATE TABLE categorias (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_categorias_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE categorias_servicio (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  descripcion VARCHAR(255) NULL,
  color VARCHAR(20) NULL,
  peluqueria_id INT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_categoria_visual_peluqueria (peluqueria_id),
  CONSTRAINT fk_categoria_visual_peluqueria
    FOREIGN KEY (peluqueria_id) REFERENCES peluquerias (id)
) ENGINE=InnoDB;

CREATE TABLE servicios (
  id INT NOT NULL AUTO_INCREMENT,
  peluqueria_id INT NOT NULL,
  categoria_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  duracion_min INT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_servicios_peluqueria (peluqueria_id),
  KEY idx_servicios_categoria (categoria_id),
  CONSTRAINT fk_servicios_peluquerias
    FOREIGN KEY (peluqueria_id) REFERENCES peluquerias (id),
  CONSTRAINT fk_servicios_categorias
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
) ENGINE=InnoDB;

CREATE TABLE trabajadores (
  id INT NOT NULL AUTO_INCREMENT,
  peluqueria_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  foto VARCHAR(255) NULL,
  especialidad VARCHAR(100) NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_trabajadores_peluqueria (peluqueria_id),
  CONSTRAINT fk_trabajadores_peluquerias
    FOREIGN KEY (peluqueria_id) REFERENCES peluquerias (id)
) ENGINE=InnoDB;

CREATE TABLE citas (
  id INT NOT NULL AUTO_INCREMENT,
  codigo_confirmacion VARCHAR(30) NOT NULL,
  -- usuario_id se conserva por compatibilidad con la base original y contiene el mismo cliente.
  usuario_id INT NOT NULL,
  cliente_id INT NOT NULL,
  peluqueria_id INT NOT NULL,
  servicio_id INT NOT NULL,
  trabajador_id INT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'Confirmada',
  precio_total DECIMAL(10,2) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_registro DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_citas_codigo (codigo_confirmacion),
  KEY idx_citas_cliente (cliente_id),
  KEY idx_citas_peluqueria_fecha (peluqueria_id, fecha, hora),
  KEY idx_citas_servicio (servicio_id),
  KEY idx_citas_trabajador (trabajador_id),
  CONSTRAINT fk_citas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
  CONSTRAINT fk_citas_cliente
    FOREIGN KEY (cliente_id) REFERENCES usuarios (id),
  CONSTRAINT fk_citas_peluqueria
    FOREIGN KEY (peluqueria_id) REFERENCES peluquerias (id),
  CONSTRAINT fk_citas_servicio
    FOREIGN KEY (servicio_id) REFERENCES servicios (id),
  CONSTRAINT fk_citas_trabajador
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores (id)
) ENGINE=InnoDB;

INSERT INTO roles (nombre) VALUES ('ADMIN'), ('CLIENTE'), ('NEGOCIO');

INSERT INTO categorias (nombre) VALUES
  ('Corte'),
  ('Barbería'),
  ('Tinte'),
  ('Peinado'),
  ('Manicure'),
  ('Pedicure'),
  ('Maquillaje'),
  ('Cejas'),
  ('Spa'),
  ('Cabello y peinado'),
  ('Cejas y pestañas');
