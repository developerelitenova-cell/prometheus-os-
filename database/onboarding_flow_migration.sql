-- Onboarding: pantalla de bienvenida post-aprobación + notificación a líderes
-- cuando alguien se registra desde el enlace del cargo.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.

-- ============================================================
-- 1. WELCOME_SEEN: candado para mostrar la bienvenida una sola vez,
--    justo después de que a la persona le aprueban el acceso.
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_seen BOOLEAN NOT NULL DEFAULT FALSE;

-- Los perfiles que ya existían antes de esta migración (aprobados o admins)
-- no deben ver la bienvenida retroactivamente.
UPDATE profiles SET welcome_seen = TRUE
WHERE welcome_seen = FALSE AND (is_master_admin OR approval_status = 'approved');

-- ============================================================
-- 2. Nuevo tipo de notificación: 'new_registration'
-- ============================================================
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('manual_update', 'new_task', 'system_alert', 'message', 'new_registration'));

-- ============================================================
-- 3. TRIGGER: al registrarse alguien (queda 'pending'), se notifica a:
--    - el admin master
--    - los líderes de nivel 1 (ejecutivos/corporativos, ven todo)
--    - los líderes de nivel 2 cuya área coincide con la del cargo solicitado
--    Corre con privilegios del dueño de la función (SECURITY DEFINER) para
--    no depender de las políticas RLS de "notifications" desde el cliente.
-- ============================================================
CREATE OR REPLACE FUNCTION notify_leaders_new_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_role_name TEXT;
  v_area_id UUID;
  v_message TEXT;
BEGIN
  IF NEW.approval_status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT r.name, r.area_id INTO v_role_name, v_area_id
  FROM roles r WHERE r.id = NEW.role_id;

  v_message := COALESCE(NEW.full_name, 'Alguien') || ' solicitó acceso'
    || CASE WHEN v_role_name IS NOT NULL THEN ' para el cargo ' || v_role_name ELSE '' END
    || '.';

  INSERT INTO notifications (profile_id, type, message, action_url)
  SELECT p.id, 'new_registration', v_message, '/team'
  FROM profiles p
  LEFT JOIN roles r ON r.id = p.role_id
  WHERE p.id <> NEW.id
    AND (
      p.is_master_admin
      OR r.access_level = 1
      OR (r.access_level = 2 AND v_area_id IS NOT NULL AND r.area_id = v_area_id)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_leaders_new_registration ON profiles;
CREATE TRIGGER trg_notify_leaders_new_registration
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_leaders_new_registration();
