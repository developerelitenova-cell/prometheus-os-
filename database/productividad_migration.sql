-- Migración para Sistema de Productividad, Roles Avanzados, Manuales y Cronogramas

-- 1. Modificar tabla TASKS para el Planner
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'daily' CHECK (task_type IN ('daily', 'weekly', 'monthly', 'project', 'event'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES profiles(id); -- Quién la asignó (líder, empresa, o el mismo usuario)

-- 2. MANUALS (Documentación por Rol)
CREATE TABLE IF NOT EXISTS manuals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content_url TEXT, -- Link a PDF, Bucket de Supabase o doc externo
  description TEXT,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NOTIFICATIONS (Campanita de alerta roja para usuarios)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('manual_update', 'new_task', 'system_alert', 'message')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT, -- Opcional, a donde dirigir cuando hace click
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CATEGORIZATION_MESSAGES (Mensajes enviados por Máster o Encargado a categorías de roles)
CREATE TABLE IF NOT EXISTS categorization_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id),
  target_role_id UUID REFERENCES roles(id),
  target_area_id UUID REFERENCES areas(id), -- Opcional, si va para toda un área
  category TEXT NOT NULL, -- Ej: 'urgente', 'informativo', 'operativo'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. EVENTS (Cronograma y Comunicados)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT, -- Pieza gráfica
  target_level TEXT NOT NULL CHECK (target_level IN ('company', 'area', 'worker')),
  target_area_id UUID REFERENCES areas(id),
  target_profile_id UUID REFERENCES profiles(id),
  is_mandatory BOOLEAN DEFAULT FALSE, -- Si es true, requiere pop-up "Entendido"
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EVENT_ACKNOWLEDGEMENTS (Confirmaciones de "Entendido" corporativas)
CREATE TABLE IF NOT EXISTS event_acknowledgements (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, profile_id)
);

-- TRIGGER para actualizar 'updated_at' en manuals
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_manuals_modtime ON manuals;
CREATE TRIGGER update_manuals_modtime
BEFORE UPDATE ON manuals
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- POLÍTICAS RLS BÁSICAS
ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_acknowledgements ENABLE ROW LEVEL SECURITY;

-- Todo autenticado puede leer, las inserciones las maneja el backend/servidor de confianza (Service Role) o se ajustan según necesidad.
CREATE POLICY "Enable read access for authenticated users on manuals" ON manuals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users on notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "Enable insert for authenticated users on notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for user notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = profile_id);

CREATE POLICY "Enable read for categorization_messages" ON categorization_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for events" ON events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read/insert for event_acknowledgements" ON event_acknowledgements FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
