-- ============================================================
-- KPIs reales por cargo (reemplaza el modelo genérico de BSC con IA)
-- Fuente: plantillas reales de SharePoint (Consolidado Organizacional +
-- plantillas por área), Agosto 2026.
--
-- IMPORTANTE: estas tablas NO se vinculan a personas ni a un role_id
-- específico de forma automática. kpi_role_templates.role_id empieza
-- en NULL a propósito -- un admin master debe enlazar cada plantilla
-- al cargo real desde la UI. Las mediciones (kpi_metric_measurements)
-- se anclan al cargo (role_id), no a la persona: cuando alguien se
-- registre y su cargo tenga plantilla asignada, el líder de esa área
-- podrá empezar a cargar sus métricas.
-- ============================================================

-- 1. Plantilla por área/cargo
CREATE TABLE IF NOT EXISTS kpi_role_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_label TEXT NOT NULL,                 -- "Bodega", "Comercial", "Administrativa"... tal cual la plantilla original
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL, -- vínculo real, lo define un admin manualmente
  source_note TEXT,                         -- referencia histórica del origen del template (no implica relación activa)
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. KPIs individuales dentro de cada plantilla
CREATE TABLE IF NOT EXISTS kpi_template_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES kpi_role_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meta_label TEXT NOT NULL,                 -- valor crudo de la meta: "95%", "$ 100.000.000", "288", "Mantener Todos los Líderes"
  meta_type TEXT NOT NULL DEFAULT 'text' CHECK (meta_type IN ('percentage', 'currency', 'count', 'text')),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Mediciones reales, ancladas al cargo (role_id), con cadencia semanal + cierre de mes
CREATE TABLE IF NOT EXISTS kpi_metric_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID REFERENCES kpi_template_metrics(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  period_checkpoint TEXT NOT NULL CHECK (period_checkpoint IN ('semana_2', 'semana_3', 'semana_4', 'cierre')),
  realizado_raw TEXT,                       -- dato crudo tal como se reporta ("7 días", "820", "$1.062.231.413")
  percentage NUMERIC(6,2),                  -- % de cumplimiento de ese corte (nullable si aún no se mide)
  estado TEXT NOT NULL DEFAULT 'revisar' CHECK (estado IN ('cumpliendo', 'revisar')),
  notes TEXT,                               -- para los KPIs que requieren llamar y anotar
  entered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_id, role_id, period_year, period_month, period_checkpoint)
);

CREATE INDEX IF NOT EXISTS idx_kpi_template_metrics_template ON kpi_template_metrics(template_id);
CREATE INDEX IF NOT EXISTS idx_kpi_measurements_role_period ON kpi_metric_measurements(role_id, period_year, period_month);

-- ============================================================
-- RLS: solo admin master y el/la líder responsable del área ven y cargan esto.
-- Los empleados de nivel individual no tienen acceso -- esto es una
-- herramienta de gestión/medición, no autoservicio del empleado.
-- ============================================================
ALTER TABLE kpi_role_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_template_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_metric_measurements ENABLE ROW LEVEL SECURITY;

-- Plantillas: lectura para admin y líderes; escritura solo admin (evita que cada líder reescriba metas ajenas)
CREATE POLICY "kpi_templates_select" ON kpi_role_templates FOR SELECT
  USING (is_master_admin() OR is_leader());
CREATE POLICY "kpi_templates_write" ON kpi_role_templates FOR ALL
  USING (is_master_admin()) WITH CHECK (is_master_admin());

CREATE POLICY "kpi_template_metrics_select" ON kpi_template_metrics FOR SELECT
  USING (is_master_admin() OR is_leader());
CREATE POLICY "kpi_template_metrics_write" ON kpi_template_metrics FOR ALL
  USING (is_master_admin()) WITH CHECK (is_master_admin());

