-- ==============================================================================
-- MIGRACIÓN: Trazabilidad, Evidencia y Justificación de Tareas y Pendientes
-- Añade soporte de evidencia (texto y pantallazo/foto) y justificación de motivos
-- de no ejecución para tareas ad-hoc, gestión periódica y entregas programadas.
-- ==============================================================================

-- 1. Tabla: tasks (Tareas ad-hoc asignadas por líderes)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS evidence_text TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS evidence_photo TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Actualizar constraint de status en tasks para soportar 'unfulfilled' (no se pudo ejecutar)
DO $$
BEGIN
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
  ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'unfulfilled'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Tabla: task_completions (Gestión Diaria / Semanal / Mensual recurrente)
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS evidence_text TEXT;
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS evidence_photo TEXT;
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 3. Tabla: scheduled_delivery_completions (Entregas programadas)
ALTER TABLE scheduled_delivery_completions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE scheduled_delivery_completions ADD COLUMN IF NOT EXISTS evidence_text TEXT;
ALTER TABLE scheduled_delivery_completions ADD COLUMN IF NOT EXISTS evidence_photo TEXT;
ALTER TABLE scheduled_delivery_completions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 4. Storage Bucket para evidencias (si se usa Supabase Storage además de Base64)
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_evidence', 'task_evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para task_evidence
DROP POLICY IF EXISTS "Permitir lectura publica de task_evidence" ON storage.objects;
CREATE POLICY "Permitir lectura publica de task_evidence"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'task_evidence');

DROP POLICY IF EXISTS "Permitir subida de task_evidence a usuarios autenticados" ON storage.objects;
CREATE POLICY "Permitir subida de task_evidence a usuarios autenticados"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task_evidence');

DROP POLICY IF EXISTS "Permitir actualizacion de task_evidence a usuarios autenticados" ON storage.objects;
CREATE POLICY "Permitir actualizacion de task_evidence a usuarios autenticados"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'task_evidence');
