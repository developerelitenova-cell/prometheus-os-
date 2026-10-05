-- ====================================================================
-- MIGRACIÓN: Módulo de Escuela y Videos de Formación (Academia NOVA WORD)
-- ====================================================================

-- 1. Tabla de Videos de la Escuela / Academia
CREATE TABLE IF NOT EXISTS academy_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL, -- YouTube, Vimeo, OneDrive / SharePoint Stream, MP4 directo
  thumbnail_url TEXT,
  duration_minutes INT DEFAULT 0,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL, -- Si es específico de un cargo
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL, -- Si es para toda un área
  is_mandatory BOOLEAN DEFAULT false, -- Obligatorio para certificación del cargo
  sequence_order INT DEFAULT 1,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_academy_videos_role ON academy_videos(role_id);
CREATE INDEX IF NOT EXISTS idx_academy_videos_area ON academy_videos(area_id);
CREATE INDEX IF NOT EXISTS idx_academy_videos_order ON academy_videos(sequence_order);

-- 2. Tabla de Progreso y Visualización por Empleado
CREATE TABLE IF NOT EXISTS user_video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES academy_videos(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  progress_percent INT DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_user_video_progress_user ON user_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_video ON user_video_progress(video_id);

-- 3. Trigger para actualizar 'updated_at' en academy_videos
CREATE OR REPLACE FUNCTION update_academy_videos_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_academy_videos_modtime ON academy_videos;
CREATE TRIGGER trg_academy_videos_modtime
BEFORE UPDATE ON academy_videos
FOR EACH ROW EXECUTE FUNCTION update_academy_videos_modtime();

-- 4. Políticas de Seguridad (Row Level Security - RLS)
ALTER TABLE academy_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_progress ENABLE ROW LEVEL SECURITY;

-- academy_videos: Todos los usuarios autenticados pueden ver los videos
DROP POLICY IF EXISTS "academy_videos_select" ON academy_videos;
CREATE POLICY "academy_videos_select" ON academy_videos
FOR SELECT TO authenticated
USING (true);

-- academy_videos: Líderes y Administradores pueden crear videos
DROP POLICY IF EXISTS "academy_videos_insert" ON academy_videos;
CREATE POLICY "academy_videos_insert" ON academy_videos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND (p.is_master_admin = true OR r.access_level IN (1, 2))
  )
);

-- academy_videos: Líderes y Administradores pueden actualizar videos
DROP POLICY IF EXISTS "academy_videos_update" ON academy_videos;
CREATE POLICY "academy_videos_update" ON academy_videos
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND (p.is_master_admin = true OR r.access_level IN (1, 2))
  )
);

-- academy_videos: Solo Master Admin o creador puede eliminar videos
DROP POLICY IF EXISTS "academy_videos_delete" ON academy_videos;
CREATE POLICY "academy_videos_delete" ON academy_videos
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.is_master_admin = true
  )
  OR created_by = auth.uid()
);

-- user_video_progress: El usuario puede ver su progreso, y líderes pueden ver el progreso de su equipo
DROP POLICY IF EXISTS "user_video_progress_select" ON user_video_progress;
CREATE POLICY "user_video_progress_select" ON user_video_progress
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND (p.is_master_admin = true OR r.access_level IN (1, 2))
  )
);

-- user_video_progress: El usuario puede insertar o actualizar su propio progreso
DROP POLICY IF EXISTS "user_video_progress_insert" ON user_video_progress;
CREATE POLICY "user_video_progress_insert" ON user_video_progress
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_video_progress_update" ON user_video_progress;
CREATE POLICY "user_video_progress_update" ON user_video_progress
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
