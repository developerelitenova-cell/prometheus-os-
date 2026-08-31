-- Crea las tablas de schema.sql que nunca llegaron a existir en este proyecto
-- (areas, roles, corporate_memory y role_kpis ya existen; esto completa el resto).

-- 4. KPI TEMPLATES
CREATE TABLE IF NOT EXISTS kpi_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_value NUMERIC,
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SHARED_PROCESSES
CREATE TABLE IF NOT EXISTS shared_processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  area_id UUID REFERENCES areas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SHARED_PROCESS_ROLES
CREATE TABLE IF NOT EXISTS shared_process_roles (
  process_id UUID REFERENCES shared_processes(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (process_id, role_id)
);

-- 9. ROLE_WORKFLOWS
CREATE TABLE IF NOT EXISTS role_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID UNIQUE REFERENCES roles(id) ON DELETE CASCADE,
  tasks JSONB DEFAULT '[]'::jsonb,
  inputs JSONB DEFAULT '[]'::jsonb,
  outputs JSONB DEFAULT '[]'::jsonb,
  tools_used JSONB DEFAULT '[]'::jsonb,
  bottlenecks JSONB DEFAULT '[]'::jsonb,
  kpis JSONB DEFAULT '[]'::jsonb,
  raw_transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE kpi_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_process_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for user tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid() = assigned_to);
CREATE POLICY "Enable public access for role_workflows" ON role_workflows FOR ALL TO public USING (true);
