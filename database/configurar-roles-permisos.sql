-- Ejecutar completo en Supabase SQL Editor.
-- Las cuentas Auth deben existir. No crea cuentas Auth ni cambia contraseñas.
-- Configura el catálogo y las asignaciones. NO instala políticas RLS.
-- El backend debe comprobar permiso de submenú Y alcance del grado.
BEGIN;

LOCK TABLE public.mg_rol, public.mg_permiso,
  public.mg_usuario_rol, public.mg_rol_permiso,
  public.mg_usuario, public.mg_docente IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE public.mg_usuario
  ADD COLUMN IF NOT EXISTS nombres varchar,
  ADD COLUMN IF NOT EXISTS apaterno varchar,
  ADD COLUMN IF NOT EXISTS amaterno varchar;

DO $
BEGIN
  IF EXISTS (
    SELECT codigo FROM public.mg_rol
    WHERE codigo IN ('ADMIN', 'DOCENTE')
    GROUP BY codigo HAVING count(*) > 1
  ) OR EXISTS (
    SELECT p.codigo FROM public.mg_permiso p
    WHERE p.codigo IN ('INICIO', 'ASISTENCIA', 'CALIFICACIONES', 'AGENTE_ACADEMICO', 'REGISTRO_CLASES', 'MATRICULA', 'DOCENTES', 'ALUMNOS', 'CURSOS', 'ASIGNAR_CURSOS', 'PLAN_EVALUACION', 'CONFIGURACION')
    GROUP BY p.codigo HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay códigos duplicados de roles o permisos. Corregir antes de continuar.';
  END IF;
END $$;

UPDATE public.mg_rol
SET nombre = CASE codigo WHEN 'ADMIN' THEN 'Administrador' ELSE 'Docente' END,
    descripcion = CASE codigo
      WHEN 'ADMIN' THEN 'Acceso a todos los módulos y grados.'
      ELSE 'Asistencia y calificaciones del grado asignado; chatbot con el mismo alcance.' END,
    estado = true
WHERE codigo IN ('ADMIN', 'DOCENTE');

INSERT INTO public.mg_rol (codigo, nombre, descripcion, estado)
SELECT v.codigo, v.nombre, v.descripcion, true
FROM (VALUES
 ('ADMIN', 'Administrador', 'Acceso a todos los módulos y grados.'),
 ('DOCENTE', 'Docente', 'Asistencia y calificaciones del grado asignado; chatbot con el mismo alcance.')
) AS v(codigo, nombre, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM public.mg_rol r WHERE r.codigo = v.codigo);

-- Crear o actualizar los permisos sin depender de tablas temporales.
DO $$
DECLARE
  v_submenu record;
BEGIN
  FOR v_submenu IN
    SELECT * FROM (VALUES
 ('INICIO', 'Inicio', 'Principal', '/inicio'),
 ('ASISTENCIA', 'Asistencia', 'Principal', '/asistencia'),
 ('CALIFICACIONES', 'Calificaciones', 'Principal', '/evaluaciones/calificaciones'),
 ('AGENTE_ACADEMICO', 'Agente académico', 'Principal', '/agente-miguel'),
 ('REGISTRO_CLASES', 'Registro de clases', 'Administración', '/programacion'),
 ('MATRICULA', 'Matrícula', 'Administración', '/matricula'),
 ('DOCENTES', 'Docentes', 'Administración', '/docentes'),
 ('ALUMNOS', 'Alumnos', 'Administración', '/alumnos'),
 ('CURSOS', 'Cursos', 'Administración', '/cursos'),
 ('ASIGNAR_CURSOS', 'Asignar cursos', 'Administración', '/generar-matricula-curso'),
 ('PLAN_EVALUACION', 'Plan de evaluación', 'Administración', '/evaluaciones/configuracion'),
 ('CONFIGURACION', 'Configuración', 'Administración', '/configuracion')
    ) AS s(codigo, nombre, modulo, ruta)
  LOOP
    UPDATE public.mg_permiso p
    SET nombre = v_submenu.nombre, modulo = v_submenu.modulo,
        descripcion = v_submenu.nombre || ' (' || v_submenu.ruta || ')',
        estado = true
    WHERE p.codigo = v_submenu.codigo;
    IF NOT FOUND THEN
      INSERT INTO public.mg_permiso (codigo, nombre, modulo, descripcion, estado)
      VALUES (v_submenu.codigo, v_submenu.nombre, v_submenu.modulo,
              v_submenu.nombre || ' (' || v_submenu.ruta || ')', true);
    END IF;
  END LOOP;
END $$;

-- Docente: exactamente tres permisos. Admin: todos los permisos activos.
UPDATE public.mg_rol_permiso rp SET estado = false
FROM public.mg_rol r WHERE rp.id_rol = r.id_rol AND r.codigo IN ('ADMIN', 'DOCENTE');

UPDATE public.mg_rol_permiso rp SET estado = true
FROM public.mg_rol r, public.mg_permiso p
WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
  AND r.estado = true AND p.estado = true
  AND (r.codigo = 'ADMIN' OR (r.codigo = 'DOCENTE'
       AND p.codigo IN ('ASISTENCIA', 'CALIFICACIONES', 'AGENTE_ACADEMICO')));

INSERT INTO public.mg_rol_permiso (id_rol, id_permiso, estado)
SELECT r.id_rol, p.id_permiso, true
FROM public.mg_rol r CROSS JOIN public.mg_permiso p
WHERE r.estado = true AND p.estado = true
  AND (r.codigo = 'ADMIN' OR (r.codigo = 'DOCENTE'
       AND p.codigo IN ('ASISTENCIA', 'CALIFICACIONES', 'AGENTE_ACADEMICO')))
  AND NOT EXISTS (SELECT 1 FROM public.mg_rol_permiso rp
                  WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso);

-- Vincular las cuentas existentes y asignar un único rol a cada una.
DO $$
DECLARE
  v_dni text;
  v_correo text;
  v_auth_id uuid;
  v_hash text;
  v_usuario integer;
  v_usuario_docente integer;
  v_docente integer;
  v_auth_actual uuid;
  v_rol integer;
  v_cantidad integer;
BEGIN
  FOREACH v_dni IN ARRAY ARRAY[
    '40131700', '18881985', '19026480', '17846975',
    '18067827', '17829277', '70375812', 'hugo.flores'
  ] LOOP
    -- Eloy Gonzalo Alva Calderon: 70375812@miguelgrau.com (solo ADMIN).
    -- Hugo Flores Rodriguez: hugo.flores@escuela.pe (solo ADMIN).
    v_correo := CASE WHEN v_dni = 'hugo.flores'
      THEN 'hugo.flores@escuela.pe' ELSE v_dni || '@miguelgrau.com' END;
    v_usuario_docente := NULL;
    v_docente := NULL;

    SELECT id, encrypted_password INTO v_auth_id, v_hash
    FROM auth.users WHERE lower(email) = v_correo;
    IF v_auth_id IS NULL THEN
      RAISE EXCEPTION 'Primero crea la cuenta Auth %. Se cancelan todos los cambios.', v_correo;
    END IF;

    IF v_dni NOT IN ('70375812', 'hugo.flores') THEN
      SELECT count(*) INTO v_cantidad
      FROM public.mg_docente WHERE trim(dni::text) = v_dni;
      IF v_cantidad <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un docente con DNI %; se encontraron %.', v_dni, v_cantidad;
      END IF;
      SELECT id_docente, id_usuario INTO v_docente, v_usuario_docente
      FROM public.mg_docente WHERE trim(dni::text) = v_dni;
    END IF;

    SELECT count(*) INTO v_cantidad FROM public.mg_usuario
    WHERE auth_id = v_auth_id OR lower(correo) = v_correo
       OR usuario IN (v_dni, v_correo) OR id_usuario = v_usuario_docente;
    IF v_cantidad > 1 THEN
      RAISE EXCEPTION 'Hay varios usuarios para %. Revisa los duplicados.', v_correo;
    END IF;

    SELECT id_usuario, auth_id INTO v_usuario, v_auth_actual
    FROM public.mg_usuario
    WHERE auth_id = v_auth_id OR lower(correo) = v_correo
       OR usuario IN (v_dni, v_correo) OR id_usuario = v_usuario_docente;

    IF v_auth_actual IS NOT NULL AND v_auth_actual <> v_auth_id THEN
      RAISE EXCEPTION 'El usuario % está vinculado a otra cuenta Auth.', v_correo;
    END IF;
    IF v_docente IS NOT NULL AND v_usuario IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.mg_docente
      WHERE id_usuario = v_usuario AND id_docente <> v_docente
    ) THEN
      RAISE EXCEPTION 'El usuario % ya pertenece a otro docente.', v_correo;
    END IF;

    IF v_usuario IS NULL THEN
      INSERT INTO public.mg_usuario (usuario, correo, password_hash, auth_id, estado)
      VALUES (v_correo, v_correo, v_hash, v_auth_id, true)
      RETURNING id_usuario INTO v_usuario;
    ELSE
      UPDATE public.mg_usuario SET auth_id = v_auth_id, correo = v_correo
      WHERE id_usuario = v_usuario;
    END IF;

    IF v_docente IS NOT NULL THEN
      UPDATE public.mg_docente SET id_usuario = v_usuario WHERE id_docente = v_docente;
    END IF;

    SELECT id_rol INTO v_rol FROM public.mg_rol
    WHERE codigo = CASE WHEN v_dni IN ('70375812', 'hugo.flores') THEN 'ADMIN' ELSE 'DOCENTE' END;
    UPDATE public.mg_usuario_rol SET estado = false WHERE id_usuario = v_usuario;
    UPDATE public.mg_usuario_rol SET estado = true
    WHERE id_usuario = v_usuario AND id_rol = v_rol;
    IF NOT FOUND THEN
      INSERT INTO public.mg_usuario_rol (id_usuario, id_rol, estado)
      VALUES (v_usuario, v_rol, true);
    END IF;
  END LOOP;
