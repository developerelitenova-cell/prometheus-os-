-- ========================================================
-- POLÍTICAS DE RLS PARA EL BUCKET DE NOTICIAS (news_flyers)
-- ========================================================

-- 1. Asegurar que el bucket exista y sea público
INSERT INTO storage.buckets (id, name, public)
VALUES ('news_flyers', 'news_flyers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir lectura pública de los flyers
DROP POLICY IF EXISTS "Public Read News Flyers" ON storage.objects;
CREATE POLICY "Public Read News Flyers"
ON storage.objects FOR SELECT
USING (bucket_id = 'news_flyers');

-- 3. Permitir a usuarios autenticados subir flyers
DROP POLICY IF EXISTS "Authenticated Insert News Flyers" ON storage.objects;
CREATE POLICY "Authenticated Insert News Flyers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'news_flyers');

-- 4. Permitir a usuarios autenticados actualizar o reemplazar flyers
DROP POLICY IF EXISTS "Authenticated Update News Flyers" ON storage.objects;
CREATE POLICY "Authenticated Update News Flyers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'news_flyers');

-- 5. Permitir a usuarios autenticados eliminar flyers
DROP POLICY IF EXISTS "Authenticated Delete News Flyers" ON storage.objects;
CREATE POLICY "Authenticated Delete News Flyers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'news_flyers');
