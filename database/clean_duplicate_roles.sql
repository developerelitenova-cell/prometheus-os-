-- ==============================================================================
-- LIMPIEZA DE ROLES Y VÍNCULOS DUPLICADOS EN BASE DE DATOS
-- Ejecutar en Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Eliminar vínculos duplicados en kpi_role_template_links (conservando 1 por template y role)
DELETE FROM kpi_role_template_links
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY template_id, role_id ORDER BY id ASC) as rnum
    FROM kpi_role_template_links
  ) t
  WHERE t.rnum > 1
);

-- 2. Identificar y reasignar perfiles que apunten a roles duplicados
-- Si existen dos roles con el mismo nombre y la misma área:
DO $$
DECLARE
  dup RECORD;
  canonical_id UUID;
BEGIN
  FOR dup IN
    SELECT LOWER(TRIM(name)) as clean_name, area_id, COUNT(*)
    FROM roles
    GROUP BY LOWER(TRIM(name)), area_id
    HAVING COUNT(*) > 1
  LOOP
    -- Tomar el primer id como canónico
    SELECT id INTO canonical_id
    FROM roles
    WHERE LOWER(TRIM(name)) = dup.clean_name AND (area_id = dup.area_id OR (area_id IS NULL AND dup.area_id IS NULL))
    ORDER BY created_at ASC
    LIMIT 1;

    -- Reasignar profiles al canónico
    UPDATE profiles
    SET role_id = canonical_id
    WHERE role_id IN (
      SELECT id FROM roles
      WHERE LOWER(TRIM(name)) = dup.clean_name AND (area_id = dup.area_id OR (area_id IS NULL AND dup.area_id IS NULL))
      AND id <> canonical_id
    );

    -- Reasignar role_workflows
    UPDATE role_workflows
    SET role_id = canonical_id
    WHERE role_id IN (
      SELECT id FROM roles
      WHERE LOWER(TRIM(name)) = dup.clean_name AND (area_id = dup.area_id OR (area_id IS NULL AND dup.area_id IS NULL))
      AND id <> canonical_id
    );

    -- Reasignar kpi_role_template_links
    UPDATE kpi_role_template_links
    SET role_id = canonical_id
    WHERE role_id IN (
      SELECT id FROM roles
      WHERE LOWER(TRIM(name)) = dup.clean_name AND (area_id = dup.area_id OR (area_id IS NULL AND dup.area_id IS NULL))
      AND id <> canonical_id
    );

    -- Eliminar los roles redundantes
    DELETE FROM roles
    WHERE LOWER(TRIM(name)) = dup.clean_name AND (area_id = dup.area_id OR (area_id IS NULL AND dup.area_id IS NULL))
    AND id <> canonical_id;
  END LOOP;
END $$;
