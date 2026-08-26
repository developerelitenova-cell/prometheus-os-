import os
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = os.path.join(os.path.dirname(__file__), "..", "frontend", ".env.local")
load_dotenv(dotenv_path=env_path)

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

sql = """
CREATE TABLE IF NOT EXISTS role_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
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

ALTER TABLE role_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable public access for role_workflows" ON role_workflows FOR ALL TO public USING (true);
"""

# Note: The python supabase client doesn't have a direct SQL execution method easily available.
# But we can use postgrest rpc or just instruct the user to run it.
# Wait, actually we can execute sql using the postgres endpoint or we can tell the user to run it.
print("MIGRATION SQL:\n", sql)
