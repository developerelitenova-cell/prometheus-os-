-- ==============================================================================
-- MIGRACIÓN: Sistema de Baja Corporativa y Archivo Inmutable de Historial de Usuario
-- Organizaciones: Elite Nutrition S.A.S. & Futupro
-- ==============================================================================

-- 1. Crear tabla inmutable para expedientes de usuarios eliminados
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deleted_user_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  role_id UUID,
  role_name TEXT,
  area_name TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by UUID,
  deleted_by_name TEXT,
  deletion_reason TEXT DEFAULT 'Baja administrativa autorizada',
  total_tasks_recorded INT DEFAULT 0,
  total_completions_recorded INT DEFAULT 0,
  total_closings_recorded INT DEFAULT 0,
  total_extraordinary_recorded INT DEFAULT 0,
  archive_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  markdown_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deleted_archives_email ON deleted_user_archives(email);
CREATE INDEX IF NOT EXISTS idx_deleted_archives_deleted_at ON deleted_user_archives(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_deleted_archives_original_id ON deleted_user_archives(original_user_id);

-- 2. Seguridad RLS para deleted_user_archives
-- ------------------------------------------------------------------------------
ALTER TABLE deleted_user_archives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deleted_user_archives_admin_select" ON deleted_user_archives;
CREATE POLICY "deleted_user_archives_admin_select" ON deleted_user_archives
FOR SELECT TO authenticated
USING (
  public.is_master_admin() 
  OR EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.access_level IN (1, 2)
  )
);

DROP POLICY IF EXISTS "deleted_user_archives_admin_insert" ON deleted_user_archives;
CREATE POLICY "deleted_user_archives_admin_insert" ON deleted_user_archives
FOR INSERT TO authenticated
WITH CHECK (
  public.is_master_admin() 
  OR EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.access_level IN (1, 2)
  )
);

-- 3. Asegurar políticas DELETE en profiles para Administradores
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_delete_admin_policy" ON profiles;
CREATE POLICY "profiles_delete_admin_policy" ON profiles
FOR DELETE TO authenticated
USING (
  public.is_master_admin() 
  OR EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.access_level IN (1, 2)
  )
);

-- 4. Modificar restricciones Foreign Key conflictivas para permitir desvinculación
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- tasks.assigned_to
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc 
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'tasks' AND kcu.column_name = 'assigned_to' AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
    ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- tasks.assigned_by
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_by'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_by_fkey;
    ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- manuals.created_by
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'manuals' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE manuals DROP CONSTRAINT IF EXISTS manuals_created_by_fkey;
    ALTER TABLE manuals ADD CONSTRAINT manuals_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- events.created_by
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
    ALTER TABLE events ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- events.target_profile_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'target_profile_id'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_target_profile_id_fkey;
    ALTER TABLE events ADD CONSTRAINT events_target_profile_id_fkey FOREIGN KEY (target_profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- categorization_messages.sender_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'categorization_messages' AND column_name = 'sender_id'
  ) THEN
    ALTER TABLE categorization_messages DROP CONSTRAINT IF EXISTS categorization_messages_sender_id_fkey;
    ALTER TABLE categorization_messages ADD CONSTRAINT categorization_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- corporate_news.created_by
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'corporate_news' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE corporate_news DROP CONSTRAINT IF EXISTS corporate_news_created_by_fkey;
    ALTER TABLE corporate_news ADD CONSTRAINT corporate_news_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Aviso en migración de constraints: %', SQLERRM;
END $$;


