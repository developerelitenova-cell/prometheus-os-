-- 11. ROLE_KPIS (Historial de Rendimiento y Evaluaciones)
CREATE TABLE IF NOT EXISTS role_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  evaluation_period VARCHAR(50) NOT NULL, -- ej: "2026-Q3", "2026-08"
  score_financial NUMERIC(5,2) DEFAULT 0, -- 0.00 a 100.00
  score_customer NUMERIC(5,2) DEFAULT 0,
  score_process NUMERIC(5,2) DEFAULT 0,
  score_growth NUMERIC(5,2) DEFAULT 0,
  overall_score NUMERIC(5,2) GENERATED ALWAYS AS (
    (score_financial + score_customer + score_process + score_growth) / 4
  ) STORED,
  okr_details JSONB DEFAULT '[]'::jsonb, -- Lista de objetivos con su estado actual
  ai_evaluation_notes TEXT, -- Observaciones generadas por la IA
  manager_approved BOOLEAN DEFAULT FALSE, -- Si la evaluación final ya fue aprobada por un humano
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE role_kpis ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para KPIs (Los admins pueden ver todo, los usuarios solo su área o rol si tuvieran auth)
CREATE POLICY "Permitir lectura pública de KPIs" ON role_kpis FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de KPIs" ON role_kpis FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de KPIs" ON role_kpis FOR UPDATE USING (true);
