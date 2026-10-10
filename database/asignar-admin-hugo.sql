-- Ejecutar completo en Supabase SQL Editor.
-- Cambia solamente los roles de hugo.flores@escuela.pe.
BEGIN;

DO $$
DECLARE
  v_usuario integer;
  v_rol integer;
  v_cantidad integer;
BEGIN
  SELECT count(*) INTO v_cantidad
  FROM public.mg_usuario
  WHERE lower(correo) = 'hugo.flores@escuela.pe'
     OR lower(usuario) = 'hugo.flores@escuela.pe';

  IF v_cantidad <> 1 THEN
    RAISE EXCEPTION 'Debe existir exactamente un mg_usuario para hugo.flores@escuela.pe; se encontraron %.', v_cantidad;
  END IF;

  SELECT id_usuario INTO v_usuario
  FROM public.mg_usuario
  WHERE lower(correo) = 'hugo.flores@escuela.pe'
     OR lower(usuario) = 'hugo.flores@escuela.pe'
  FOR UPDATE;

  SELECT count(*) INTO v_cantidad
  FROM public.mg_rol WHERE codigo = 'ADMIN' AND estado = true;
  IF v_cantidad <> 1 THEN
    RAISE EXCEPTION 'Debe existir exactamente un rol ADMIN activo. Ejecuta primero el script de roles y permisos.';
  END IF;

  SELECT id_rol INTO v_rol
  FROM public.mg_rol WHERE codigo = 'ADMIN' AND estado = true;

  UPDATE public.mg_usuario_rol
  SET estado = false WHERE id_usuario = v_usuario;

  UPDATE public.mg_usuario_rol
  SET estado = true
  WHERE id_usuario = v_usuario AND id_rol = v_rol;

  IF NOT FOUND THEN
    INSERT INTO public.mg_usuario_rol (id_usuario, id_rol, estado)
    VALUES (v_usuario, v_rol, true);
  END IF;
END $$;

COMMIT;

SELECT u.correo, u.estado AS usuario_activo, r.codigo AS rol
FROM public.mg_usuario u
JOIN public.mg_usuario_rol ur ON ur.id_usuario = u.id_usuario AND ur.estado = true
JOIN public.mg_rol r ON r.id_rol = ur.id_rol AND r.estado = true
WHERE lower(u.correo) = 'hugo.flores@escuela.pe'
   OR lower(u.usuario) = 'hugo.flores@escuela.pe';
