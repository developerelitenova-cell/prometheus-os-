import os
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = os.path.join(os.path.dirname(__file__), "..", "frontend", ".env.local")
load_dotenv(dotenv_path=env_path)

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not key:
    key = os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print("Checking roles count...")
try:
    response = supabase.table('roles').select('id', count='exact').limit(1).execute()
    print("Roles count:", response.count)
except Exception as e:
    print("Error getting roles:", e)

print("Checking areas count...")
try:
    response = supabase.table('areas').select('id', count='exact').limit(1).execute()
    print("Areas count:", response.count)
except Exception as e:
    print("Error getting areas:", e)
