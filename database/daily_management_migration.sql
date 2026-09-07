-- ============================================================
-- Gestión Diaria: la memoria del cargo pasa a tener su propia lista de
-- tareas (diarias/semanales/mensuales), separada de la asignación manual
-- 1 a 1 que hacía el líder desde el Panel de Liderazgo.
--
-- Antes: LeaderDashboard.vue creaba una fila en `tasks` por persona por
-- tarea, y una vez marcada como completada quedaba así para siempre (no
-- servía como checklist recurrente).
--
-- Ahora: el líder define la lista de tareas del CARGO una sola vez
-- (role_task_templates -- la "memoria del cargo"), y cada empleado con
-- ese cargo la ve y la marca cada día/semana/mes. El marcado se guarda
-- en task_completions con un `period_key` (la fecha del día, el lunes de
-- la semana, o el año-mes), así que la casilla se ve vacía de nuevo en
-- el siguiente período sin borrar el historial de cumplimiento.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.
-- ============================================================

-- ============================================================
-- 1. MEMORIA DEL CARGO: plantillas de tareas por rol
-- ============================================================

CREATE TABLE IF NOT EXISTS role_task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS role_task_templates_role_id_idx ON role_task_templates(role_id);

-- ============================================================
-- 2. CUMPLIMIENTO: qué empleado marcó qué tarea, en qué período
-- ============================================================

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_template_id UUID NOT NULL REFERENCES role_task_templates(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- 'YYYY-MM-DD' del día (diaria), 'YYYY-MM-DD' del lunes de esa semana
  -- (semanal), o 'YYYY-MM' (mensual). Calculado en el frontend.
  period_key TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (task_template_id, profile_id, period_key)
);

CREATE INDEX IF NOT EXISTS task_completions_profile_period_idx ON task_completions(profile_id, period_key);

-- ============================================================
-- 3. RLS
-- ============================================================

ALTER TABLE role_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Lectura de la memoria del cargo: admin (todo), líder (los cargos de su
-- área) o el propio dueño del cargo -- mismo criterio que role_workflows_select.
DROP POLICY IF EXISTS "role_task_templates_select" ON role_task_templates;
CREATE POLICY "role_task_templates_select" ON role_task_templates FOR SELECT TO authenticated
  USING (
    is_master_admin()
    OR (is_leader() AND role_id IN (SELECT id FROM roles WHERE area_id = current_area_id()))
    OR current_role_id() = role_id
  );

-- Escritura: admin, o líder del área dueña de ese cargo (agrega/edita/desactiva
-- las tareas de Gestión Diaria de su equipo). Un empleado normal no puede
-- editar su propia memoria de cargo.
DROP POLICY IF EXISTS "role_task_templates_write" ON role_task_templates;
CREATE POLICY "role_task_templates_write" ON role_task_templates FOR ALL TO authenticated
  USING (
    is_master_admin()
    OR (is_leader() AND role_id IN (SELECT id FROM roles WHERE area_id = current_area_id()))
  )
  WITH CHECK (
    is_master_admin()
    OR (is_leader() AND role_id IN (SELECT id FROM roles WHERE area_id = current_area_id()))
  );

-- task_completions: cada quien marca lo suyo; admin y líderes pueden ver
-- el cumplimiento de su equipo (para el Panel de Liderazgo).
DROP POLICY IF EXISTS "task_completions_select" ON task_completions;
CREATE POLICY "task_completions_select" ON task_completions FOR SELECT TO authenticated
  USING (auth.uid() = profile_id OR is_master_admin() OR is_leader());

DROP POLICY IF EXISTS "task_completions_insert" ON task_completions;
CREATE POLICY "task_completions_insert" ON task_completions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id OR is_master_admin());

DROP POLICY IF EXISTS "task_completions_delete" ON task_completions;
CREATE POLICY "task_completions_delete" ON task_completions FOR DELETE TO authenticated
  USING (auth.uid() = profile_id OR is_master_admin());
