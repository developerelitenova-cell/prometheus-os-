import os
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = os.path.join(os.path.dirname(__file__), "..", "frontend", ".env.local")
load_dotenv(dotenv_path=env_path)

url = os.environ.get("VITE_SUPABASE_URL")
# Use the ANON key exactly as the frontend does
key = os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print("Fetching roles with anon key...")
response = supabase.table('roles').select('*').execute()
print(response)

print("Fetching roles with anon key joining areas...")
try:
    response2 = supabase.table('roles').select('*, areas(name)').execute()
    print(response2)
except Exception as e:
    print("Error:", e)
