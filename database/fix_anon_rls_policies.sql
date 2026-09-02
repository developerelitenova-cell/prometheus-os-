-- Fix: el Portal del Empleado (y el modal de comunicados obligatorios) no
-- muestra ningún dato -- selector de identidad vacío, checklists vacíos,
-- notificaciones vacías -- aunque las tablas SÍ tengan filas.
--
-- Causa: frontend/src/api/supabase.js crea el cliente de Supabase solo con
-- la clave "anon" (VITE_SUPABASE_ANON_KEY). La app nunca hace un login real
-- (supabase.auth.signIn...), así que el rol de Postgres visto por PostgREST
-- SIEMPRE es "anon", nunca "authenticated". Pero las políticas RLS de estas
-- tablas solo autorizan a "authenticated" (y algunas exigen
-- auth.uid() = profile_id, algo que jamás puede cumplirse sin login real).
-- Resultado: RLS oculta silenciosamente todas las filas -- no da error,
-- simplemente el cliente recibe listas vacías.
--
-- Este script agrega el acceso "anon" que falta, siguiendo el mismo patrón
-- que ya usan roles/areas/role_workflows/role_kpis en schema.sql. Es
-- idempotente (usa DROP POLICY IF EXISTS antes de recrear).
--
-- Nota de seguridad: como no hay autenticación real, la app siempre
-- confió en filtrar en el cliente (ej. profile_id en la query), igual que
-- ya hacía role_workflows con "TO public USING (true)". Este fix mantiene
-- ese mismo modelo, no introduce uno nuevo.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.

-- 1. PROFILES: el selector de "Identidad Activa" del portal
DROP POLICY IF EXISTS "Enable read access for anon on profiles" ON profiles;
CREATE POLICY "Enable read access for anon on profiles" ON profiles FOR SELECT TO anon USING (true);

-- 2. TASKS: checklists diario/semanal/mensual del portal
DROP POLICY IF EXISTS "Enable read access for anon on tasks" ON tasks;
CREATE POLICY "Enable read access for anon on tasks" ON tasks FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Enable update for tasks" ON tasks;
CREATE POLICY "Enable update for tasks" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. NOTIFICATIONS: campanita del portal (se filtra por profile_id en la app)
DROP POLICY IF EXISTS "Enable read access for authenticated users on notifications" ON notifications;
DROP POLICY IF EXISTS "Enable read access for anon on notifications" ON notifications;
CREATE POLICY "Enable read access for anon on notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users on notifications" ON notifications;
CREATE POLICY "Enable insert for notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for user notifications" ON notifications;
CREATE POLICY "Enable update for notifications" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. CATEGORIZATION_MESSAGES: mensajes del líder / la empresa
DROP POLICY IF EXISTS "Enable read for categorization_messages" ON categorization_messages;
CREATE POLICY "Enable read for categorization_messages" ON categorization_messages FOR SELECT TO anon, authenticated USING (true);

-- 5. EVENTS y EVENT_ACKNOWLEDGEMENTS: modal de comunicados obligatorios
DROP POLICY IF EXISTS "Enable read access for events" ON events;
CREATE POLICY "Enable read access for events" ON events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable read/insert for event_acknowledgements" ON event_acknowledgements;
CREATE POLICY "Enable read/insert for event_acknowledgements" ON event_acknowledgements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. MANUALS: biblioteca de documentos del portal
DROP POLICY IF EXISTS "Enable read access for authenticated users on manuals" ON manuals;
CREATE POLICY "Enable read access for anon on manuals" ON manuals FOR SELECT TO anon, authenticated USING (true);
