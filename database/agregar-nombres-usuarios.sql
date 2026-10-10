-- Ejecutar completo en Supabase SQL Editor.
-- Agrega campos opcionales y completa nombres sin alterar roles o contraseñas.
BEGIN;

ALTER TABLE public.mg_usuario
  ADD COLUMN IF NOT EXISTS nombres varchar,
  ADD COLUMN IF NOT EXISTS apaterno varchar,
  ADD COLUMN IF NOT EXISTS amaterno varchar;

LOCK TABLE public.mg_usuario, public.mg_docente IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT id_usuario FROM public.mg_docente
    WHERE id_usuario IS NOT NULL
    GROUP BY id_usuario HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay usuarios vinculados a varios docentes. Revisa la vinculación antes de copiar nombres.';
  END IF;
END $$;

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

COMMIT;

SELECT id_usuario, usuario, correo, nombres, apaterno, amaterno,
       concat_ws(' ', nombres, apaterno, amaterno) AS nombre_completo
FROM public.mg_usuario
ORDER BY apaterno NULLS LAST, amaterno NULLS LAST, nombres NULLS LAST;
