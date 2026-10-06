-- ====================================================================
-- MIGRACIÓN: Módulo de Escuela y Videos de Formación (Academia NOVA WORK)
-- ====================================================================

-- 0. Permiso específico de Encargado de la Academia en la tabla profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_manage_academy BOOLEAN DEFAULT false;

-- Función de seguridad para comprobar si el usuario puede administrar la Academia
-- (Super Admin, Colaborador con permiso can_manage_academy, o Líder/Gerente con access_level 1 o 2)
CREATE OR REPLACE FUNCTION can_manage_academy()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((
    SELECT (
      p.is_master_admin = true 
      OR p.can_manage_academy = true
      OR r.access_level IN (1, 2)
    )
    FROM profiles p
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
  ), FALSE);
$$ LANGUAGE sql SECURITY DEFINER;

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

-- 4. Políticas de Seguridad en Tablas (Row Level Security - RLS)
ALTER TABLE academy_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_progress ENABLE ROW LEVEL SECURITY;

-- academy_videos: Todos los usuarios autenticados pueden ver los videos de su alcance
DROP POLICY IF EXISTS "academy_videos_select" ON academy_videos;
CREATE POLICY "academy_videos_select" ON academy_videos
FOR SELECT TO authenticated
USING (true);

-- academy_videos: Solo Super Admin y Encargados designados pueden insertar videos
DROP POLICY IF EXISTS "academy_videos_insert" ON academy_videos;
CREATE POLICY "academy_videos_insert" ON academy_videos
FOR INSERT TO authenticated
WITH CHECK (can_manage_academy());

-- academy_videos: Solo Super Admin y Encargados designados pueden actualizar videos
DROP POLICY IF EXISTS "academy_videos_update" ON academy_videos;
CREATE POLICY "academy_videos_update" ON academy_videos
FOR UPDATE TO authenticated
USING (can_manage_academy())
WITH CHECK (can_manage_academy());

-- academy_videos: Solo Super Admin o Encargados pueden eliminar videos
DROP POLICY IF EXISTS "academy_videos_delete" ON academy_videos;
CREATE POLICY "academy_videos_delete" ON academy_videos
FOR DELETE TO authenticated
USING (can_manage_academy());

-- user_video_progress: El usuario puede ver su progreso; Super Admin y Encargados ven el progreso de todos
DROP POLICY IF EXISTS "user_video_progress_select" ON user_video_progress;
CREATE POLICY "user_video_progress_select" ON user_video_progress
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR can_manage_academy()
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


-- ====================================================================
-- 5. Bucket de Almacenamiento Dedicado para Videos MP4 de la Academia
-- ====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy_videos', 
  'academy_videos', 
  true, 
  524288000, -- Límite de 500 MB por archivo
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Políticas de Storage para academy_videos
DROP POLICY IF EXISTS "academy_videos_storage_select" ON storage.objects;
CREATE POLICY "academy_videos_storage_select" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'academy_videos');

DROP POLICY IF EXISTS "academy_videos_storage_insert" ON storage.objects;
CREATE POLICY "academy_videos_storage_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'academy_videos'
  AND can_manage_academy()
);

DROP POLICY IF EXISTS "academy_videos_storage_update" ON storage.objects;
CREATE POLICY "academy_videos_storage_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'academy_videos'
  AND can_manage_academy()
);

DROP POLICY IF EXISTS "academy_videos_storage_delete" ON storage.objects;
CREATE POLICY "academy_videos_storage_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'academy_videos'
  AND can_manage_academy()
);
