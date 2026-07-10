package com.utp.nuvia.service;

import com.utp.nuvia.dto.CitaResponse;
import com.utp.nuvia.dto.RegistroCitaRequest;
import com.utp.nuvia.model.Cita;
import com.utp.nuvia.model.Peluqueria;
import com.utp.nuvia.model.Servicio;
import com.utp.nuvia.model.Trabajador;
import com.utp.nuvia.model.Usuario;
import com.utp.nuvia.repository.CitaRepository;
import com.utp.nuvia.repository.PeluqueriaRepository;
import com.utp.nuvia.repository.ServicioRepository;
import com.utp.nuvia.repository.TrabajadorRepository;
import com.utp.nuvia.repository.UsuarioRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class CitaService {

    private static final Set<String> ESTADOS_VALIDOS = Set.of(
            "CONFIRMADA", "PENDIENTE", "EN PROCESO", "COMPLETADA", "CANCELADA"
    );

    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PeluqueriaRepository peluqueriaRepository;
    private final ServicioRepository servicioRepository;
    private final TrabajadorRepository trabajadorRepository;

    public CitaService(
            CitaRepository citaRepository,
            UsuarioRepository usuarioRepository,
            PeluqueriaRepository peluqueriaRepository,
            ServicioRepository servicioRepository,
            TrabajadorRepository trabajadorRepository
    ) {
        this.citaRepository = citaRepository;
        this.usuarioRepository = usuarioRepository;
        this.peluqueriaRepository = peluqueriaRepository;
        this.servicioRepository = servicioRepository;
        this.trabajadorRepository = trabajadorRepository;
    }

    @Transactional
    public CitaResponse registrarCita(RegistroCitaRequest request) {
        validarRequest(request);

        Usuario cliente = usuarioRepository.findById(request.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        if (cliente.getRol() == null
                || !"CLIENTE".equalsIgnoreCase(cliente.getRol().getNombre())) {
            throw new RuntimeException("El usuario seleccionado no tiene rol CLIENTE");
        }

        Peluqueria peluqueria = peluqueriaRepository.findById(request.getPeluqueriaId())
                .orElseThrow(() -> new RuntimeException("Peluquería no encontrada"));

        Servicio servicio = servicioRepository
                .findByIdAndPeluqueriaId(request.getServicioId(), peluqueria.getId())
                .orElseThrow(() -> new RuntimeException(
                        "El servicio no pertenece a la peluquería seleccionada"
                ));

        Trabajador trabajador = null;
        if (request.getTrabajadorId() != null) {
            trabajador = trabajadorRepository
                    .findByIdAndPeluqueriaId(request.getTrabajadorId(), peluqueria.getId())
                    .orElseThrow(() -> new RuntimeException(
                            "El trabajador no pertenece a la peluquería seleccionada"
                    ));

            boolean ocupado = citaRepository
                    .contarConflictosTrabajador(
                            peluqueria.getId(),
                            trabajador.getId(),
                            request.getFecha(),
                            request.getHora(),
                            "Cancelada"
                    ) > 0;
            if (ocupado) {
                throw new RuntimeException("El profesional ya tiene una cita en ese horario");
            }
        }

        LocalDateTime ahora = LocalDateTime.now();

        Cita cita = new Cita();
        cita.setCodigoConfirmacion(generarCodigo());
        cita.setUsuario(cliente);
        cita.setCliente(cliente);
        cita.setPeluqueria(peluqueria);
        cita.setServicio(servicio);
        cita.setTrabajador(trabajador);
        cita.setFecha(request.getFecha());
        cita.setHora(request.getHora());
        cita.setEstado("Confirmada");
        cita.setPrecioTotal(servicio.getPrecio());
        cita.setFechaCreacion(ahora);
        cita.setFechaRegistro(ahora);

        return convertirRespuesta(citaRepository.save(cita));
    }

    public List<CitaResponse> listarPorCliente(Integer clienteId) {
        usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        return citaRepository
                .findByClienteIdOrderByFechaDescHoraDesc(clienteId)
                .stream()
                .map(this::convertirRespuesta)
                .toList();
    }

    public List<CitaResponse> listarPorPeluqueria(Integer peluqueriaId) {
        peluqueriaRepository.findById(peluqueriaId)
                .orElseThrow(() -> new RuntimeException("Peluquería no encontrada"));

        return citaRepository
                .findByPeluqueriaIdOrderByFechaAscHoraAsc(peluqueriaId)
                .stream()
                .map(this::convertirRespuesta)
                .toList();
    }

    @Transactional
    public CitaResponse cancelarCita(Integer citaId, Integer clienteId) {
        Cita cita = citaRepository
                .findByIdAndClienteId(citaId, clienteId)
                .orElseThrow(() -> new RuntimeException(
                        "La cita no existe o no pertenece al cliente"
                ));

        if ("Completada".equalsIgnoreCase(cita.getEstado())) {
            throw new RuntimeException("Una cita completada no puede cancelarse");
        }

        cita.setEstado("Cancelada");
        return convertirRespuesta(citaRepository.save(cita));
    }

    @Transactional
    public CitaResponse actualizarEstado(
            Integer citaId,
            Integer peluqueriaId,
            String estado
    ) {
        Cita cita = citaRepository.findByIdAndPeluqueriaId(citaId, peluqueriaId)
                .orElseThrow(() -> new RuntimeException(
                        "La cita no existe o no pertenece a este negocio"
                ));

        String estadoNormalizado = normalizarEstado(estado);
        cita.setEstado(estadoNormalizado);
        return convertirRespuesta(citaRepository.save(cita));
    }

    private void validarRequest(RegistroCitaRequest request) {
        if (request.getClienteId() == null
                || request.getPeluqueriaId() == null
                || request.getServicioId() == null
                || request.getFecha() == null
                || request.getHora() == null) {
            throw new RuntimeException("Faltan datos para registrar la cita");
        }
        if (request.getFecha().isBefore(LocalDate.now())) {
            throw new RuntimeException("No puedes reservar una fecha pasada");
        }
    }

    private String normalizarEstado(String estado) {
        if (estado == null || estado.isBlank()) {
            throw new RuntimeException("Selecciona un estado válido");
        }

        String mayuscula = estado.trim().toUpperCase(Locale.ROOT);
        if (!ESTADOS_VALIDOS.contains(mayuscula)) {
            throw new RuntimeException("Estado de cita no válido");
        }

        return switch (mayuscula) {
            case "EN PROCESO" -> "En proceso";
            case "COMPLETADA" -> "Completada";
            case "CANCELADA" -> "Cancelada";
            case "PENDIENTE" -> "Pendiente";
            default -> "Confirmada";
        };
    }

    private String generarCodigo() {
        return "NV-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase(Locale.ROOT);
    }

    private CitaResponse convertirRespuesta(Cita cita) {
        String nombreTrabajador = "Sin preferencia";
        Integer trabajadorId = null;

        if (cita.getTrabajador() != null) {
            trabajadorId = cita.getTrabajador().getId();
            nombreTrabajador = cita.getTrabajador().getNombre()
                    + " "
                    + cita.getTrabajador().getApellido();
        }

        String nombreCliente = cita.getCliente().getNombre()
                + " "
                + cita.getCliente().getApellido();

        return new CitaResponse(
                cita.getId(),
                cita.getCodigoConfirmacion(),

                cita.getCliente().getId(),
                nombreCliente.trim(),
                cita.getCliente().getEmail(),

                cita.getPeluqueria().getId(),
                cita.getPeluqueria().getNombre(),
                cita.getPeluqueria().getDireccion()
                        + ", "
                        + cita.getPeluqueria().getDistrito(),

                cita.getServicio().getId(),
                cita.getServicio().getNombre(),
                cita.getServicio().getDuracionMin(),
                cita.getPrecioTotal(),

                trabajadorId,
                nombreTrabajador,

                cita.getFecha(),
                cita.getHora(),
                cita.getEstado(),
                cita.getFechaRegistro()
        );
    }
}
