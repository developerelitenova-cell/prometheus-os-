-- Autenticación real + control de acceso por roles + candado de mapeo con auditoría.
--
-- Contexto: hasta ahora la app corría 100% con la clave "anon" (sin login real),
-- así que cualquiera con la URL entraba a cualquier vista (incluido el Oráculo),
-- y tuvimos que abrir RLS a "anon" como parche temporal (fix_anon_rls_policies.sql).
-- Este script reemplaza ese parche por políticas reales basadas en auth.uid(),
-- ahora que el login sí existe (frontend/backend actualizados junto con esto).
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.

-- ============================================================
-- 1. NUEVAS COLUMNAS EN PROFILES
-- ============================================================

-- Admin Master: acceso total, único perfil que puede ver el Oráculo.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_master_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Candado de onboarding: una vez que la persona completa su entrevista de
-- mapeo de flujo, esto pasa a TRUE y no vuelve a ver esa información.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mapping_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 2. AUDITORÍA DEL PROCESO DE MAPEO (para revisión de ciberseguridad)
-- ============================================================

CREATE TABLE IF NOT EXISTS mapping_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('file_uploaded', 'workflow_saved')),
  file_name TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE mapping_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. FUNCIONES AUXILIARES PARA LAS POLÍTICAS RLS
-- ============================================================

CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT p.is_master_admin FROM profiles p WHERE p.id = auth.uid()), FALSE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Nivel de acceso (1 Ejecutivo, 2 Área, 3 Individual) del cargo de quien llama.
CREATE OR REPLACE FUNCTION current_access_level()
RETURNS INTEGER AS $$
  SELECT r.access_level
  FROM profiles p
  JOIN roles r ON r.id = p.role_id
  WHERE p.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_leader()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(current_access_level() IN (1, 2), FALSE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_role_id()
RETURNS UUID AS $$
  SELECT role_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_area_id()
RETURNS UUID AS $$
  SELECT r.area_id FROM profiles p JOIN roles r ON r.id = p.role_id WHERE p.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 4. REEMPLAZO DE POLÍTICAS "anon" POR POLÍTICAS REALES (auth.uid())
-- ============================================================

-- --- PROFILES ---
DROP POLICY IF EXISTS "Enable read access for anon on profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR is_master_admin() OR is_leader())
  WITH CHECK (auth.uid() = id OR is_master_admin() OR is_leader());
-- Las cuentas se crean desde el backend (Service Role, se salta RLS) -- no hace falta policy de INSERT aquí.

-- --- TASKS ---
DROP POLICY IF EXISTS "Enable read access for anon on tasks" ON tasks;
DROP POLICY IF EXISTS "Enable read access for user tasks" ON tasks;
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated
  USING (auth.uid() = assigned_to OR is_master_admin() OR is_leader());

DROP POLICY IF EXISTS "Enable update for tasks" ON tasks;
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated
  USING (auth.uid() = assigned_to OR is_master_admin() OR is_leader())
  WITH CHECK (auth.uid() = assigned_to OR is_master_admin() OR is_leader());

DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated
  WITH CHECK (is_master_admin() OR is_leader());

-- --- NOTIFICATIONS ---
DROP POLICY IF EXISTS "Enable read access for anon on notifications" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = profile_id OR is_master_admin());

DROP POLICY IF EXISTS "Enable insert for notifications" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated
  WITH CHECK (is_master_admin() OR is_leader() OR auth.uid() = profile_id);

DROP POLICY IF EXISTS "Enable update for notifications" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = profile_id OR is_master_admin())
  WITH CHECK (auth.uid() = profile_id OR is_master_admin());

-- --- CATEGORIZATION_MESSAGES (mensajes del líder / la empresa) ---
DROP POLICY IF EXISTS "Enable read for categorization_messages" ON categorization_messages;
CREATE POLICY "categorization_messages_select" ON categorization_messages FOR SELECT TO authenticated
  USING (
    is_master_admin()
    OR is_leader()
    OR target_role_id = current_role_id()
    OR target_area_id = current_area_id()
  );

DROP POLICY IF EXISTS "categorization_messages_insert" ON categorization_messages;
CREATE POLICY "categorization_messages_insert" ON categorization_messages FOR INSERT TO authenticated
  WITH CHECK (is_master_admin() OR is_leader());

-- --- EVENTS / EVENT_ACKNOWLEDGEMENTS (comunicados obligatorios) ---
DROP POLICY IF EXISTS "Enable read access for events" ON events;
CREATE POLICY "events_select" ON events FOR SELECT TO authenticated
  USING (
    is_master_admin()
    OR is_leader()
    OR target_level = 'company'
    OR (target_level = 'area' AND target_area_id = current_area_id())
    OR (target_level = 'worker' AND target_profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "events_insert" ON events;
CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated
  WITH CHECK (is_master_admin() OR is_leader());

DROP POLICY IF EXISTS "Enable read/insert for event_acknowledgements" ON event_acknowledgements;
CREATE POLICY "event_acknowledgements_all" ON event_acknowledgements FOR ALL TO authenticated
  USING (auth.uid() = profile_id OR is_master_admin())
  WITH CHECK (auth.uid() = profile_id OR is_master_admin());

-- --- MANUALS ---
DROP POLICY IF EXISTS "Enable read access for anon on manuals" ON manuals;
DROP POLICY IF EXISTS "Enable read access for authenticated users on manuals" ON manuals;
CREATE POLICY "manuals_select" ON manuals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "manuals_insert" ON manuals;
CREATE POLICY "manuals_insert" ON manuals FOR INSERT TO authenticated
  WITH CHECK (is_master_admin() OR is_leader());

-- --- ROLE_WORKFLOWS: el candado real del mapeo ---
-- Lectura: cualquiera autenticado (DataHub, GraphPanel, etc. la necesitan visible).
-- Escritura: SOLO la persona dueña de ese rol Y mientras no haya completado su
-- mapeo todavía -- o un admin master. Así el candado no depende solo del
-- frontend/router, también lo aplica la base de datos.
DROP POLICY IF EXISTS "Enable public access for role_workflows" ON role_workflows;
CREATE POLICY "role_workflows_select" ON role_workflows FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_workflows_write" ON role_workflows FOR ALL TO authenticated
  USING (
    is_master_admin()
    OR (current_role_id() = role_workflows.role_id AND NOT COALESCE((SELECT mapping_completed FROM profiles WHERE id = auth.uid()), TRUE))
  )
  WITH CHECK (
    is_master_admin()
    OR (current_role_id() = role_workflows.role_id AND NOT COALESCE((SELECT mapping_completed FROM profiles WHERE id = auth.uid()), TRUE))
  );

-- --- MAPPING_AUDIT_LOG ---
CREATE POLICY "mapping_audit_log_insert" ON mapping_audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "mapping_audit_log_select" ON mapping_audit_log FOR SELECT TO authenticated
  USING (is_master_admin());
