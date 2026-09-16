-- ============================================================
-- Migración: Delegación del Permiso de Gestión de Contraseñas
-- Permite que la Gerente de Auditoría asigne la tarea de brindar
-- y administrar contraseñas corporativas a otros roles.
-- ============================================================

-- 1. Añadir la columna can_manage_passwords a la tabla roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS can_manage_passwords BOOLEAN DEFAULT FALSE;

-- 2. Asegurar que la 'Gerente de Auditoria' y roles afines de Auditoría
-- tengan este permiso habilitado por defecto:
UPDATE roles 
SET can_manage_passwords = TRUE 
WHERE LOWER(name) LIKE '%auditoria%' OR LOWER(name) LIKE '%auditor%';

-- 3. Permitir que usuarios autenticados lean este campo en roles
-- (Las políticas existentes en fix_roles_areas_write_rls_migration.sql
-- ya permiten SELECT a authenticated en roles).
