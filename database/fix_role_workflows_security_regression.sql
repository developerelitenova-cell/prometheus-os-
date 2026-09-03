-- ============================================================
-- URGENTE: revierte una regresión de seguridad en role_workflows.
--
-- security_rls_migration.sql (corrido por la sesión paralela) agregó
-- la política "Enable access for authenticated on role_workflows"
-- FOR ALL TO authenticated USING (true) -- es decir, CUALQUIER usuario
-- logueado puede leer y escribir el mapeo de CUALQUIER cargo.
--
-- Postgres combina políticas RLS permisivas con OR, así que esa
-- política anulaba por completo el candado real que ya existía
-- (auth_access_control_migration.sql: "role_workflows_write",
-- que solo permite al dueño del cargo sin mapear todavía, o al
-- admin master). Este archivo elimina esa política permisiva y deja
-- únicamente el candado correcto.
-- ============================================================

DROP POLICY IF EXISTS "Enable access for authenticated on role_workflows" ON role_workflows;

-- Confirmación: estas dos deben ser las ÚNICAS políticas que queden en
-- role_workflows después de correr esto (ya existen, no se tocan):
--   role_workflows_select  FOR SELECT TO authenticated USING (true)
--   role_workflows_write   FOR ALL    TO authenticated
--     USING (is_master_admin() OR (dueño del cargo sin mapear))
