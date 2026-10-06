-- ====================================================================
-- MIGRACIÓN: División de Empresas Corporativas (Elite Nutrition & Futupro)
-- ====================================================================

-- 1. Agregar columna company a profiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT DEFAULT 'Elite Nutrition';

-- 2. Asignar 'Futupro' a los colaboradores cuyo correo corporativo o rol corresponda a Futupro
UPDATE profiles 
SET company = 'Futupro' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%@futupro.com%' OR email ILIKE '%futupro%'
);

-- Asegurar que el resto quede explícitamente en 'Elite Nutrition'
UPDATE profiles 
SET company = 'Elite Nutrition' 
WHERE company IS NULL;
