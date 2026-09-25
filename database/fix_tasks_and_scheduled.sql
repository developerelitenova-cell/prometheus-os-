-- 1. Añadir nuevas columnas a la tabla tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deliverable TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS leader_note TEXT;

-- 2. Actualizar las restricciones de priority
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- 3. Actualizar las restricciones de task_type
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_task_type_check CHECK (task_type IN ('daily', 'weekly', 'monthly', 'project', 'event', 'once'));

-- 4. Arreglar la política de scheduled_deliveries para permitir a líderes Nivel 2 (Área)
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

-- 5. Fix corporate_news policies for HR
ALTER TABLE corporate_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read access for corporate_news" ON corporate_news;
CREATE POLICY "Read access for corporate_news" ON corporate_news FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insert access for corporate_news" ON corporate_news;
CREATE POLICY "Insert access for corporate_news" ON corporate_news FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND (p.is_master_admin = true OR r.access_level IN (1, 2))
    )
  );

DROP POLICY IF EXISTS "Update access for corporate_news" ON corporate_news;
CREATE POLICY "Update access for corporate_news" ON corporate_news FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS "Delete access for corporate_news" ON corporate_news;
CREATE POLICY "Delete access for corporate_news" ON corporate_news FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      LEFT JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND (p.is_master_admin = true OR r.access_level IN (1, 2))
    )
  );
