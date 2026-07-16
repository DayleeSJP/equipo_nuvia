package com.utp.nuvia.service;

import com.utp.nuvia.dto.PlanActualResponse;
import com.utp.nuvia.model.Peluqueria;
import com.utp.nuvia.model.Plan;
import com.utp.nuvia.model.Suscripcion;
import com.utp.nuvia.repository.PeluqueriaRepository;
import com.utp.nuvia.repository.PlanRepository;
import com.utp.nuvia.repository.ServicioRepository;
import com.utp.nuvia.repository.SuscripcionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class PlanService {

    public static final String STANDARD = "STANDARD";
    public static final String PREMIUM = "PREMIUM";

    private final PlanRepository planRepository;
    private final SuscripcionRepository suscripcionRepository;
    private final PeluqueriaRepository peluqueriaRepository;
    private final ServicioRepository servicioRepository;

    public PlanService(
            PlanRepository planRepository,
            SuscripcionRepository suscripcionRepository,
            PeluqueriaRepository peluqueriaRepository,
            ServicioRepository servicioRepository
    ) {
        this.planRepository = planRepository;
        this.suscripcionRepository = suscripcionRepository;
        this.peluqueriaRepository = peluqueriaRepository;
        this.servicioRepository = servicioRepository;
    }

    @Transactional
    public void asignarStandardSiNoExiste(Peluqueria peluqueria) {
        obtenerSuscripcionVigente(peluqueria);
    }

    @Transactional
    public PlanActualResponse obtenerPlanPorUsuario(Integer usuarioId) {
        Peluqueria peluqueria = peluqueriaRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("No se encontró el negocio del usuario"));
        return construirRespuesta(obtenerSuscripcionVigente(peluqueria), null);
    }

    @Transactional
    public PlanActualResponse activarPremium(Integer usuarioId) {
        Peluqueria peluqueria = peluqueriaRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("No se encontró el negocio del usuario"));

        Suscripcion suscripcion = obtenerSuscripcionVigente(peluqueria);
        Plan premium = obtenerOCrearPlanPremium();
        LocalDateTime ahora = LocalDateTime.now();

        suscripcion.setPlan(premium);
        suscripcion.setEstado("ACTIVO");
        suscripcion.setFechaInicio(ahora);
        suscripcion.setFechaFin(ahora.plusMonths(1));

        return construirRespuesta(
                suscripcionRepository.save(suscripcion),
                "Plan Premium activado correctamente"
        );
    }

    @Transactional
    public PlanActualResponse activarStandard(Integer usuarioId) {
        Peluqueria peluqueria = peluqueriaRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("No se encontró el negocio del usuario"));

        Suscripcion suscripcion = obtenerSuscripcionVigente(peluqueria);
        Plan standard = obtenerOCrearPlanStandard();
        LocalDateTime ahora = LocalDateTime.now();

        suscripcion.setPlan(standard);
        suscripcion.setEstado("ACTIVO");
        suscripcion.setFechaInicio(ahora);
        suscripcion.setFechaFin(null);

        return construirRespuesta(
                suscripcionRepository.save(suscripcion),
                "El negocio ahora utiliza el Plan Standard"
        );
    }

    @Transactional
    public boolean esPremium(Integer peluqueriaId) {
        Peluqueria peluqueria = peluqueriaRepository.findById(peluqueriaId)
                .orElseThrow(() -> new RuntimeException("Peluquería no encontrada"));
        return PREMIUM.equalsIgnoreCase(obtenerSuscripcionVigente(peluqueria).getPlan().getNombre());
    }

    @Transactional
    public String nombrePlan(Integer peluqueriaId) {
        Peluqueria peluqueria = peluqueriaRepository.findById(peluqueriaId)
                .orElseThrow(() -> new RuntimeException("Peluquería no encontrada"));
        return obtenerSuscripcionVigente(peluqueria).getPlan().getNombre();
    }

    @Transactional
    public void validarNuevosServicios(Peluqueria peluqueria, long cantidadNuevos) {
        Suscripcion suscripcion = obtenerSuscripcionVigente(peluqueria);
        Integer limite = suscripcion.getPlan().getLimiteServicios();

        if (limite == null || cantidadNuevos <= 0) {
            return;
        }

        long actuales = servicioRepository.countByPeluqueriaId(peluqueria.getId());
        if (actuales + cantidadNuevos > limite) {
            throw new RuntimeException(
                    "El Plan Standard permite hasta " + limite
                            + " servicios. Activa Premium para agregar servicios ilimitados."
            );
        }
    }

    @Transactional
    public Suscripcion obtenerSuscripcionVigente(Peluqueria peluqueria) {
        Plan standard = obtenerOCrearPlanStandard();
        obtenerOCrearPlanPremium();

        Suscripcion suscripcion = suscripcionRepository.findByPeluqueriaId(peluqueria.getId())
                .orElseGet(() -> {
                    Suscripcion nueva = new Suscripcion();
                    nueva.setPeluqueria(peluqueria);
                    nueva.setPlan(standard);
                    nueva.setEstado("ACTIVO");
                    nueva.setFechaInicio(LocalDateTime.now());
                    nueva.setFechaFin(null);
                    return suscripcionRepository.save(nueva);
                });

        if (PREMIUM.equalsIgnoreCase(suscripcion.getPlan().getNombre())
                && suscripcion.getFechaFin() != null
                && suscripcion.getFechaFin().isBefore(LocalDateTime.now())) {
            suscripcion.setPlan(standard);
            suscripcion.setEstado("ACTIVO");
            suscripcion.setFechaInicio(LocalDateTime.now());
            suscripcion.setFechaFin(null);
            suscripcion = suscripcionRepository.save(suscripcion);
        }

        return suscripcion;
    }

    private PlanActualResponse construirRespuesta(Suscripcion suscripcion, String mensaje) {
        Plan plan = suscripcion.getPlan();
        int usados = Math.toIntExact(servicioRepository.countByPeluqueriaId(
                suscripcion.getPeluqueria().getId()
        ));

        return new PlanActualResponse(
                suscripcion.getPeluqueria().getId(),
                plan.getNombre(),
                plan.getDescripcion(),
                plan.getPrecioMensual(),
                plan.getLimiteServicios(),
                usados,
                PREMIUM.equalsIgnoreCase(plan.getNombre()),
                suscripcion.getEstado(),
                suscripcion.getFechaInicio(),
                suscripcion.getFechaFin(),
                mensaje
        );
    }

    private Plan obtenerOCrearPlanStandard() {
        return planRepository.findByNombreIgnoreCase(STANDARD)
                .orElseGet(() -> {
                    Plan plan = new Plan();
                    plan.setNombre(STANDARD);
                    plan.setDescripcion("Para comenzar a publicar");
                    plan.setPrecioMensual(BigDecimal.ZERO);
                    plan.setLimiteServicios(5);
                    plan.setDestacado(false);
                    return planRepository.save(plan);
                });
    }

    private Plan obtenerOCrearPlanPremium() {
        return planRepository.findByNombreIgnoreCase(PREMIUM)
                .orElseGet(() -> {
                    Plan plan = new Plan();
                    plan.setNombre(PREMIUM);
                    plan.setDescripcion("Para negocios en crecimiento");
                    plan.setPrecioMensual(new BigDecimal("49.00"));
                    plan.setLimiteServicios(null);
                    plan.setDestacado(true);
                    return planRepository.save(plan);
                });
    }
}
