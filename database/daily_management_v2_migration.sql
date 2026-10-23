-- ==============================================================================
-- MIGRACIÓN v2.2.0: Gestión Diaria, Auditoría Master, Trazabilidad y Cierre Formal
-- Organizaciones: Elite Nutrition S.A.S. & Futupro
-- ==============================================================================

-- 1. Ampliación de role_task_templates (Memoria del Cargo)
-- ------------------------------------------------------------------------------
ALTER TABLE role_task_templates 
ADD COLUMN IF NOT EXISTS start_time TIME WITHOUT TIME ZONE DEFAULT '08:00:00';

ALTER TABLE role_task_templates 
ADD COLUMN IF NOT EXISTS end_time TIME WITHOUT TIME ZONE DEFAULT '08:30:00';

ALTER TABLE role_task_templates 
ADD COLUMN IF NOT EXISTS sequence_order INT NOT NULL DEFAULT 1;

ALTER TABLE role_task_templates 
ADD COLUMN IF NOT EXISTS evidence_requirement VARCHAR(20) NOT NULL DEFAULT 'none';

DO $$
BEGIN
  ALTER TABLE role_task_templates DROP CONSTRAINT IF EXISTS role_task_templates_evidence_req_check;
  ALTER TABLE role_task_templates ADD CONSTRAINT role_task_templates_evidence_req_check 
    CHECK (evidence_requirement IN ('none', 'text_only', 'photo_required'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_role_task_templates_seq 
ON role_task_templates(role_id, sequence_order, start_time);


-- 2. Tabla de Cierres Formales de Gestión Diaria (daily_closings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_closings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_key VARCHAR(10) NOT NULL, -- Formato 'YYYY-MM-DD'
  total_tasks INT NOT NULL DEFAULT 0,
  completed_tasks INT NOT NULL DEFAULT 0,
  unfulfilled_tasks INT NOT NULL DEFAULT 0,
  extraordinary_tasks INT NOT NULL DEFAULT 0,
  compliance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_hash TEXT,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'closed' CHECK (status IN ('closed', 'certified', 'audited')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_daily_closings_profile_date ON daily_closings(profile_id, period_key);
CREATE INDEX IF NOT EXISTS idx_daily_closings_date ON daily_closings(period_key);


-- 3. Tabla de Actividades Extraordinarias con Aprobación (extraordinary_activities)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS extraordinary_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_key VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  approver_type VARCHAR(20) NOT NULL CHECK (approver_type IN ('leader', 'presidency')),
  approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  evidence_text TEXT,
  evidence_photo TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending_approval' 
    CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extraordinary_activities_profile ON extraordinary_activities(profile_id, period_key);
CREATE INDEX IF NOT EXISTS idx_extraordinary_activities_status ON extraordinary_activities(status, approver_type);


-- 4. Seguridad RLS
-- ------------------------------------------------------------------------------
ALTER TABLE daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraordinary_activities ENABLE ROW LEVEL SECURITY;

-- Políticas para daily_closings
DROP POLICY IF EXISTS "daily_closings_select_policy" ON daily_closings;
CREATE POLICY "daily_closings_select_policy" ON daily_closings
FOR SELECT TO authenticated
USING (
  auth.uid() = profile_id 
  OR public.is_master_admin() 
  OR (public.is_leader() AND profile_id IN (
    SELECT p.id FROM profiles p 
    JOIN roles r ON p.role_id = r.id 
    WHERE r.area_id = public.current_area_id()
  ))
);

DROP POLICY IF EXISTS "daily_closings_insert_policy" ON daily_closings;
CREATE POLICY "daily_closings_insert_policy" ON daily_closings
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = profile_id 
  OR public.is_master_admin()
);

DROP POLICY IF EXISTS "daily_closings_update_policy" ON daily_closings;
CREATE POLICY "daily_closings_update_policy" ON daily_closings
FOR UPDATE TO authenticated
USING (public.is_master_admin())
WITH CHECK (public.is_master_admin());

-- Políticas para extraordinary_activities
DROP POLICY IF EXISTS "extraordinary_activities_select" ON extraordinary_activities;
CREATE POLICY "extraordinary_activities_select" ON extraordinary_activities
FOR SELECT TO authenticated
USING (
  auth.uid() = profile_id
  OR public.is_master_admin()
  OR (public.is_leader() AND approver_type = 'leader' AND profile_id IN (
    SELECT p.id FROM profiles p 
    JOIN roles r ON p.role_id = r.id 
    WHERE r.area_id = public.current_area_id()
  ))
);

DROP POLICY IF EXISTS "extraordinary_activities_insert" ON extraordinary_activities;
CREATE POLICY "extraordinary_activities_insert" ON extraordinary_activities
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "extraordinary_activities_update" ON extraordinary_activities;
CREATE POLICY "extraordinary_activities_update" ON extraordinary_activities
FOR UPDATE TO authenticated
USING (
  public.is_master_admin()
  OR (public.is_leader() AND approver_type = 'leader' AND profile_id IN (
    SELECT p.id FROM profiles p 
    JOIN roles r ON p.role_id = r.id 
    WHERE r.area_id = public.current_area_id()
  ))
)
WITH CHECK (
  public.is_master_admin()
  OR (public.is_leader() AND approver_type = 'leader')
);


-- 5. Bucket de Almacenamiento y Permisos de Videos en Nova Academy
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy_videos', 
  'academy_videos', 
  true, 
  524288000,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 524288000;

DROP POLICY IF EXISTS "academy_videos_read_all" ON storage.objects;
CREATE POLICY "academy_videos_read_all"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'academy_videos');

DROP POLICY IF EXISTS "academy_videos_insert_admin" ON storage.objects;
CREATE POLICY "academy_videos_insert_admin"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academy_videos' 
    AND (public.is_master_admin() OR public.can_manage_academy())
  );


-- 6. Usuario Test Sandbox y Rutina de Homologación
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_area_id UUID;
  v_role_id UUID;
  v_user_id UUID;
BEGIN
  -- 1. Obtener o crear Área de Sistemas/Operaciones
  SELECT id INTO v_area_id FROM areas WHERE name ILIKE '%Sistemas%' OR name ILIKE '%Operaciones%' LIMIT 1;
  IF v_area_id IS NULL THEN
    INSERT INTO areas (id, name, description)
    VALUES (gen_random_uuid(), 'Auditoría y Sistemas', 'Área técnica para pruebas y control de calidad')
    RETURNING id INTO v_area_id;
  END IF;

  -- 2. Crear o actualizar Cargo de Prueba (la tabla roles usa 'objective', no 'description')
  SELECT id INTO v_role_id FROM roles WHERE name = 'Analista de Pruebas Sandbox' LIMIT 1;
  IF v_role_id IS NULL THEN
    INSERT INTO roles (id, name, area_id, access_level, objective)
    VALUES (gen_random_uuid(), 'Analista de Pruebas Sandbox', v_area_id, 3, 'Cargo de homologación para validar mejoras operativas')
    RETURNING id INTO v_role_id;
  END IF;

  -- 3. Plantillas de tareas del cargo para pruebas
  DELETE FROM role_task_templates WHERE role_id = v_role_id;

  INSERT INTO role_task_templates 
    (role_id, title, description, frequency, priority, start_time, end_time, sequence_order, evidence_requirement)
  VALUES
    (v_role_id, '1. Inspección de Puesto y Apertura de Terminales', 'Verificar conectividad a internet y encendido de periféricos', 'daily', 'medium', '06:10', '06:30', 1, 'none'),
    (v_role_id, '2. Verificación de Inventario de Despachos en Bodega', 'Cruzar planillas de pedidos con existencias físicas', 'daily', 'high', '06:30', '08:00', 2, 'photo_required'),
    (v_role_id, '3. Conciliación y Registro de Planillas de Facturación', 'Digitar guías despachadas en el sistema contable', 'daily', 'high', '08:00', '10:00', 3, 'text_only'),
    (v_role_id, '4. Auditoría de Calidad y Atención de Novedades', 'Revisar reclamos de clientes y roturas en empaque', 'daily', 'medium', '10:00', '12:00', 4, 'photo_required'),
    (v_role_id, '5. Cierre Operativo y Entrega de Turno', 'Asegurar instalaciones, apagado de máquinas y reporte a líder', 'daily', 'high', '12:00', '13:00', 5, 'none');

  -- 4. Usuario en auth.users y profiles
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'test.operativo@elitenutrition.com' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    BEGIN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'test.operativo@elitenutrition.com',
        crypt('Pruebas2026*', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Usuario de Pruebas Sandbox"}',
        NOW(),
        NOW()
      ) RETURNING id INTO v_user_id;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;
  END IF;

  -- Si el usuario auth existe o se creó, asociarlo a profiles
  IF v_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, full_name, role_id, is_master_admin, can_manage_academy, approval_status)
    VALUES (
      v_user_id,
      'Usuario de Pruebas Sandbox',
      v_role_id,
      false,
      true,
      'approved'
    )
    ON CONFLICT (id) DO UPDATE SET 
      full_name = 'Usuario de Pruebas Sandbox',
      role_id = v_role_id,
      approval_status = 'approved';
  END IF;

END $$;