END $$;

DO $
BEGIN
  IF EXISTS (
    SELECT id_usuario FROM public.mg_docente
    WHERE id_usuario IS NOT NULL
    GROUP BY id_usuario HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay usuarios vinculados a varios docentes. Revisa la vinculación antes de copiar nombres.';
  END IF;
END $;

-- Copia inicial: completa los campos vacíos de todos los docentes vinculados.
-- Los valores ya registrados en mg_usuario se conservan al repetir el script.
UPDATE public.mg_usuario u
SET nombres = COALESCE(NULLIF(trim(u.nombres), ''), NULLIF(trim(d.nombres), '')),
    apaterno = COALESCE(NULLIF(trim(u.apaterno), ''), NULLIF(trim(d.apellido_paterno), '')),
    amaterno = COALESCE(NULLIF(trim(u.amaterno), ''), NULLIF(trim(d.apellido_materno), ''))
FROM public.mg_docente d
WHERE d.id_usuario = u.id_usuario;

UPDATE public.mg_usuario
SET nombres = 'Hugo', apaterno = 'Flores', amaterno = 'Rodriguez'
WHERE lower(correo) = 'hugo.flores@escuela.pe'
   OR lower(usuario) = 'hugo.flores@escuela.pe';

UPDATE public.mg_usuario
SET nombres = 'Eloy Gonzalo', apaterno = 'Alva', amaterno = 'Calderon'
WHERE lower(correo) = '70375812@miguelgrau.com'
   OR usuario IN ('70375812', '70375812@miguelgrau.com');


-- Helpers para solicitudes autenticadas con el JWT del usuario.
-- No reciben un id_usuario del cliente: usan auth.uid().
CREATE OR REPLACE FUNCTION public.mg_puede_acceder_submenu(p_codigo text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mg_usuario u
    JOIN public.mg_usuario_rol ur ON ur.id_usuario = u.id_usuario AND ur.estado = true
    JOIN public.mg_rol r ON r.id_rol = ur.id_rol AND r.estado = true
    JOIN public.mg_rol_permiso rp ON rp.id_rol = r.id_rol AND rp.estado = true
    JOIN public.mg_permiso p ON p.id_permiso = rp.id_permiso AND p.estado = true
    WHERE u.auth_id = auth.uid() AND u.estado = true AND p.codigo = p_codigo
  );
$$;

CREATE OR REPLACE FUNCTION public.mg_puede_ver_grado(p_id_grado integer)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mg_usuario u
    JOIN public.mg_usuario_rol ur ON ur.id_usuario = u.id_usuario AND ur.estado = true
    JOIN public.mg_rol r ON r.id_rol = ur.id_rol AND r.estado = true
    WHERE u.auth_id = auth.uid() AND u.estado = true
      AND (r.codigo = 'ADMIN' OR (r.codigo = 'DOCENTE' AND EXISTS (
        SELECT 1 FROM public.mg_docente d
        JOIN public.mg_programacion_seccion ps ON ps.id_docente_responsable = d.id_docente
        JOIN public.mg_seccion s ON s.id_seccion = ps.id_seccion AND s.estado = true
        JOIN public.mg_grado g ON g.id_grado = s.id_grado
        JOIN public.mg_nivel n ON n.id_nivel = g.id_nivel AND n.estado = true
        JOIN public.mg_anio_lectivo a ON a.id_anio_lectivo = n.id_anio_lectivo AND a.estado = true
        WHERE d.id_usuario = u.id_usuario AND d.estado = true AND s.id_grado = p_id_grado
      )))
  );
