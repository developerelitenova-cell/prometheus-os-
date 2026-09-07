-- ============================================================
-- Bucket de Storage para las imágenes de los comunicados/anuncios
-- obligatorios (events.image_url). Antes se pegaba una URL externa a mano;
-- ahora la gerente sube el archivo directo desde /events y esto guarda el
-- resultado.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-images', 'announcement-images', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública: las imágenes se muestran en el modal obligatorio a
-- cualquier usuario logueado (y en el <img> del bucket público no hace
-- falta ni sesión, así carga rápido igual que el resto de assets).
DROP POLICY IF EXISTS "announcement_images_read" ON storage.objects;
CREATE POLICY "announcement_images_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'announcement-images');

-- Escritura: solo admin master o un líder (Nivel 1/2) -- mismo criterio que
-- events_insert en auth_access_control_migration.sql.
DROP POLICY IF EXISTS "announcement_images_write" ON storage.objects;
CREATE POLICY "announcement_images_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'announcement-images' AND (is_master_admin() OR is_leader()));

DROP POLICY IF EXISTS "announcement_images_delete" ON storage.objects;
CREATE POLICY "announcement_images_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'announcement-images' AND (is_master_admin() OR is_leader()));
