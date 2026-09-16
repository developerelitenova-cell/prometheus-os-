-- ========================================================
-- MIGRACIÓN: Sistema de Entregas Programadas (Programados)
-- Ejecutar en Supabase SQL Editor
-- ========================================================

CREATE TABLE IF NOT EXISTS scheduled_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('monthly_day', 'weekly_day', 'once')),
  recurrence_value INTEGER,
  due_date DATE,
  target_type TEXT NOT NULL CHECK (target_type IN ('role','level','profile','area','all')),
  target_role_ids UUID[],
  target_profile_ids UUID[],
  target_level INTEGER,
  target_area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_delivery_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES scheduled_deliveries(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(delivery_id, profile_id, period_key)
);

ALTER TABLE scheduled_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_delivery_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read scheduled_deliveries"
  ON scheduled_deliveries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Leaders and admins can manage scheduled_deliveries"
  ON scheduled_deliveries FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND (p.is_master_admin = true OR r.access_level = 1)
    )
  );

CREATE POLICY "Users can manage their own completions"
  ON scheduled_delivery_completions FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Leaders can read completions"
  ON scheduled_delivery_completions FOR SELECT TO authenticated USING (true);
