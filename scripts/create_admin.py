import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno (asumiendo que corre desde /scripts)
load_dotenv('../frontend/.env.local')
load_dotenv('.env.local')  # credenciales del admin a crear -- nunca en git, ver scripts/.env.local.example

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Faltan credenciales de Supabase en .env.local")
    exit(1)

supabase: Client = create_client(url, key)

def create_admin():
    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    if not email or not password:
        print("Faltan ADMIN_EMAIL / ADMIN_PASSWORD en scripts/.env.local")
        exit(1)

    print(f"Buscando si el usuario {email} ya existe...")
    # Intentar crearlo en auth.users a través del admin API
    try:
        user_res = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })
        user_id = user_res.user.id
        print(f"Usuario creado con ID: {user_id}")
    except Exception as e:
        if "User already registered" in str(e):
            print("El usuario ya está registrado.")
            # Si queremos forzar buscar el ID habría que list_users, pero para simplificar,
            # lo dejamos si ya existe.
            print("Por favor bórrelo de Supabase Dashboard y vuelva a correr el script.")
            return
        else:
            print(f"Error creando auth.user: {e}")
            return
            
    # Asignarlo a un Rol con access_level = 1 (Pentagono/Admin)
    print("Asignando rol de Admin...")
    roles_res = supabase.table('roles').select('id, name, access_level').eq('access_level', 1).execute()
    
    role_id = None
    if roles_res.data and len(roles_res.data) > 0:
        # Preferir el que se llame 'Admin' o 'Gerente'
        for r in roles_res.data:
            if "admin" in r['name'].lower() or "gerente" in r['name'].lower():
                role_id = r['id']
                break
        if not role_id:
            role_id = roles_res.data[0]['id']
            
    if not role_id:
        print("No se encontró un rol de nivel 1 en la tabla roles. Insertando uno genérico...")
        # Asegurar área Pentagono
        area_res = supabase.table('areas').select('id').eq('name', 'Pentagono').execute()
        area_id = None
        if not area_res.data:
            ins_area = supabase.table('areas').insert({'name': 'Pentagono'}).execute()
            area_id = ins_area.data[0]['id']
        else:
            area_id = area_res.data[0]['id']
            
        ins_role = supabase.table('roles').insert({
            'name': 'Admin Master',
            'area_id': area_id,
            'access_level': 1
        }).execute()
        role_id = ins_role.data[0]['id']

    # Insertar en perfiles
    try:
        supabase.table('profiles').insert({
            'id': user_id,
            'full_name': 'Admin Master Pentagono',
            'role_id': role_id
        }).execute()
        print(f"¡Perfil creado exitosamente y vinculado al rol de administrador (nivel 1)!")
        print(f"-> Email: {email}")
        print(f"-> Contraseña: {password}")
    except Exception as e:
        print(f"Error insertando en profiles: {e}")

if __name__ == "__main__":
    create_admin()
