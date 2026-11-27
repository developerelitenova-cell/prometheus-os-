-- ==============================================================================
-- MIGRACIÓN: Permisos de Publicación de Noticias y Comunicados por Alcance
-- Plataforma Nova Work
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es 100% idempotente.
-- ==============================================================================

-- 1. Columna news_permission en public.profiles
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS news_permission VARCHAR(20) NOT NULL DEFAULT 'none';

DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_news_permission_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_news_permission_check
    CHECK (news_permission IN ('none', 'area', 'company'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Backfill inicial de permisos (solo donde news_permission = 'none')
-- ------------------------------------------------------------------------------
-- 2a. Permiso 'company' para Master Admins y cargos de RRHH / Datos & KPIs
UPDATE public.profiles p
SET news_permission = 'company'
WHERE p.news_permission = 'none'
  AND (
    p.is_master_admin = true
    OR EXISTS (
      SELECT 1
      FROM public.roles r
      WHERE r.id = p.role_id
        AND (
          LOWER(COALESCE(r.name, '')) LIKE '%gestión humana%'
          OR LOWER(COALESCE(r.name, '')) LIKE '%gestion humana%'
          OR LOWER(COALESCE(r.name, '')) LIKE '%recursos humanos%'
          OR LOWER(COALESCE(r.name, '')) LIKE '%analista de datos%'
          OR LOWER(COALESCE(r.name, '')) LIKE '%especialista de datos%'
        )
    )
  );

-- 2b. Permiso 'area' para líderes / gerentes (access_level IN (1, 2)) que no tengan 'company'
UPDATE public.profiles p
SET news_permission = 'area'
WHERE p.news_permission = 'none'
  AND EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = p.role_id
      AND r.access_level IN (1, 2)
  );

-- 3. Extensión de public.corporate_news (alcance, cuerpo, categoría y autor)
-- ------------------------------------------------------------------------------
ALTER TABLE public.corporate_news
  ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE public.corporate_news
  ADD COLUMN IF NOT EXISTS scope VARCHAR(15) NOT NULL DEFAULT 'company';

DO $$
BEGIN
  ALTER TABLE public.corporate_news DROP CONSTRAINT IF EXISTS corporate_news_scope_check;
  ALTER TABLE public.corporate_news ADD CONSTRAINT corporate_news_scope_check
    CHECK (scope IN ('company', 'area'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.corporate_news
  ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;

ALTER TABLE public.corporate_news
  ADD COLUMN IF NOT EXISTS category VARCHAR(30) NOT NULL DEFAULT 'corporate';

DO $$
BEGIN
  ALTER TABLE public.corporate_news DROP CONSTRAINT IF EXISTS corporate_news_category_check;
  ALTER TABLE public.corporate_news ADD CONSTRAINT corporate_news_category_check
    CHECK (category IN ('corporate', 'area', 'kpi'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.corporate_news
  ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Permitir comunicados de solo texto (image_url nullable) de forma segura
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'corporate_news'
      AND column_name = 'image_url'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.corporate_news ALTER COLUMN image_url DROP NOT NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 4. Índices de consulta rápida
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_news_permission
  ON public.profiles(news_permission);

CREATE INDEX IF NOT EXISTS idx_corporate_news_scope_area
  ON public.corporate_news(scope, area_id);

-- 5. Función auxiliar para leer el permiso de noticias del usuario autenticado
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_news_permission()
RETURNS VARCHAR(20)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.news_permission FROM public.profiles p WHERE p.id = auth.uid()),
    'none'
  );
$$;

REVOKE ALL ON FUNCTION public.current_news_permission() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_news_permission() TO authenticated;

-- 6. Políticas RLS actualizadas para public.corporate_news
-- ------------------------------------------------------------------------------
ALTER TABLE public.corporate_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read access for corporate_news" ON public.corporate_news;
DROP POLICY IF EXISTS "corporate_news_select_policy" ON public.corporate_news;
CREATE POLICY "corporate_news_select_policy"
  ON public.corporate_news
  FOR SELECT
  TO authenticated
  USING (
    scope = 'company'
    OR (scope = 'area' AND area_id IS NOT NULL AND area_id = public.current_area_id())
    OR created_by = auth.uid()
    OR public.is_master_admin()
  );

DROP POLICY IF EXISTS "Insert access for corporate_news" ON public.corporate_news;
DROP POLICY IF EXISTS "corporate_news_insert_policy" ON public.corporate_news;
CREATE POLICY "corporate_news_insert_policy"
  ON public.corporate_news
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_master_admin()
    OR public.current_news_permission() = 'company'
    OR (
      public.current_news_permission() = 'area'
      AND scope = 'area'
      AND area_id IS NOT NULL
      AND area_id = public.current_area_id()
    )
  );

DROP POLICY IF EXISTS "Update access for corporate_news" ON public.corporate_news;
DROP POLICY IF EXISTS "corporate_news_update_policy" ON public.corporate_news;
CREATE POLICY "corporate_news_update_policy"
  ON public.corporate_news
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_master_admin()
    OR public.current_news_permission() = 'company'
  )
  WITH CHECK (
    public.is_master_admin()
    OR public.current_news_permission() = 'company'
    OR (
      created_by = auth.uid()
      AND scope = 'area'
      AND area_id IS NOT NULL
      AND area_id = public.current_area_id()
    )
  );

DROP POLICY IF EXISTS "Delete access for corporate_news" ON public.corporate_news;
DROP POLICY IF EXISTS "corporate_news_delete_policy" ON public.corporate_news;
CREATE POLICY "corporate_news_delete_policy"
  ON public.corporate_news
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_master_admin()
    OR public.current_news_permission() = 'company'
  );
