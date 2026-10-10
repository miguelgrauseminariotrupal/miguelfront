-- Solo consulta la estructura: no modifica usuarios, roles ni permisos.
-- Ejecutar en Supabase SQL Editor y compartir el resultado.
SELECT jsonb_pretty(jsonb_build_object(
  'columnas', (
    SELECT jsonb_agg(to_jsonb(c) ORDER BY c.table_name, c.ordinal_position)
    FROM (
      SELECT table_name, ordinal_position, column_name, data_type,
             is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (table_name LIKE 'mg_%' OR table_name LIKE 'test_%')
    ) c
  ),
  'relaciones', (
    SELECT jsonb_agg(to_jsonb(c))
    FROM (
      SELECT conrelid::regclass::text AS tabla, conname AS nombre,
             pg_get_constraintdef(oid) AS definicion
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
        AND contype IN ('f', 'u', 'p')
    ) c
  ),
  'politicas', (
    SELECT jsonb_agg(to_jsonb(p)) FROM pg_policies p
    WHERE schemaname = 'public'
  ),
  'rls', (
    SELECT jsonb_agg(to_jsonb(t))
    FROM (
      SELECT relname AS tabla, relrowsecurity AS rls_activo,
             relforcerowsecurity AS rls_forzado
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
    ) t
  )
)) AS estructura;