-- Mediciones: admin ve/edita todo; un líder ve/edita solo las de cargos de su propia área
CREATE POLICY "kpi_measurements_select" ON kpi_metric_measurements FOR SELECT
  USING (
    is_master_admin()
    OR (is_leader() AND role_id IN (SELECT id FROM roles WHERE area_id = current_area_id()))
  );
CREATE POLICY "kpi_measurements_insert" ON kpi_metric_measurements FOR INSERT
  WITH CHECK (
    is_master_admin()
    OR (is_leader() AND role_id IN (SELECT id FROM roles WHERE area_id = current_area_id()))
  );
CREATE POLICY "kpi_measurements_update" ON kpi_metric_measurements FOR UPDATE
  USING (
    is_master_admin()
    OR (is_leader() AND role_id IN (SELECT id FROM roles WHERE area_id = current_area_id()))
  );
CREATE POLICY "kpi_measurements_delete" ON kpi_metric_measurements FOR DELETE
  USING (is_master_admin());

-- ============================================================
-- Seed: plantillas reales por área (solo estructura -- KPI + meta,
-- sin datos de mediciones ni de personas). Bloque estándar únicamente;
-- "Marca Personal" trae además una rúbrica de esfuerzo por contenido y
-- tablas de métricas semanales por red social (Instagram/TikTok/YouTube)
-- que no encajan en este modelo y quedan fuera por ahora.
-- ============================================================
DO $$
DECLARE
  t_id UUID;
