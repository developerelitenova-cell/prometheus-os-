-- Añadir nuevas columnas a role_workflows si no existen
ALTER TABLE role_workflows ADD COLUMN IF NOT EXISTS decision_rules JSONB DEFAULT '[]'::jsonb;
ALTER TABLE role_workflows ADD COLUMN IF NOT EXISTS coordination JSONB DEFAULT '[]'::jsonb;
ALTER TABLE role_workflows ADD COLUMN IF NOT EXISTS unmet_needs JSONB DEFAULT '[]'::jsonb;
