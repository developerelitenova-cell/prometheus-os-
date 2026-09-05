-- ============================================================
-- Faltaban las políticas de ESCRITURA en `roles` y `areas`.
--
-- schema.sql activó RLS en ambas tablas y solo agregó políticas de
-- SELECT ("Enable read access for authenticated/anon users"). Nunca
-- se agregó ninguna política de INSERT/UPDATE/DELETE. Postgres deniega
-- por defecto cualquier operación sin política que la permita
-- explícitamente, así que hasta ahora NADIE -- ni siquiera el Admin
-- Master -- podía cambiar el Nivel de Acceso de un cargo, ni crear un
-- área o un cargo nuevo desde /roles (RolePermissionManager.vue): la
-- pantalla y el botón funcionan, pero Supabase rechazaba el UPDATE/
-- INSERT en silencio.
--
-- /roles ya es exclusiva del Admin Master a nivel de ruta (ver
-- frontend/src/router/index.js, meta.masterAdminOnly), así que estas
-- políticas también se restringen a is_master_admin().
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.
-- ============================================================

-- --- ROLES ---
CREATE POLICY "roles_insert" ON roles FOR INSERT TO authenticated
  WITH CHECK (is_master_admin());

CREATE POLICY "roles_update" ON roles FOR UPDATE TO authenticated
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "roles_delete" ON roles FOR DELETE TO authenticated
  USING (is_master_admin());

-- --- AREAS ---
CREATE POLICY "areas_insert" ON areas FOR INSERT TO authenticated
  WITH CHECK (is_master_admin());

CREATE POLICY "areas_update" ON areas FOR UPDATE TO authenticated
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY "areas_delete" ON areas FOR DELETE TO authenticated
  USING (is_master_admin());
