package com.utp.nuvia.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.utp.nuvia.dto.LoginRequest;
import com.utp.nuvia.dto.LoginResponse;
import com.utp.nuvia.dto.RegistroClienteRequest;
import com.utp.nuvia.dto.RegistroNegocioRequest;
import com.utp.nuvia.model.Peluqueria;
import com.utp.nuvia.model.Rol;
import com.utp.nuvia.model.Usuario;
import com.utp.nuvia.repository.PeluqueriaRepository;
import com.utp.nuvia.repository.RolRepository;
import com.utp.nuvia.repository.UsuarioRepository;

@Service
public class AuthService {

    private static final String ROL_CLIENTE = "CLIENTE";
    private static final String ROL_NEGOCIO = "NEGOCIO";

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PeluqueriaRepository peluqueriaRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PeluqueriaRepository peluqueriaRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.peluqueriaRepository = peluqueriaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new RuntimeException("Ingresa tu correo y contraseña");
        }

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("Correo o contraseña incorrectos"));

        if (!passwordValido(request.getPassword(), usuario.getPassword())) {
            throw new RuntimeException("Correo o contraseña incorrectos");
        }

        return construirRespuesta(usuario, "Login exitoso");
    }

    public LoginResponse loginCliente(LoginRequest request) {
        LoginResponse response = login(request);
        if (!ROL_CLIENTE.equalsIgnoreCase(response.getRol())) {
            throw new RuntimeException("Esta cuenta pertenece a un negocio");
        }
        return response;
    }

    @Transactional
    public LoginResponse registrarCliente(RegistroClienteRequest request) {
        validarDatosCuenta(
                request.getNombre(),
                request.getApellido(),
                request.getEmail(),
                request.getPassword()
        );

        if (usuarioRepository.findByEmailIgnoreCase(request.getEmail().trim()).isPresent()) {
            throw new RuntimeException("El correo ya está registrado");
        }

        Rol rolCliente = obtenerOCrearRol(ROL_CLIENTE);

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre().trim());
        usuario.setApellido(request.getApellido().trim());
        usuario.setTelefono(limpiar(request.getTelefono()));
        usuario.setEmail(request.getEmail().trim().toLowerCase());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(rolCliente);
        usuario.setFechaRegistro(LocalDateTime.now());

        Usuario usuarioGuardado = usuarioRepository.save(usuario);
        return construirRespuesta(usuarioGuardado, "Cliente registrado correctamente");
    }

    @Transactional
    public LoginResponse registrarNegocio(RegistroNegocioRequest request) {
        if (request.getNombreNegocio() == null || request.getNombreNegocio().isBlank()) {
            throw new RuntimeException("Ingresa el nombre del negocio");
        }
        if (request.getDireccion() == null || request.getDireccion().isBlank()
                || request.getDistrito() == null || request.getDistrito().isBlank()) {
            throw new RuntimeException("Completa la dirección y el distrito");
        }

        Rol rolNegocio = obtenerOCrearRol(ROL_NEGOCIO);
        Usuario usuario;

        if (request.getUsuarioId() != null) {
            usuario = usuarioRepository.findById(request.getUsuarioId())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (request.getNombre() != null && !request.getNombre().isBlank()) {
                usuario.setNombre(request.getNombre().trim());
            }
            if (request.getApellido() != null && !request.getApellido().isBlank()) {
                usuario.setApellido(request.getApellido().trim());
            }
            if (request.getTelefono() != null) {
                usuario.setTelefono(limpiar(request.getTelefono()));
            }
            usuario.setRol(rolNegocio);
            usuario = usuarioRepository.save(usuario);
        } else {
            validarDatosCuenta(
                    request.getNombre(),
                    request.getApellido(),
                    request.getEmail(),
                    request.getPassword()
            );

            if (usuarioRepository.findByEmailIgnoreCase(request.getEmail().trim()).isPresent()) {
                throw new RuntimeException("El correo ya está registrado");
            }

            usuario = new Usuario();
            usuario.setNombre(request.getNombre().trim());
            usuario.setApellido(request.getApellido().trim());
            usuario.setTelefono(limpiar(request.getTelefono()));
            usuario.setEmail(request.getEmail().trim().toLowerCase());
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
            usuario.setRol(rolNegocio);
            usuario.setFechaRegistro(LocalDateTime.now());
            usuario = usuarioRepository.save(usuario);
        }

        Peluqueria peluqueria = peluqueriaRepository.findByUsuarioId(usuario.getId())
                .orElseGet(Peluqueria::new);

        peluqueria.setUsuario(usuario);
        peluqueria.setNombre(request.getNombreNegocio().trim());
        peluqueria.setDireccion(request.getDireccion().trim());
        peluqueria.setDistrito(request.getDistrito().trim());
        peluqueria.setTelefono(usuario.getTelefono());
        peluqueria.setEstado("ACTIVO");
        peluqueria.setActiva(true);

        if (peluqueria.getDescripcion() == null) {
            peluqueria.setDescripcion("");
        }
        if (peluqueria.getSobreNosotros() == null) {
            peluqueria.setSobreNosotros("");
        }
        if (peluqueria.getImagenLogo() == null) {
            peluqueria.setImagenLogo("");
        }
        if (peluqueria.getPortadaImagen() == null) {
            peluqueria.setPortadaImagen("");
        }
        if (peluqueria.getFechaRegistro() == null) {
            peluqueria.setFechaRegistro(LocalDateTime.now());
        }

        peluqueriaRepository.save(peluqueria);
        return construirRespuesta(usuario, "Negocio registrado correctamente");
    }

    private LoginResponse construirRespuesta(Usuario usuario, String mensaje) {
        Integer peluqueriaId = peluqueriaRepository.findByUsuarioId(usuario.getId())
                .map(Peluqueria::getId)
                .orElse(null);

        return new LoginResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getTelefono(),
                usuario.getEmail(),
                usuario.getRol().getNombre(),
                peluqueriaId,
                mensaje
        );
    }

    private boolean passwordValido(String passwordPlano, String passwordGuardado) {
        if (passwordGuardado == null) {
            return false;
        }
        if (passwordGuardado.startsWith("$2a$")
                || passwordGuardado.startsWith("$2b$")
                || passwordGuardado.startsWith("$2y$")) {
            return passwordEncoder.matches(passwordPlano, passwordGuardado);
        }
        return passwordGuardado.equals(passwordPlano);
    }

    private void validarDatosCuenta(String nombre, String apellido, String email, String password) {
        if (nombre == null || nombre.isBlank()
                || apellido == null || apellido.isBlank()
                || email == null || email.isBlank()
                || password == null || password.isBlank()) {
            throw new RuntimeException("Completa todos los datos de la cuenta");
        }
    }

    private Rol obtenerOCrearRol(String nombreRol) {
        return rolRepository.findByNombre(nombreRol)
                .orElseGet(() -> {
                    Rol rol = new Rol();
                    rol.setNombre(nombreRol);
                    return rolRepository.save(rol);
                });
    }

    private String limpiar(String valor) {
        return valor == null ? null : valor.trim();
    }
}
