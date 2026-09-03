-- Supabase SQL Schema para Elite Nutrition S.A.S. (Gemelo Digital Corporativo)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. AREAS
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROLES (Cargos - Total: 70)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- ej. "Gerente de Auditoria"
  area_id UUID REFERENCES areas(id),
  access_level INTEGER NOT NULL CHECK (access_level IN (1, 2, 3)), -- 1: Nivel Ejecutivo, 2: Área, 3: Individual
  objective TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. KPI TEMPLATES (Indicadores que miden el desempeño de los roles)
CREATE TABLE kpi_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_value NUMERIC,
  unit TEXT, -- '%', 'cantidad', '$'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PROFILES (Usuarios - Empleados en el sistema)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Enlaza con Auth de Supabase
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TASKS (Gestión de Tareas y Procesos Compartidos)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SHARED_PROCESSES (Procesos Compartidos por Área)
CREATE TABLE shared_processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  area_id UUID REFERENCES areas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SHARED_PROCESS_ROLES (Múltiples cargos realizando el mismo proceso)
CREATE TABLE shared_process_roles (
  process_id UUID REFERENCES shared_processes(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (process_id, role_id)
);

-- 9. ROLE_WORKFLOWS (Mapeo de flujos estructurados descubiertos por IA)
CREATE TABLE role_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID UNIQUE REFERENCES roles(id) ON DELETE CASCADE,
  tasks JSONB DEFAULT '[]'::jsonb,
  inputs JSONB DEFAULT '[]'::jsonb,
  outputs JSONB DEFAULT '[]'::jsonb,
  tools_used JSONB DEFAULT '[]'::jsonb,
  bottlenecks JSONB DEFAULT '[]'::jsonb,
  kpis JSONB DEFAULT '[]'::jsonb,
  decision_rules JSONB DEFAULT '[]'::jsonb,
  coordination JSONB DEFAULT '[]'::jsonb,
  unmet_needs JSONB DEFAULT '[]'::jsonb,
  raw_transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. CORPORATE_MEMORY (Base de Datos Vectorial para RAG)
CREATE TABLE corporate_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,          -- El texto crudo (ej. un párrafo de un manual o de una entrevista)
  metadata JSONB DEFAULT '{}'::jsonb, -- Origen: { "source": "role_workflows", "role_id": "...", "type": "bottleneck" }
  embedding VECTOR(768),          -- Vector matemático (Gemini embeddings usa 768 dimensiones)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. ROLE_KPIS (Historial de Rendimiento y Evaluaciones - Balanced Scorecard)
CREATE TABLE role_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  evaluation_period VARCHAR(50) NOT NULL,
  score_financial NUMERIC(5,2) DEFAULT 0,
  score_customer NUMERIC(5,2) DEFAULT 0,
  score_process NUMERIC(5,2) DEFAULT 0,
  score_growth NUMERIC(5,2) DEFAULT 0,
  overall_score NUMERIC(5,2) GENERATED ALWAYS AS (
    (score_financial + score_customer + score_process + score_growth) / 4
  ) STORED,
  okr_details JSONB DEFAULT '[]'::jsonb,
  ai_evaluation_notes TEXT,
  manager_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast vector similarity search
CREATE INDEX corporate_memory_embedding_idx ON corporate_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- POLICIES (Row Level Security)
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_kpis ENABLE ROW LEVEL SECURITY;

-- Políticas base: Todos los usuarios autenticados pueden leer.
CREATE POLICY "Enable read access for authenticated users" ON areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for user tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid() = assigned_to);

CREATE POLICY "Enable read access for anon on areas" ON areas FOR SELECT TO anon USING (true);
CREATE POLICY "Enable read access for anon on roles" ON roles FOR SELECT TO anon USING (true);
CREATE POLICY "Enable access for authenticated on role_workflows" ON role_workflows FOR ALL TO authenticated USING (true);