BEGIN

  -- Administrativa
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Administrativa', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Cumplimiento del Plan de Seguimiento Comercial', '100%', 'percentage', 1),
    (t_id, 'Índice de Cumplimiento Global de Ventas', '$ 2.500.000.000', 'currency', 2),
    (t_id, 'Eficiencia en Planes de Acción Comercial', '90%', 'percentage', 3);

  -- Bodega
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Bodega', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Exactitud de Inventario', '288', 'count', 1),
    (t_id, 'Cumplimiento de Entregas', '98%', 'percentage', 2),
    (t_id, 'Índice de Cumplimiento del Personal a Cargo', '90%', 'percentage', 3);

  -- Comercial (Chatcenter)
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Comercial', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Gestión Diaria Chats', '70', 'count', 1),
    (t_id, 'Gestión Diaria Llamadas', '14', 'count', 2),
    (t_id, 'Gestión Diaria Retoma', '14', 'count', 3),
    (t_id, 'Cumplimiento de Ventas Chatcenter (Mensual)', '$ 110.000.000,00', 'currency', 4);

  -- Contabilidad
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Contabilidad', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Cumplimiento del Plan de Pagos a Proveedores', '95%', 'percentage', 1),
    (t_id, 'Exactitud de Cierre de Caja y Bancos', '100%', 'percentage', 2);

  -- Dropshipping
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Dropshipping', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Cumplimiento del Presupuesto de Ventas', '$ 100.000.000', 'currency', 1),
    (t_id, 'Tasa de Dropshippers Activos', '80%', 'percentage', 2),
    (t_id, 'Variación de Crecimiento del Canal', '5%', 'percentage', 3);

  -- Ecommerce
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Ecommerce', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Tasa de Recuperación de Carritos Abandonados', '12%', 'percentage', 1),
    (t_id, 'Eficiencia en Rescate de Novedades de Pedidos', '85%', 'percentage', 2),
    (t_id, 'Crecimiento de Ventas de Productos no Pareto', '5%', 'percentage', 3);

  -- Facturación
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Facturación', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Oportunidad en Emisión de Facturación', '98%', 'percentage', 1),
    (t_id, 'Tasa de Errores o Notas Crédito por Facturación', '1%', 'percentage', 2),
    (t_id, 'Índice de Cumplimiento del Personal a Cargo', '90%', 'percentage', 3);

  -- Gestión Humana
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Gestión Humana', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Tasa de Retención Temprana del Personal Importante', 'Mantener Todos los Líderes', 'text', 1),
    (t_id, 'Optimización del Presupuesto del Área', '<= 100%', 'text', 2),
    (t_id, 'Índice de Cumplimiento del Personal a Cargo', '90%', 'percentage', 3),
    (t_id, 'Ejecución del Cronograma de Bienestar', '1', 'count', 4);

  -- Marca Personal (solo bloque estándar; rúbrica de esfuerzo y métricas de redes quedan pendientes)
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Marca Personal', 'Plantilla importada de planilla real, Agosto 2026 -- bloque estándar únicamente') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Crecimiento de Ventas de Canales Asociados con Marca Personal', '5%', 'percentage', 1),
    (t_id, 'Rentabilidad de Marca Personal Mensual', '$ 60.000.000', 'currency', 2),
    (t_id, 'Cierre de Maquila Mensual', '1', 'count', 3),
    (t_id, 'Matriz de Métricas de Redes Sociales', '80%', 'percentage', 4),
    (t_id, 'Cumplimiento de Piezas Según Tabla de Productividad', '100', 'count', 5);

  -- Mercadeo
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Mercadeo', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Tasa de Conversión de Leads', '15%', 'percentage', 1),
    (t_id, 'CPA / Costo por Adquisición', '$ 32.000', 'currency', 2),
    (t_id, 'ROA / Retorno de Campañas de Mercadeo', '4', 'count', 3);

  -- Novedades
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Novedades', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Tasa de Rescate / Solución de Novedades', '85%', 'percentage', 1),
    (t_id, 'Tasa de Devoluciones Definitivas', '5%', 'percentage', 2);

  -- Pentágono
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Pentágono', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Tasa de Ejecución de Planes de Acción', '90%', 'percentage', 1),
    (t_id, 'Cumplimiento del Cronograma de Auditoría', '100%', 'percentage', 2),
    (t_id, 'Índice de Cumplimiento del Personal a Cargo', '90%', 'percentage', 3);

  -- Proyectos
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Proyectos', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Lead Time de Órdenes de Compra (OC)', '98%', 'percentage', 1),
    (t_id, 'Evaluación de Proveedores (Cotizaciones)', '100%', 'percentage', 2),
    (t_id, 'Cumplimiento de Hitos de Proyectos', '90%', 'percentage', 3);

  -- Punto de Venta
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Punto de Venta', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Gestión Diaria Chats', '70', 'count', 1),
    (t_id, 'Gestión Diaria Llamadas', '14', 'count', 2),
    (t_id, 'Gestión Diaria Retoma', '14', 'count', 3),
    (t_id, 'Exactitud Arqueo de Caja', '100%', 'percentage', 4),
    (t_id, 'Aumento de Ticket Promedio (Semanal)', '5%', 'percentage', 5),
    (t_id, 'Tasa de Conversión', '30%', 'percentage', 6),
    (t_id, 'Aumento de Tráfico Local (Semanal)', '8%', 'percentage', 7),
    (t_id, 'Rentabilidad Local (Mensual)', '$ 270.000.000', 'currency', 8),
    (t_id, 'Cumplimiento de Ventas Chatcenter (Mensual)', '$ 77.000.000,00', 'currency', 9);

  -- Tecnología
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('Tecnología', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Cumplimiento del Cronograma de Procesos', '100%', 'percentage', 1),
    (t_id, 'Generación e Implementación de Planes de Mejora', '85%', 'percentage', 2),
    (t_id, 'Cumplimiento Cronograma de Medición Semanal', '1', 'count', 3);

  -- USA
  INSERT INTO kpi_role_templates (area_label, source_note) VALUES ('USA', 'Plantilla importada de planilla real, Agosto 2026') RETURNING id INTO t_id;
  INSERT INTO kpi_template_metrics (template_id, name, meta_label, meta_type, display_order) VALUES
    (t_id, 'Cumplimiento del Presupuesto de Ventas USA', '$ 210.000.000', 'currency', 1),
    (t_id, 'Aumento del Ticket Promedio en USA', '5%', 'percentage', 2),
    (t_id, 'Variación de Crecimiento de Ventas', '5%', 'percentage', 3);

END $$;
