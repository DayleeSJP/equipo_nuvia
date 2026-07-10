USE nuvia_db;

-- Negocios y sus propietarios
SELECT p.id AS peluqueria_id, p.nombre AS negocio, u.id AS usuario_id, u.email
FROM peluquerias p
JOIN usuarios u ON u.id = p.usuario_id
ORDER BY p.id;

-- Servicios separados por negocio
SELECT p.nombre AS negocio, s.id AS servicio_id, s.nombre AS servicio, s.precio
FROM servicios s
JOIN peluquerias p ON p.id = s.peluqueria_id
ORDER BY p.id, s.id;

-- Reservas con cliente y negocio
SELECT c.id, c.codigo_confirmacion,
       CONCAT(uc.nombre, ' ', uc.apellido) AS cliente,
       p.nombre AS negocio,
       s.nombre AS servicio,
       c.fecha, c.hora, c.estado
FROM citas c
JOIN usuarios uc ON uc.id = c.cliente_id
JOIN peluquerias p ON p.id = c.peluqueria_id
JOIN servicios s ON s.id = c.servicio_id
ORDER BY c.fecha DESC, c.hora DESC;
