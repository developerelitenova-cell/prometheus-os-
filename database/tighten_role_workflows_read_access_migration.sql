-- ============================================================
-- Restringe la LECTURA de role_workflows (antes abierta a cualquier
-- autenticado por diseño -- ver auth_access_control_migration.sql,
-- sección "ROLE_WORKFLOWS": "Lectura: cualquiera autenticado (DataHub,
-- GraphPanel, etc. la necesitan visible").
--
-- Motivo del cambio: el Mapa de Cargos (DataHub) ahora es exclusivo del
-- Admin Master en el frontend (ver frontend/src/router/index.js,
-- meta.masterAdminOnly), y GraphPanel solo lo usa el módulo de
-- Simulación Corporativa, que está deshabilitado (SIMULATION_ENABLED =
-- false en Home.vue, sin backend en ningún entorno). Ya no hay ninguna
-- pantalla real que necesite leer el mapeo de un cargo ajeno salvo el
-- admin y el líder dentro de su propia área -- pero la política seguía
-- dejando pasar a cualquier empleado que consultara la tabla
-- directamente vía API, sin pasar por la pantalla.
--
-- Nueva regla de lectura:
--   - Admin master: todos los cargos.
--   - Líder (Nivel 1 o 2): los cargos de su propia área.
--   - Cualquier otro perfil: solo el mapeo de su propio cargo.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.
-- ============================================================

DROP POLICY IF EXISTS "role_workflows_select" ON role_workflows;

CREATE POLICY "role_workflows_select" ON role_workflows FOR SELECT TO authenticated
  USING (
    is_master_admin()
    OR (
      is_leader()
      AND role_workflows.role_id IN (
        SELECT id FROM roles WHERE area_id = current_area_id()
      )
    )
    OR current_role_id() = role_workflows.role_id
  );

-- La política de escritura (role_workflows_write) no cambia: sigue
-- siendo admin, o el dueño del cargo mientras no haya completado su
-- mapeo todavía.
