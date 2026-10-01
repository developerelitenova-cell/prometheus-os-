-- ============================================================
-- PROMETHEUS OS / NOVA WORK - Migración: Foto de Verificación
-- Asegura las columnas de fotografía facial y avatar en la tabla profiles
-- ============================================================

-- 1. Agregar columnas si no existen
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_photo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_seen BOOLEAN DEFAULT FALSE;

-- 2. Asegurar que las políticas de RLS permitan al usuario actualizar su propio perfil
DO $$
BEGIN
  -- Verificar política de actualización
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'profiles_self_update'
  ) THEN
    CREATE POLICY "profiles_self_update" ON profiles 
      FOR UPDATE TO authenticated 
      USING (auth.uid() = id) 
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 3. Notificar que el esquema está sincronizado
COMMENT ON COLUMN profiles.verification_photo IS 'Fotografía de rostro capturada en la activación del perfil corporativo';