$$;

REVOKE ALL ON FUNCTION public.mg_puede_acceder_submenu(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mg_puede_ver_grado(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mg_puede_acceder_submenu(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mg_puede_ver_grado(integer) TO authenticated;

COMMIT;

-- Verificar todos los permisos activos de cada rol.
SELECT r.codigo AS rol, r.nombre AS nombre_rol,
       p.codigo AS permiso, p.nombre AS submenu, p.modulo
FROM public.mg_rol r
JOIN public.mg_rol_permiso rp ON rp.id_rol = r.id_rol AND rp.estado = true
JOIN public.mg_permiso p ON p.id_permiso = rp.id_permiso AND p.estado = true
WHERE r.estado = true AND r.codigo IN ('ADMIN', 'DOCENTE')
ORDER BY r.codigo, p.modulo, p.nombre;

-- Verificar los roles activos de las ocho cuentas.
SELECT u.correo, u.nombres, u.apaterno, u.amaterno,
       concat_ws(' ', u.nombres, u.apaterno, u.amaterno) AS nombre,
       u.estado AS usuario_activo, r.codigo AS rol
FROM public.mg_usuario u
JOIN public.mg_usuario_rol ur ON ur.id_usuario = u.id_usuario AND ur.estado = true
JOIN public.mg_rol r ON r.id_rol = ur.id_rol AND r.estado = true
WHERE lower(u.correo) IN (
 '40131700@miguelgrau.com', '18881985@miguelgrau.com',
 '19026480@miguelgrau.com', '17846975@miguelgrau.com',
 '18067827@miguelgrau.com', '17829277@miguelgrau.com',
 '70375812@miguelgrau.com', 'hugo.flores@escuela.pe'
)
ORDER BY u.correo;
