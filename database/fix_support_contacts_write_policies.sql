-- support_contacts solo tenia politica de lectura (setup_chat.sql). Para
-- poder editar el directorio desde la interfaz (SupportContactsManager.vue)
-- hacen falta las politicas de escritura, restringidas a lideres (nivel 1/2)
-- y Admin Master -- igual que el resto de las herramientas de gestion
-- (ManualsManager, RolePermissionManager, etc).
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.

DROP POLICY IF EXISTS "support_contacts_insert" ON public.support_contacts;
CREATE POLICY "support_contacts_insert" ON public.support_contacts FOR INSERT TO authenticated
  WITH CHECK (is_master_admin() OR is_leader());

DROP POLICY IF EXISTS "support_contacts_update" ON public.support_contacts;
CREATE POLICY "support_contacts_update" ON public.support_contacts FOR UPDATE TO authenticated
  USING (is_master_admin() OR is_leader())
  WITH CHECK (is_master_admin() OR is_leader());

DROP POLICY IF EXISTS "support_contacts_delete" ON public.support_contacts;
CREATE POLICY "support_contacts_delete" ON public.support_contacts FOR DELETE TO authenticated
  USING (is_master_admin() OR is_leader());
