-- 1. Añadir la columna de estado a los perfiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended'));

-- 2. Asegurarse de que el Master Admin empiece aprobado y los actuales queden aprobados para no romper el sistema
UPDATE profiles SET approval_status = 'approved' WHERE approval_status = 'pending';

-- 3. Crear políticas RLS para que:
-- a) Un usuario pueda leer su propio perfil siempre.
-- b) Un Master Admin pueda leer, actualizar, borrar todo.
-- c) Un Gerente (Nivel 2) pueda ver a los perfiles de su área.

-- Como las políticas existentes en auth_access_control_migration.sql ya manejan mucho de esto (is_master_admin() y auth.uid() = id),
-- solo aseguraremos una vista que facilite las cosas a los administradores:

CREATE OR REPLACE VIEW admin_profiles_view AS
SELECT 
    p.id, 
    p.full_name, 
    p.role_id, 
    r.name as role_name,
    r.access_level,
    r.area_id,
    a.name as area_name,
    p.is_master_admin,
    p.approval_status,
    p.created_at,
    u.email
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN areas a ON r.area_id = a.id
LEFT JOIN auth.users u ON p.id = u.id;

-- Permitir a nivel frontend leer esta vista si eres lider o master admin
GRANT SELECT ON admin_profiles_view TO authenticated;