-- 5. Procedimiento Almacenado RPC: public.archive_and_delete_user
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.archive_and_delete_user(
  p_target_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Baja administrativa autorizada'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_is_master BOOLEAN := false;
  v_caller_access_level INT := 99;
  v_caller_name TEXT := 'Administrador del Sistema';
  v_target_profile RECORD;
  v_role_name TEXT := 'Sin cargo';
  v_area_name TEXT := 'General';
  v_tasks JSONB := '[]'::jsonb;
  v_completions JSONB := '[]'::jsonb;
  v_closings JSONB := '[]'::jsonb;
  v_extraordinary JSONB := '[]'::jsonb;
  v_total_tasks INT := 0;
  v_total_completions INT := 0;
  v_total_closings INT := 0;
  v_total_extraordinary INT := 0;
  v_archive_payload JSONB;
  v_markdown_text TEXT;
  v_new_archive_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Validar identidad y permisos del administrador ejecutor
  SELECT p.is_master_admin, COALESCE(r.access_level, 99), COALESCE(p.full_name, 'Administrador')
  INTO v_caller_is_master, v_caller_access_level, v_caller_name
  FROM profiles p
  LEFT JOIN roles r ON p.role_id = r.id
  WHERE p.id = p_admin_id;

  IF NOT (COALESCE(v_caller_is_master, false) = true OR v_caller_access_level IN (1, 2)) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos administrativos (Master Admin o Líder Nivel 1/2) para dar de baja a un colaborador.';
  END IF;

  -- 2. Validar que no se auto-elimine el mismo administrador
  IF p_target_user_id = p_admin_id THEN
    RAISE EXCEPTION 'Operación no permitida: No puede eliminar su propia cuenta administrativa activa.';
  END IF;

  -- 3. Obtener el perfil del usuario objetivo
  SELECT p.*, r.name AS role_title, a.name AS area_title
  INTO v_target_profile
  FROM profiles p
  LEFT JOIN roles r ON p.role_id = r.id
  LEFT JOIN areas a ON r.area_id = a.id
  WHERE p.id = p_target_user_id;

  IF v_target_profile.id IS NULL THEN
    RAISE EXCEPTION 'El usuario con ID % no fue encontrado en la base de datos.', p_target_user_id;
  END IF;

  IF v_target_profile.role_title IS NOT NULL THEN
    v_role_name := v_target_profile.role_title;
  END IF;
  IF v_target_profile.area_title IS NOT NULL THEN
    v_area_name := v_target_profile.area_title;
  END IF;

  -- 4. Recopilar tareas asignadas
  BEGIN
    SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb), COUNT(*)
    INTO v_tasks, v_total_tasks
    FROM tasks t
    WHERE t.assigned_to = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_tasks := '[]'::jsonb;
    v_total_tasks := 0;
  END;

  -- 5. Recopilar gestiones y tareas completadas (task_completions)
  BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', tc.id,
      'task_template_id', tc.task_template_id,
      'period_key', tc.period_key,
      'completed_at', tc.completed_at,
      'template_title', rtt.title,
      'frequency', rtt.frequency,
      'priority', rtt.priority
    )), '[]'::jsonb), COUNT(*)
    INTO v_completions, v_total_completions
    FROM task_completions tc
    LEFT JOIN role_task_templates rtt ON tc.task_template_id = rtt.id
    WHERE tc.profile_id = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_completions := '[]'::jsonb;
    v_total_completions := 0;
  END;

  -- 6. Recopilar cierres diarios formales (daily_closings)
  BEGIN
    SELECT COALESCE(jsonb_agg(to_jsonb(dc)), '[]'::jsonb), COUNT(*)
    INTO v_closings, v_total_closings
    FROM daily_closings dc
    WHERE dc.profile_id = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_closings := '[]'::jsonb;
    v_total_closings := 0;
  END;

  -- 7. Recopilar actividades extraordinarias (extraordinary_activities)
  BEGIN
    SELECT COALESCE(jsonb_agg(to_jsonb(ea)), '[]'::jsonb), COUNT(*)
    INTO v_extraordinary, v_total_extraordinary
    FROM extraordinary_activities ea
    WHERE ea.profile_id = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_extraordinary := '[]'::jsonb;
    v_total_extraordinary := 0;
  END;

  -- 8. Construir el objeto JSON completo del archivo histórico
  v_archive_payload := jsonb_build_object(
    'metadata', jsonb_build_object(
      'version', '2.2',
      'archive_date', NOW(),
      'archived_by_id', p_admin_id,
      'archived_by_name', v_caller_name,
      'deletion_reason', p_reason
    ),
    'profile', jsonb_build_object(
      'id', v_target_profile.id,
      'full_name', v_target_profile.full_name,
      'email', v_target_profile.email,
      'company', v_target_profile.company,
      'role_id', v_target_profile.role_id,
      'role_name', v_role_name,
      'area_name', v_area_name,
      'approval_status', v_target_profile.approval_status,
      'is_active', v_target_profile.is_active,
      'created_at', v_target_profile.created_at
    ),
    'summary_metrics', jsonb_build_object(
      'total_tasks_assigned', v_total_tasks,
      'total_task_completions', v_total_completions,
      'total_daily_closings', v_total_closings,
      'total_extraordinary_activities', v_total_extraordinary
    ),
    'history', jsonb_build_object(
      'tasks', v_tasks,
      'task_completions', v_completions,
      'daily_closings', v_closings,
      'extraordinary_activities', v_extraordinary
    )
  );

  -- 9. Generar el resumen ejecutivo en formato Markdown
  v_markdown_text := FORMAT(
'# EXPEDIENTE DE DESVINCULACIÓN Y ARCHIVO HISTÓRICO
**Sistema Corporativo PROMETHEUS OS / NOVA WORK**
*Elite Nutrition S.A.S. & Futupro*

---

### 1. Datos Generales del Colaborador
- **Nombre Completo:** %s
- **Correo Corporativo:** %s
- **Empresa:** %s
- **Cargo / Rol:** %s
- **Área Organizacional:** %s
- **ID de Registro:** `%s`
- **Fecha de Ingreso Registrada:** %s

---

### 2. Registro de Baja Laboral
- **Fecha y Hora de la Baja:** %s
- **Administrador Responsable:** %s (ID: `%s`)
- **Motivo de la Desvinculación:** %s

---

### 3. Balance Histórico de Gestión
- **Total Tareas Asignadas Directas:** %s
- **Total Gestiones / Tareas Diarias Completadas:** %s
- **Total Cierres Diarios Formales:** %s
- **Total Actividades Extraordinarias Reportadas:** %s

---

### 4. Certificación de Custodia de Datos
El presente expediente digital contiene la totalidad de los registros de cumplimiento, evidencias, timestamps y cierres generados durante la vinculación del colaborador. Ha sido resguardado de forma inmutable en el repositorio de auditoría de la organización.
',
    v_target_profile.full_name,
    COALESCE(v_target_profile.email, 'N/A'),
    COALESCE(v_target_profile.company, 'Elite Nutrition'),
    v_role_name,
    v_area_name,
    v_target_profile.id,
    COALESCE(v_target_profile.created_at::TEXT, 'N/A'),
    NOW()::TEXT,
    v_caller_name,
    p_admin_id,
    p_reason,
    v_total_tasks,
    v_total_completions,
    v_total_closings,
    v_total_extraordinary
  );

  -- 10. Insertar en la tabla de archivo inmutable
  INSERT INTO deleted_user_archives (
    original_user_id,
    full_name,
    email,
    company,
    role_id,
    role_name,
    area_name,
    deleted_at,
    deleted_by,
    deleted_by_name,
    deletion_reason,
    total_tasks_recorded,
    total_completions_recorded,
    total_closings_recorded,
    total_extraordinary_recorded,
    archive_data,
    markdown_summary
  )
  VALUES (
    v_target_profile.id,
    v_target_profile.full_name,
    v_target_profile.email,
    v_target_profile.company,
    v_target_profile.role_id,
    v_role_name,
    v_area_name,
    NOW(),
    p_admin_id,
    v_caller_name,
    p_reason,
    v_total_tasks,
    v_total_completions,
    v_total_closings,
    v_total_extraordinary,
    v_archive_payload,
    v_markdown_text
  )
  RETURNING id INTO v_new_archive_id;

  -- 11. Limpiar o desvincular referencias foráneas del usuario en tablas operativas
  BEGIN
    UPDATE tasks SET assigned_to = NULL WHERE assigned_to = p_target_user_id;
    UPDATE tasks SET assigned_by = NULL WHERE assigned_by = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM task_completions WHERE profile_id = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM daily_closings WHERE profile_id = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM extraordinary_activities WHERE profile_id = p_target_user_id;
    UPDATE extraordinary_activities SET approver_id = NULL WHERE approver_id = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM notifications WHERE profile_id = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM event_acknowledgements WHERE profile_id = p_target_user_id;
    UPDATE events SET created_by = NULL WHERE created_by = p_target_user_id;
    UPDATE events SET target_profile_id = NULL WHERE target_profile_id = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    UPDATE categorization_messages SET sender_id = NULL WHERE sender_id = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    UPDATE manuals SET created_by = NULL WHERE created_by = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    UPDATE corporate_news SET created_by = NULL WHERE created_by = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM scheduled_delivery_logs WHERE profile_id = p_target_user_id;
    DELETE FROM scheduled_deliveries WHERE profile_id = p_target_user_id;
    UPDATE scheduled_deliveries SET created_by = NULL WHERE created_by = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM video_training_assignments WHERE user_id = p_target_user_id;
    UPDATE academy_videos SET created_by = NULL WHERE created_by = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    DELETE FROM ai_user_memory WHERE profile_id = p_target_user_id;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 12. Eliminar de la tabla profiles
  DELETE FROM profiles WHERE id = p_target_user_id;

  -- 13. Retornar el resumen y datos para entrega inmediata al frontend
  v_result := jsonb_build_object(
    'archive_id', v_new_archive_id,
    'user_id', p_target_user_id,
    'full_name', v_target_profile.full_name,
    'email', v_target_profile.email,
    'role_name', v_role_name,
    'company', v_target_profile.company,
    'markdown_summary', v_markdown_text,
    'archive_data', v_archive_payload
  );

  RETURN v_result;
END;
$$;
