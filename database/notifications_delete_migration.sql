-- ============================================================
-- Permite borrar notificaciones del Canal de Notificaciones.
--
-- La tabla `notifications` tenía política de SELECT/INSERT/UPDATE
-- (auth_access_control_migration.sql) pero nunca de DELETE, así que el botón
-- de borrar en el frontend fallaría silenciosamente contra RLS. Esto agrega
-- esa política: cada quien borra sus propias notificaciones, o el admin
-- master cualquiera.
--
-- (Los mensajes del líder/empresa en categorization_messages NO se borran de
-- la base de datos -- son una fila compartida por todo un rol/área, así que
-- "eliminar" uno de esos en el frontend solo lo oculta para ese usuario,
-- guardado en localStorage. No requiere cambios de RLS.)
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.
-- ============================================================

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated
  USING (auth.uid() = profile_id OR is_master_admin());
