-- =========================================================================
-- MIGRACIÓN DE REPARACIÓN: Columnas para scheduled_deliveries
-- Ejecutar este script en el Supabase SQL Editor de tu proyecto
-- =========================================================================

-- 1. Agregar columnas faltantes a la tabla scheduled_deliveries si no existen
ALTER TABLE IF EXISTS scheduled_deliveries 
  ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('role','level','profile','area','all')),
  ADD COLUMN IF NOT EXISTS target_role_ids UUID[],
  ADD COLUMN IF NOT EXISTS target_profile_ids UUID[],
  ADD COLUMN IF NOT EXISTS target_level INTEGER,
  ADD COLUMN IF NOT EXISTS target_area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Asegurar que la tabla scheduled_delivery_completions exista
CREATE TABLE IF NOT EXISTS scheduled_delivery_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES scheduled_deliveries(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(delivery_id, profile_id, period_key)
);

-- 3. Habilitar RLS
ALTER TABLE scheduled_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_delivery_completions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de lectura y escritura
DROP POLICY IF EXISTS "Authenticated users can read scheduled_deliveries" ON scheduled_deliveries;
CREATE POLICY "Authenticated users can read scheduled_deliveries"
  ON scheduled_deliveries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Leaders and admins can manage scheduled_deliveries" ON scheduled_deliveries;
CREATE POLICY "Leaders and admins can manage scheduled_deliveries"
  ON scheduled_deliveries FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND (p.is_master_admin = true OR r.access_level IN (1, 2))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND (p.is_master_admin = true OR r.access_level IN (1, 2))
    )
  );

DROP POLICY IF EXISTS "Users can manage their own completions" ON scheduled_delivery_completions;
CREATE POLICY "Users can manage their own completions"
  ON scheduled_delivery_completions FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Leaders can read completions" ON scheduled_delivery_completions;
CREATE POLICY "Leaders can read completions"
  ON scheduled_delivery_completions FOR SELECT TO authenticated USING (true);

-- 5. RECARGAR LA CACHÉ DEL ESQUEMA DE POSTGREST
NOTIFY pgrst, 'reload schema';
