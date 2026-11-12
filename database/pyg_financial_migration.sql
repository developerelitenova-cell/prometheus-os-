-- ==============================================================================
-- MIGRACIÓN: Módulo Financiero PyG (Pérdidas y Ganancias) por Canal de Venta
-- Plataforma Nova Work
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.
-- ==============================================================================

-- 1. Ampliar tipo de notificación para alertas de pérdida PyG
-- ------------------------------------------------------------------------------
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'manual_update',
    'new_task',
    'task_assigned',
    'due_reminder',
    'overdue_alert',
    'role_updated',
    'pyg_loss_alert',
    'system_alert',
    'message',
    'new_registration'
  ));

-- 2. Canales de Venta Activos (sales_channels)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sales_channels (code, name, active) VALUES
  ('B2B', 'B2B', TRUE),
  ('ECOMMERCE', 'E-commerce', TRUE),
  ('DISTRIBUIDORES', 'Distribuidores', TRUE),
  ('RETAIL', 'Retail', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 3. Movimientos Financieros Directos por Canal (channel_financial_entries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS channel_financial_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES sales_channels(id) ON DELETE CASCADE,
  period_month VARCHAR(7) NOT NULL, -- Formato 'YYYY-MM'
  gross_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  returns_discounts NUMERIC(14,2) NOT NULL DEFAULT 0,
  cogs NUMERIC(14,2) NOT NULL DEFAULT 0,
  direct_opex NUMERIC(14,2) NOT NULL DEFAULT 0,
  depreciation_amort NUMERIC(14,2) NOT NULL DEFAULT 0,
  taxes_financial NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'erp')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_entries_period ON channel_financial_entries(period_month);
CREATE INDEX IF NOT EXISTS idx_channel_entries_channel ON channel_financial_entries(channel_id, period_month);

-- 4. Gastos Indirectos Compartidos para Prorrateo (indirect_expenses)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS indirect_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_month VARCHAR(7) NOT NULL, -- Formato 'YYYY-MM'
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'erp')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_indirect_expenses_period ON indirect_expenses(period_month);

-- 5. Seguridad RLS
-- ------------------------------------------------------------------------------
ALTER TABLE sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE indirect_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_channels_select" ON sales_channels;
CREATE POLICY "sales_channels_select" ON sales_channels
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "sales_channels_manage" ON sales_channels;
CREATE POLICY "sales_channels_manage" ON sales_channels
  FOR ALL TO authenticated
  USING (public.is_master_admin() OR public.is_leader())
  WITH CHECK (public.is_master_admin() OR public.is_leader());

DROP POLICY IF EXISTS "channel_entries_select" ON channel_financial_entries;
CREATE POLICY "channel_entries_select" ON channel_financial_entries
  FOR SELECT TO authenticated
  USING (public.is_master_admin() OR public.is_leader());

DROP POLICY IF EXISTS "channel_entries_manage" ON channel_financial_entries;
CREATE POLICY "channel_entries_manage" ON channel_financial_entries
  FOR ALL TO authenticated
  USING (public.is_master_admin() OR public.is_leader())
  WITH CHECK (public.is_master_admin() OR public.is_leader());

DROP POLICY IF EXISTS "indirect_expenses_select" ON indirect_expenses;
CREATE POLICY "indirect_expenses_select" ON indirect_expenses
  FOR SELECT TO authenticated
  USING (public.is_master_admin() OR public.is_leader());

DROP POLICY IF EXISTS "indirect_expenses_manage" ON indirect_expenses;
CREATE POLICY "indirect_expenses_manage" ON indirect_expenses
  FOR ALL TO authenticated
  USING (public.is_master_admin() OR public.is_leader())
  WITH CHECK (public.is_master_admin() OR public.is_leader());

