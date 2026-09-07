-- ============================================================
-- Permite vincular una misma plantilla de KPI ("rol de KPI") a
-- varios cargos a la vez, en vez de un único role_id.
--
-- kpi_role_templates.role_id queda deprecado (no se borra acá para
-- no perder datos): esta migración crea la tabla puente
-- kpi_role_template_links y migra los vínculos existentes.
-- ============================================================

CREATE TABLE IF NOT EXISTS kpi_role_template_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES kpi_role_templates(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_role_template_links_template ON kpi_role_template_links(template_id);
CREATE INDEX IF NOT EXISTS idx_kpi_role_template_links_role ON kpi_role_template_links(role_id);

-- Migra los vínculos 1:1 que ya existían
INSERT INTO kpi_role_template_links (template_id, role_id)
SELECT id, role_id FROM kpi_role_templates
WHERE role_id IS NOT NULL
ON CONFLICT (template_id, role_id) DO NOTHING;

ALTER TABLE kpi_role_template_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpi_role_template_links_select" ON kpi_role_template_links FOR SELECT
  USING (is_master_admin() OR is_leader());
CREATE POLICY "kpi_role_template_links_write" ON kpi_role_template_links FOR ALL
  USING (is_master_admin()) WITH CHECK (is_master_admin());

-- ============================================================
-- OPCIONAL, manual, solo cuando confirmes que todo quedó migrado
-- bien en kpi_role_template_links:
--   ALTER TABLE kpi_role_templates DROP COLUMN role_id;
-- No se ejecuta automáticamente acá para no perder el dato viejo
-- sin que lo revises primero.
-- ============================================================
