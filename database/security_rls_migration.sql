-- Archivo: security_rls_migration.sql
-- Propósito: Cerrar el acceso público a la tabla de role_workflows (Mapeo)

-- Eliminar política pública insegura
DROP POLICY IF EXISTS "Enable public access for role_workflows" ON role_workflows;

-- Crear política restringida solo para usuarios autenticados
CREATE POLICY "Enable access for authenticated on role_workflows" 
ON role_workflows 
FOR ALL 
TO authenticated 
USING (true);
