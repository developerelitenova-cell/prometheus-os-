-- BUG: el auto-registro (signUp desde el enlace del cargo) nunca creaba la fila
-- en "profiles". auth_access_control_migration.sql asumía que las cuentas
-- siempre se crean desde el backend con Service Role (por eso no había policy
-- de INSERT ahí), pero el flujo de auto-registro (frontend/src/api/auth.js,
-- signUp()) inserta el perfil directamente desde el cliente recién autenticado.
-- Sin policy de INSERT, RLS bloqueaba ese insert en silencio -- el usuario de
-- auth.users se creaba, pero jamás aparecía en "Aprobaciones Pendientes"
-- porque no existía ninguna fila de profiles que aprobar.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND approval_status = 'pending'
    AND is_master_admin = FALSE
  );
