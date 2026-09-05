-- Fix: Habilitar la creación de perfiles para usuarios recién registrados.
--
-- Causa: Cuando un usuario se registra con `signUp`, si no hay confirmación
-- de correo requerida, se crea una sesión "authenticated". Sin embargo,
-- nuestro código asume que puede insertar en la tabla `profiles`.
-- Por defecto, Supabase bloquea los INSERT si no hay política RLS.
-- 
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.

DROP POLICY IF EXISTS "Enable insert for authenticated users on profiles" ON profiles;
CREATE POLICY "Enable insert for authenticated users on profiles" ON profiles FOR INSERT TO authenticated, anon WITH CHECK (auth.uid() = id);
