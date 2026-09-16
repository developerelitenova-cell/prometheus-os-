-- ============================================================
-- Migración: Foto de Verificación de Identidad y Avatar
-- Permite almacenar la fotografía de verificación capturada
-- por el colaborador en su primer ingreso a PROMETHEUS OS.
-- ============================================================

-- 1. Añadir columnas de fotografía de verificación y avatar a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_photo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Asegurar que las políticas RLS permitan al usuario actualizar su propia foto
-- (La política 'profiles_update' en auth_access_control_migration.sql ya cubre auth.uid() = id).
