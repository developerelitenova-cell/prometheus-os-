-- ==============================================================================
-- MIGRACIÓN: Módulo Kanban de Proyectos y Entregables de Trabajo (EDT)
-- Plataforma Nova Work
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es idempotente.
-- ==============================================================================

-- 1. Tabla de Proyectos (projects)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL DEFAULT 'PRJ',
  name TEXT NOT NULL,
  description TEXT,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  kanban_columns JSONB NOT NULL DEFAULT '[
    {"key": "todo", "label": "Por hacer", "is_done": false},
    {"key": "in_progress", "label": "En progreso", "is_done": false},
    {"key": "in_review", "label": "En revisión", "is_done": false},
    {"key": "completed", "label": "Completado", "is_done": true}
  ]'::jsonb,
  progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_area_id ON projects(area_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 2. Tabla de Entregables de Trabajo Jerárquicos (project_edt_items)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_edt_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES project_edt_items(id) ON DELETE CASCADE,
  edt_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  weight NUMERIC(8,2) NOT NULL DEFAULT 10.00 CHECK (weight >= 0),
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  position INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edt_project_id ON project_edt_items(project_id);
CREATE INDEX IF NOT EXISTS idx_edt_parent_id ON project_edt_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_edt_assignee_id ON project_edt_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_edt_status ON project_edt_items(project_id, status);

-- 3. Seguridad RLS
-- ------------------------------------------------------------------------------
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_edt_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "projects_manage" ON projects;
CREATE POLICY "projects_manage" ON projects
  FOR ALL TO authenticated
  USING (
    public.is_master_admin()
    OR public.is_leader()
    OR owner_id = auth.uid()
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.is_master_admin()
    OR public.is_leader()
    OR owner_id = auth.uid()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "project_edt_select" ON project_edt_items;
CREATE POLICY "project_edt_select" ON project_edt_items
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "project_edt_manage" ON project_edt_items;
CREATE POLICY "project_edt_manage" ON project_edt_items
  FOR ALL TO authenticated
  USING (
    public.is_master_admin()
    OR public.is_leader()
    OR assignee_id = auth.uid()
    OR project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid() OR created_by = auth.uid())
  )
  WITH CHECK (
    public.is_master_admin()
    OR public.is_leader()
    OR assignee_id = auth.uid()
    OR project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid() OR created_by = auth.uid())
  );

