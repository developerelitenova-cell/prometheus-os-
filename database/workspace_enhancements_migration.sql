-- ==============================================================================
-- MIGRACIÓN: Optimizaciones de "Mi Portal" (Evidencias Explícitas y Reporte a Jefe)
-- Plataforma Nova Work
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.
-- ==============================================================================

-- 1. Columna evidence_requirement en tasks y scheduled_deliveries
-- ------------------------------------------------------------------------------
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS evidence_requirement VARCHAR(20) NOT NULL DEFAULT 'none';

DO $$
BEGIN
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_evidence_req_check;
  ALTER TABLE tasks ADD CONSTRAINT tasks_evidence_req_check
    CHECK (evidence_requirement IN ('none', 'text_only', 'photo_required'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE scheduled_deliveries
  ADD COLUMN IF NOT EXISTS evidence_requirement VARCHAR(20) NOT NULL DEFAULT 'none';

DO $$
BEGIN
  ALTER TABLE scheduled_deliveries DROP CONSTRAINT IF EXISTS scheduled_deliveries_evidence_req_check;
  ALTER TABLE scheduled_deliveries ADD CONSTRAINT scheduled_deliveries_evidence_req_check
    CHECK (evidence_requirement IN ('none', 'text_only', 'photo_required'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. RPC SECURITY DEFINER para envío de reporte formal al jefe inmediato
--    Permite que cualquier colaborador autenticado notifique a su supervisor
--    incluso cuando RLS restringe inserts directos en notifications.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_supervisor_report(
  p_supervisor_id UUID,
  p_employee_name TEXT,
  p_role_name TEXT,
  p_date_str TEXT,
  p_compliance NUMERIC,
  p_completed INT,
  p_total INT,
  p_unfulfilled INT DEFAULT 0,
  p_export_format TEXT DEFAULT 'pdf',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID;
  v_message TEXT;
  v_action_url TEXT;
  v_metadata JSONB;
  v_notif_id UUID;
BEGIN
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Autenticación requerida para enviar reporte al supervisor';
  END IF;

  IF p_supervisor_id IS NULL THEN
    RAISE EXCEPTION 'El identificador del supervisor es obligatorio';
  END IF;

  v_action_url := '/workspace?view_as=' || v_sender_id::text;

  v_message := format(
    'Reporte operativo de %s (%s) · Jornada %s: %s%% cumplimiento (%s/%s completadas%s). Formato: %s.%s',
    COALESCE(NULLIF(trim(p_employee_name), ''), 'Colaborador'),
    COALESCE(NULLIF(trim(p_role_name), ''), 'Cargo Operativo'),
    COALESCE(NULLIF(trim(p_date_str), ''), TO_CHAR(NOW() AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD')),
    COALESCE(p_compliance, 0),
    COALESCE(p_completed, 0),
    COALESCE(p_total, 0),
    CASE WHEN COALESCE(p_unfulfilled, 0) > 0 THEN format(', %s no ejecutadas', p_unfulfilled) ELSE '' END,
    UPPER(COALESCE(NULLIF(trim(p_export_format), ''), 'pdf')),
    CASE WHEN p_notes IS NOT NULL AND length(trim(p_notes)) > 0 THEN ' Obs: ' || trim(p_notes) ELSE '' END
  );

  v_metadata := jsonb_build_object(
    'kind', 'supervisor_daily_report',
    'employee_id', v_sender_id,
    'employee_name', p_employee_name,
    'role_name', p_role_name,
    'date_str', p_date_str,
    'compliance_percentage', p_compliance,
    'completed_tasks', p_completed,
    'total_tasks', p_total,
    'unfulfilled_tasks', p_unfulfilled,
    'export_format', p_export_format,
    'notes', p_notes
  );

  BEGIN
    INSERT INTO notifications (profile_id, type, message, action_url, is_read, metadata)
    VALUES (p_supervisor_id, 'message', v_message, v_action_url, false, v_metadata)
    RETURNING id INTO v_notif_id;
  EXCEPTION
    WHEN undefined_column THEN
      INSERT INTO notifications (profile_id, type, message, action_url, is_read)
      VALUES (p_supervisor_id, 'message', v_message, v_action_url, false)
      RETURNING id INTO v_notif_id;
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'notification_id', v_notif_id,
    'supervisor_id', p_supervisor_id,
    'action_url', v_action_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.notify_supervisor_report(UUID, TEXT, TEXT, TEXT, NUMERIC, INT, INT, INT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_supervisor_report(UUID, TEXT, TEXT, TEXT, NUMERIC, INT, INT, INT, TEXT, TEXT) TO authenticated;

-- 3. Tabla de Anotaciones del Calendario (calendar_notes) - Día, Semana y Mes
--    Permite colocar anotaciones importantes por fecha con visibilidad personal,
--    de área o de empresa. Idempotente.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  note_date DATE NOT NULL,
  scope VARCHAR(10) NOT NULL DEFAULT 'day' CHECK (scope IN ('day', 'week', 'month')),
  category VARCHAR(20) NOT NULL DEFAULT 'nova' CHECK (category IN ('nova', 'important', 'meeting', 'reminder')),
  visibility VARCHAR(15) NOT NULL DEFAULT 'personal' CHECK (visibility IN ('personal', 'area', 'company')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_notes_date
  ON public.calendar_notes(note_date);

CREATE INDEX IF NOT EXISTS idx_calendar_notes_profile_date
  ON public.calendar_notes(profile_id, note_date);

CREATE INDEX IF NOT EXISTS idx_calendar_notes_scope_date
  ON public.calendar_notes(scope, note_date);

ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_notes_select_policy" ON public.calendar_notes;
CREATE POLICY "calendar_notes_select_policy" ON public.calendar_notes
  FOR SELECT TO authenticated
  USING (
    auth.uid() = profile_id
    OR visibility = 'company'
    OR (visibility = 'area' AND area_id IS NOT NULL AND area_id = public.current_area_id())
    OR public.is_master_admin()
    OR public.is_leader()
  );

DROP POLICY IF EXISTS "calendar_notes_insert_policy" ON public.calendar_notes;
CREATE POLICY "calendar_notes_insert_policy" ON public.calendar_notes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "calendar_notes_update_policy" ON public.calendar_notes;
CREATE POLICY "calendar_notes_update_policy" ON public.calendar_notes
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = profile_id
    OR public.is_master_admin()
  )
  WITH CHECK (
    auth.uid() = profile_id
    OR public.is_master_admin()
  );

DROP POLICY IF EXISTS "calendar_notes_delete_policy" ON public.calendar_notes;
CREATE POLICY "calendar_notes_delete_policy" ON public.calendar_notes
  FOR DELETE TO authenticated
  USING (
    auth.uid() = profile_id
    OR public.is_master_admin()
  );
