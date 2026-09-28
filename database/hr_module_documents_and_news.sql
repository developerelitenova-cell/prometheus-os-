-- ============================================================
-- SQL para soportar Noticias y Documentos de HR (Contratos, Firmas)
-- ============================================================

-- 1. Crear Storage Bucket para Noticias y Flyers
INSERT INTO storage.buckets (id, name, public)
VALUES ('news_flyers', 'news_flyers', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas Storage para news_flyers
DROP POLICY IF EXISTS "news_flyers_read" ON storage.objects;
CREATE POLICY "news_flyers_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'news_flyers');

DROP POLICY IF EXISTS "news_flyers_insert" ON storage.objects;
CREATE POLICY "news_flyers_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'news_flyers');

DROP POLICY IF EXISTS "news_flyers_delete" ON storage.objects;
CREATE POLICY "news_flyers_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'news_flyers');


-- 2. Crear Storage Bucket para Documentos de Empleados (Contratos, Firmas)
-- Este bucket NO es público, es privado para mantener la confidencialidad.
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee_documents', 'employee_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas Storage para employee_documents
DROP POLICY IF EXISTS "employee_documents_read" ON storage.objects;
CREATE POLICY "employee_documents_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee_documents' AND (
    -- El dueño puede ver sus propios documentos (la ruta será /auth.uid()/*)
    (storage.foldername(name))[1] = auth.uid()::text 
    OR 
    -- Un Master Admin o un rol autorizado de RRHH puede verlo todo
    is_master_admin()
  ));

DROP POLICY IF EXISTS "employee_documents_insert" ON storage.objects;
CREATE POLICY "employee_documents_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee_documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR 
    is_master_admin()
  ));


-- 3. Añadir columnas a la tabla profiles para contrato y firma digital
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contract_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature_url text;
