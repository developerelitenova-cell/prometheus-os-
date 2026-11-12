
-- ==============================================================================
-- MIGRACIÓN: Recordatorios de Vencimiento, Notificaciones de Eventos y Calendario
-- Requisitos 2.1, 2.2, 2.3 y 2.6 - Plataforma Nova Work
-- Zona horaria operativa: America/Bogota (UTC-5)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.
-- ==============================================================================

-- 1. Ampliación de la tabla NOTIFICATIONS
-- ------------------------------------------------------------------------------
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'manual_update',
    'new_task',
    'task_assigned',
    'due_reminder',
    'overdue_alert',
    'role_updated',
    'system_alert',
    'message',
    'new_registration'
  ));

-- 2. Tabla de Cola de Recordatorios Programados (task_reminders) - Req. 2.1
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('48h', '24h', '2h', 'immediate')),
  trigger_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  sent_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (task_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_task_reminders_pending
  ON task_reminders(status, trigger_at);

CREATE INDEX IF NOT EXISTS idx_task_reminders_task_id
  ON task_reminders(task_id);

CREATE INDEX IF NOT EXISTS idx_task_reminders_profile_id
  ON task_reminders(profile_id);

ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_reminders_select" ON task_reminders;
CREATE POLICY "task_reminders_select" ON task_reminders
  FOR SELECT TO authenticated
  USING (
    auth.uid() = profile_id
    OR public.is_master_admin()
    OR public.is_leader()
  );

DROP POLICY IF EXISTS "task_reminders_insert" ON task_reminders;
CREATE POLICY "task_reminders_insert" ON task_reminders
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_master_admin()
    OR public.is_leader()
    OR auth.uid() = profile_id
  );

DROP POLICY IF EXISTS "task_reminders_update" ON task_reminders;
CREATE POLICY "task_reminders_update" ON task_reminders
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = profile_id
    OR public.is_master_admin()
    OR public.is_leader()
  )
  WITH CHECK (
    auth.uid() = profile_id
    OR public.is_master_admin()
    OR public.is_leader()
  );

DROP POLICY IF EXISTS "task_reminders_delete" ON task_reminders;
CREATE POLICY "task_reminders_delete" ON task_reminders
  FOR DELETE TO authenticated
  USING (
    public.is_master_admin()
    OR public.is_leader()
    OR auth.uid() = profile_id
  );

-- 3. Tabla de Auditoría de Cambios de Cargo (role_change_audit_logs) - Req. 2.6
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_change_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_change_audit_profile
  ON role_change_audit_logs(profile_id, created_at DESC);

ALTER TABLE role_change_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_change_audit_select" ON role_change_audit_logs;
CREATE POLICY "role_change_audit_select" ON role_change_audit_logs
  FOR SELECT TO authenticated
  USING (
    auth.uid() = profile_id
    OR public.is_master_admin()
    OR public.is_leader()
  );

DROP POLICY IF EXISTS "role_change_audit_insert" ON role_change_audit_logs;
CREATE POLICY "role_change_audit_insert" ON role_change_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_master_admin()
    OR public.is_leader()
  );

