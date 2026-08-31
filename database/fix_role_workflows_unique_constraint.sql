-- Fix: "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification" al guardar la entrevista de mapeo (MapperView.vue -> upsert
-- en role_workflows con onConflict: 'role_id').
--
-- Causa: role_workflows nunca tuvo una constraint UNIQUE en role_id, solo
-- id UUID PRIMARY KEY. El código siempre asumió "un workflow por rol"
-- (upsert por role_id), pero el esquema nunca lo garantizó.
--
-- Este script:
--   1. Deduplica filas existentes por role_id (por si algún guardado previo,
--      antes de este fix, insertó más de una fila para el mismo rol al no
--      poder hacer upsert), quedándose con la más reciente (updated_at).
--   2. Agrega la constraint UNIQUE que el upsert del frontend necesita.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> pegar y correr.
-- Es seguro re-ejecutar (idempotente).

-- 1. Deduplicar: conservar solo la fila más reciente por role_id
DELETE FROM role_workflows a
USING role_workflows b
WHERE a.role_id = b.role_id
  AND a.role_id IS NOT NULL
  AND a.updated_at < b.updated_at;

-- Empate en updated_at (o ambos NULL): conservar solo la de mayor id
DELETE FROM role_workflows a
USING role_workflows b
WHERE a.role_id = b.role_id
  AND a.role_id IS NOT NULL
  AND a.updated_at = b.updated_at
  AND a.id < b.id;

-- 2. Agregar la constraint que el upsert(..., { onConflict: 'role_id' }) necesita
ALTER TABLE role_workflows
  ADD CONSTRAINT role_workflows_role_id_key UNIQUE (role_id);
