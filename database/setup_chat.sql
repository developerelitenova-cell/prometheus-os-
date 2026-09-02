-- Esquema del Historial de Chat y Directorio de Soporte por WhatsApp.
--
-- Los datos reales de contacto (nombres, telefonos, emails de empleados)
-- NO van en este archivo -- este solo crea las tablas vacias. Los datos
-- reales estan en database/seed_support_contacts.local.sql, un archivo
-- que NO se sube a git (ver .gitignore) porque contiene informacion
-- personal real. Para activar el directorio de soporte, correr primero
-- este script y despues el seed local aparte.

-- 1. Crear tabla de Contactos de Soporte
CREATE TABLE IF NOT EXISTS public.support_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    area TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de Historial de Chat
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- 'user' or 'ai'
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.support_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- 4. Crear Políticas de Seguridad
-- Todos pueden leer los contactos
DROP POLICY IF EXISTS "Public read support contacts" ON public.support_contacts;
CREATE POLICY "Public read support contacts"
ON public.support_contacts FOR SELECT
USING (true);

-- Todos pueden leer su propio historial (filtrado por su role_id)
DROP POLICY IF EXISTS "Read own chat history" ON public.chat_history;
CREATE POLICY "Read own chat history"
ON public.chat_history FOR SELECT
USING (true); -- En producción real: USING (role_id = auth.uid()) pero aquí usamos role_id desde el cliente

-- Todos pueden insertar en el historial
DROP POLICY IF EXISTS "Insert chat history" ON public.chat_history;
CREATE POLICY "Insert chat history"
ON public.chat_history FOR INSERT
WITH CHECK (true);
