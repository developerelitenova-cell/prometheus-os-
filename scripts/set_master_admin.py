import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv('../frontend/.env.local')
load_dotenv('.env.local')  # ADMIN_EMAIL -- nunca en git, ver scripts/.env.local.example

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Faltan credenciales de Supabase en .env.local")
    exit(1)

supabase: Client = create_client(url, key)

def update_db():
    email = os.environ.get("ADMIN_EMAIL")
    if not email:
        print("Falta ADMIN_EMAIL en scripts/.env.local")
        exit(1)

    try:
        users = supabase.auth.admin.list_users()
        admin_user = next((u for u in users if u.email == email), None)
        if not admin_user:
            print(f"Usuario {email} no encontrado en auth.users")
            return
            
        user_id = admin_user.id
        
        # Actualizar profile
        res = supabase.table('profiles').update({
            'is_master_admin': True,
        }).eq('id', user_id).execute()
        
        print(f"Perfil de {email} actualizado a is_master_admin=True")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_db()
