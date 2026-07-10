package com.utp.nuvia.service;

import com.utp.nuvia.dto.CatalogoPeluqueriaResponse;
import com.utp.nuvia.dto.DetallePeluqueriaResponse;
import com.utp.nuvia.dto.PersonalizacionNegocioRequest;
import com.utp.nuvia.dto.RegistroNegocioRequest;
import com.utp.nuvia.model.Categoria;
import com.utp.nuvia.model.CategoriaServicio;
import com.utp.nuvia.model.Peluqueria;
import com.utp.nuvia.model.Servicio;
import com.utp.nuvia.model.Trabajador;
import com.utp.nuvia.model.Usuario;
import com.utp.nuvia.repository.CategoriaRepository;
import com.utp.nuvia.repository.CategoriaServicioRepository;
import com.utp.nuvia.repository.PeluqueriaRepository;
import com.utp.nuvia.repository.ServicioRepository;
import com.utp.nuvia.repository.TrabajadorRepository;
import com.utp.nuvia.repository.UsuarioRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class NegocioService {

    private final UsuarioRepository usuarioRepository;
    private final PeluqueriaRepository peluqueriaRepository;
    private final CategoriaRepository categoriaRepository;
    private final CategoriaServicioRepository categoriaServicioRepository;
    private final ServicioRepository servicioRepository;
    private final TrabajadorRepository trabajadorRepository;

    public NegocioService(
            UsuarioRepository usuarioRepository,
            PeluqueriaRepository peluqueriaRepository,
            CategoriaRepository categoriaRepository,
            CategoriaServicioRepository categoriaServicioRepository,
            ServicioRepository servicioRepository,
            TrabajadorRepository trabajadorRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.peluqueriaRepository = peluqueriaRepository;
        this.categoriaRepository = categoriaRepository;
        this.categoriaServicioRepository = categoriaServicioRepository;
        this.servicioRepository = servicioRepository;
        this.trabajadorRepository = trabajadorRepository;
    }


    @Transactional
    public DetallePeluqueriaResponse registrarNegocio(RegistroNegocioRequest request) {
        if (request.getUsuarioId() == null) {
            throw new RuntimeException("No se pudo identificar al usuario del negocio");
        }

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Peluqueria peluqueria = peluqueriaRepository.findByUsuarioId(usuario.getId())
                .orElseGet(Peluqueria::new);

        peluqueria.setUsuario(usuario);
        peluqueria.setNombre(requerido(request.getNombreNegocio(), "Ingresa el nombre del negocio"));
        peluqueria.setDireccion(requerido(request.getDireccion(), "Ingresa la dirección"));
        peluqueria.setDistrito(requerido(request.getDistrito(), "Selecciona el distrito"));
        peluqueria.setTelefono(usuario.getTelefono());
        peluqueria.setEstado("ACTIVO");
        peluqueria.setActiva(true);

        if (peluqueria.getDescripcion() == null) peluqueria.setDescripcion("");
        if (peluqueria.getSobreNosotros() == null) peluqueria.setSobreNosotros("");
        if (peluqueria.getImagenLogo() == null) peluqueria.setImagenLogo("");
        if (peluqueria.getPortadaImagen() == null) peluqueria.setPortadaImagen("");
        if (peluqueria.getFechaRegistro() == null) peluqueria.setFechaRegistro(LocalDateTime.now());

        Peluqueria guardada = peluqueriaRepository.save(peluqueria);
        return obtenerDetalle(guardada.getId());
    }

    public DetallePeluqueriaResponse obtenerPorUsuario(Integer usuarioId) {
        Peluqueria peluqueria = peluqueriaRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("No se encontró el negocio del usuario"));
        return obtenerDetalle(peluqueria.getId());
    }

    @Transactional
    public DetallePeluqueriaResponse guardarPersonalizacion(PersonalizacionNegocioRequest request) {
        if (request.getUsuarioId() == null) {
            throw new RuntimeException("No se pudo identificar al propietario");
        }

        Peluqueria peluqueria = peluqueriaRepository.findByUsuarioId(request.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Primero debes registrar el negocio"));

        if (request.getPeluqueriaId() != null
                && !peluqueria.getId().equals(request.getPeluqueriaId())) {
            throw new RuntimeException("El negocio no pertenece al usuario conectado");
        }

        if (request.getPortadaImagen() != null) {
            peluqueria.setPortadaImagen(request.getPortadaImagen());
            peluqueria.setImagenLogo(request.getPortadaImagen());
        }
        if (request.getSobreNosotros() != null) {
            peluqueria.setSobreNosotros(request.getSobreNosotros().trim());
            peluqueria.setDescripcion(request.getSobreNosotros().trim());
        }
        peluqueriaRepository.save(peluqueria);

        if (request.getCategorias() != null) {
            for (PersonalizacionNegocioRequest.CategoriaRequest categoriaRequest : request.getCategorias()) {
                if (categoriaRequest.getNombre() == null || categoriaRequest.getNombre().isBlank()) {
                    continue;
                }

                String nombreCategoria = categoriaRequest.getNombre().trim();

                CategoriaServicio categoriaVisual = buscarCategoriaVisual(
                        peluqueria.getId(),
                        categoriaRequest.getId(),
                        nombreCategoria
                );
                categoriaVisual.setPeluqueria(peluqueria);
                categoriaVisual.setNombre(nombreCategoria);
                categoriaVisual.setDescripcion(valorOBlanco(categoriaRequest.getDescripcion()));
                categoriaVisual.setColor(
                        categoriaRequest.getColor() == null || categoriaRequest.getColor().isBlank()
                                ? "#B9DDED"
                                : categoriaRequest.getColor()
                );
                categoriaVisual = categoriaServicioRepository.save(categoriaVisual);

                Categoria categoriaGlobal = categoriaRepository.findByNombreIgnoreCase(nombreCategoria)
                        .orElseGet(() -> {
                            Categoria nueva = new Categoria();
                            nueva.setNombre(nombreCategoria);
                            return categoriaRepository.save(nueva);
                        });

                if (categoriaRequest.getServicios() != null) {
                    for (PersonalizacionNegocioRequest.ServicioRequest servicioRequest
                            : categoriaRequest.getServicios()) {
                        guardarServicio(peluqueria, categoriaGlobal, servicioRequest);
                    }
                }
            }
        }

        if (request.getTrabajadores() != null) {
            for (PersonalizacionNegocioRequest.TrabajadorRequest trabajadorRequest : request.getTrabajadores()) {
                guardarTrabajador(peluqueria, trabajadorRequest);
            }
        }

        return obtenerDetalle(peluqueria.getId());
    }

    public List<CatalogoPeluqueriaResponse> listarCatalogo() {
        List<Peluqueria> peluquerias = peluqueriaRepository
                .findByEstadoIgnoreCaseAndActivaTrueOrderByFechaRegistroDesc("ACTIVO");
        List<CatalogoPeluqueriaResponse> response = new ArrayList<>();

        for (Peluqueria peluqueria : peluquerias) {
            List<Servicio> servicios = servicioRepository.findByPeluqueriaIdOrderByIdAsc(peluqueria.getId());

            List<String> nombresServicios = servicios.stream()
                    .map(servicio -> servicio.getNombre().toLowerCase(Locale.ROOT))
                    .toList();

            response.add(new CatalogoPeluqueriaResponse(
                    peluqueria.getId(),
                    peluqueria.getNombre(),
                    peluqueria.getDireccion() + ", " + peluqueria.getDistrito(),
                    peluqueria.getDistrito(),
                    "Peluquería · " + servicios.size() + " servicios",
                    "4,8",
                    imagenCatalogo(peluqueria),
                    nombresServicios
            ));
        }

        return response;
    }

    public DetallePeluqueriaResponse obtenerDetalle(Integer id) {
        Peluqueria peluqueria = peluqueriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Peluquería no encontrada"));

        DetallePeluqueriaResponse response = new DetallePeluqueriaResponse();
        response.setId(peluqueria.getId());
        response.setUsuarioId(peluqueria.getUsuario().getId());
        response.setNombreNegocio(peluqueria.getNombre());
        response.setDireccion(peluqueria.getDireccion());
        response.setDistrito(peluqueria.getDistrito());
        response.setPortada(imagenCatalogo(peluqueria));
        response.setSobreNosotros(
                noVacio(peluqueria.getSobreNosotros())
                        ? peluqueria.getSobreNosotros()
                        : valorOBlanco(peluqueria.getDescripcion())
        );
        response.setEstado(peluqueria.getEstado());
        response.setActiva(peluqueria.getActiva());

        response.setCategorias(construirCategorias(peluqueria));
        response.setTrabajadores(construirTrabajadores(peluqueria));
        return response;
    }

    private List<DetallePeluqueriaResponse.CategoriaDetalle> construirCategorias(Peluqueria peluqueria) {
        List<Servicio> servicios = servicioRepository.findByPeluqueriaIdOrderByIdAsc(peluqueria.getId());
        List<CategoriaServicio> categoriasVisuales = categoriaServicioRepository
                .findByPeluqueriaIdOrderByIdAsc(peluqueria.getId());

        Map<String, CategoriaServicio> visualPorNombre = new LinkedHashMap<>();
        for (CategoriaServicio categoriaVisual : categoriasVisuales) {
            visualPorNombre.put(clave(categoriaVisual.getNombre()), categoriaVisual);
        }

        Map<String, DetallePeluqueriaResponse.CategoriaDetalle> agrupadas = new LinkedHashMap<>();

        // Primero agrega las categorías visuales, incluso si todavía no tienen servicios.
        for (CategoriaServicio visual : categoriasVisuales) {
            DetallePeluqueriaResponse.CategoriaDetalle categoriaDetalle =
                    new DetallePeluqueriaResponse.CategoriaDetalle();
            categoriaDetalle.setId(visual.getId());
            categoriaDetalle.setNombre(visual.getNombre());
            categoriaDetalle.setDescripcion(valorOBlanco(visual.getDescripcion()));
            categoriaDetalle.setColor(noVacio(visual.getColor()) ? visual.getColor() : "#B9DDED");
            categoriaDetalle.setServicios(new ArrayList<>());
            agrupadas.put(clave(visual.getNombre()), categoriaDetalle);
        }

        for (Servicio servicio : servicios) {
            String nombreCategoria = servicio.getCategoria().getNombre();
            String claveCategoria = clave(nombreCategoria);

            DetallePeluqueriaResponse.CategoriaDetalle categoriaDetalle = agrupadas.get(claveCategoria);
            if (categoriaDetalle == null) {
                CategoriaServicio visual = visualPorNombre.get(claveCategoria);
                categoriaDetalle = new DetallePeluqueriaResponse.CategoriaDetalle();
                categoriaDetalle.setId(visual != null ? visual.getId() : servicio.getCategoria().getId());
                categoriaDetalle.setNombre(nombreCategoria);
                categoriaDetalle.setDescripcion(visual != null ? valorOBlanco(visual.getDescripcion()) : "");
                categoriaDetalle.setColor(
                        visual != null && noVacio(visual.getColor()) ? visual.getColor() : "#B9DDED"
                );
                categoriaDetalle.setServicios(new ArrayList<>());
                agrupadas.put(claveCategoria, categoriaDetalle);
            }

            DetallePeluqueriaResponse.ServicioDetalle servicioDetalle = new DetallePeluqueriaResponse.ServicioDetalle();
            servicioDetalle.setId(servicio.getId());
            servicioDetalle.setNombre(servicio.getNombre());
            servicioDetalle.setDescripcion(servicio.getDescripcion());
            servicioDetalle.setCategoriaId(categoriaDetalle.getId());
            servicioDetalle.setPrecio(servicio.getPrecio());
            servicioDetalle.setDuracion(servicio.getDuracionMin() + " min");
            categoriaDetalle.getServicios().add(servicioDetalle);
        }

        return new ArrayList<>(agrupadas.values());
    }

    private List<DetallePeluqueriaResponse.TrabajadorDetalle> construirTrabajadores(Peluqueria peluqueria) {
        List<Trabajador> trabajadores = trabajadorRepository
                .findByPeluqueriaIdAndActivoTrueOrderByNombreAsc(peluqueria.getId());
        List<DetallePeluqueriaResponse.TrabajadorDetalle> response = new ArrayList<>();

        for (Trabajador trabajador : trabajadores) {
            DetallePeluqueriaResponse.TrabajadorDetalle detalle = new DetallePeluqueriaResponse.TrabajadorDetalle();
            detalle.setId(trabajador.getId());
            detalle.setNombre(trabajador.getNombre());
            detalle.setApellido(trabajador.getApellido());
            detalle.setEspecialidad(trabajador.getEspecialidad());
            response.add(detalle);
        }
        return response;
    }

    private void guardarServicio(
            Peluqueria peluqueria,
            Categoria categoria,
            PersonalizacionNegocioRequest.ServicioRequest request
    ) {
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            return;
        }
        if (request.getPrecio() == null || request.getPrecio().signum() < 0) {
            throw new RuntimeException("El servicio " + request.getNombre() + " necesita un precio válido");
        }

        Servicio servicio = null;
        if (request.getId() != null && request.getId() > 0) {
            servicio = servicioRepository.findByIdAndPeluqueriaId(request.getId(), peluqueria.getId())
                    .orElse(null);
        }
        if (servicio == null) {
            servicio = new Servicio();
            servicio.setPeluqueria(peluqueria);
        }

        servicio.setCategoria(categoria);
        servicio.setNombre(request.getNombre().trim());
        servicio.setDescripcion(valorOBlanco(request.getDescripcion()));
        servicio.setPrecio(request.getPrecio());
        servicio.setDuracionMin(convertirDuracionAMinutos(request.getDuracion()));
        servicioRepository.save(servicio);
    }

    private void guardarTrabajador(
            Peluqueria peluqueria,
            PersonalizacionNegocioRequest.TrabajadorRequest request
    ) {
        if (request.getNombre() == null || request.getNombre().isBlank()
                || request.getApellido() == null || request.getApellido().isBlank()) {
            return;
        }

        Trabajador trabajador = null;
        if (request.getId() != null && request.getId() > 0) {
            trabajador = trabajadorRepository.findByIdAndPeluqueriaId(request.getId(), peluqueria.getId())
                    .orElse(null);
        }
        if (trabajador == null) {
            trabajador = new Trabajador();
            trabajador.setPeluqueria(peluqueria);
            trabajador.setActivo(true);
            trabajador.setEstado("ACTIVO");
        }

        trabajador.setNombre(request.getNombre().trim());
        trabajador.setApellido(request.getApellido().trim());
        trabajador.setEspecialidad(valorOBlanco(request.getEspecialidad()));
        trabajador.setActivo(true);
        trabajador.setEstado("ACTIVO");
        trabajadorRepository.save(trabajador);
    }

    private CategoriaServicio buscarCategoriaVisual(Integer peluqueriaId, Integer id, String nombre) {
        if (id != null && id > 0) {
            CategoriaServicio encontrada = categoriaServicioRepository
                    .findByIdAndPeluqueriaId(id, peluqueriaId)
                    .orElse(null);
            if (encontrada != null) {
                return encontrada;
            }
        }
        return categoriaServicioRepository
                .findByPeluqueriaIdAndNombreIgnoreCase(peluqueriaId, nombre)
                .orElseGet(CategoriaServicio::new);
    }

    private Integer convertirDuracionAMinutos(String duracion) {
        if (duracion == null || duracion.isBlank()) {
            return 45;
        }

        String texto = duracion.toLowerCase(Locale.ROOT).trim();
        int total = 0;

        if (texto.contains("h")) {
            String parteHoras = texto.substring(0, texto.indexOf('h')).trim();
            String[] tokens = parteHoras.split(" ");
            try {
                total += Integer.parseInt(tokens[tokens.length - 1]) * 60;
            } catch (NumberFormatException ignored) {
                total += 60;
            }
        }

        String soloNumeros = texto.replaceAll("[^0-9 ]", " ").trim();
        if (!soloNumeros.isBlank()) {
            String[] numeros = soloNumeros.split("\\s+");
            try {
                if (texto.contains("h") && numeros.length > 1) {
                    total += Integer.parseInt(numeros[numeros.length - 1]);
                } else if (!texto.contains("h")) {
                    total = Integer.parseInt(numeros[0]);
                }
            } catch (NumberFormatException ignored) {
                // Se usa el valor por defecto al final.
            }
        }

        return total > 0 ? total : 45;
    }

    private String imagenCatalogo(Peluqueria peluqueria) {
        if (noVacio(peluqueria.getPortadaImagen())) {
            return peluqueria.getPortadaImagen();
        }
        return valorOBlanco(peluqueria.getImagenLogo());
    }

    private String requerido(String valor, String mensaje) {
        if (valor == null || valor.isBlank()) {
            throw new RuntimeException(mensaje);
        }
        return valor.trim();
    }

    private String valorOBlanco(String valor) {
        return valor == null ? "" : valor;
    }

    private boolean noVacio(String valor) {
        return valor != null && !valor.isBlank();
    }

    private String clave(String texto) {
        return texto == null ? "" : texto.trim().toLowerCase(Locale.ROOT);
    }
}
