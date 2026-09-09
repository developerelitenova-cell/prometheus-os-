"""
Reset de Usuarios para Re-Onboarding
Elimina usuarios de auth.users y profiles para que puedan reiniciar el proceso.

Uso: python scripts/reset_usuarios.py
"""
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Forzar UTF-8 en la consola de Windows para evitar UnicodeEncodeError
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Cargar credenciales
load_dotenv('../frontend/.env.local')
load_dotenv('frontend/.env.local')
load_dotenv('.env.local')

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Faltan credenciales: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY")
    print("   Verificá frontend/.env.local y scripts/.env.local")
    exit(1)

supabase: Client = create_client(url, key)

# ─── Lista de usuarios a eliminar ────────────────────────────────────────────
# Agregar o quitar emails según necesidad. Son los 3 pedidos en la solicitud:
EMAILS_A_ELIMINAR = [
    # Gerente de Tecnología
    "gerenciatecnologia@elitenutrition.com.co",
    # Usuario de novedades2
    "novedades2@elitenutrition.com.co",
    # Gerente de Gestión Humana (completar email si se conoce)
    # "gerenciagestionhumana@elitenutrition.com.co",
]

def find_user_by_email(email: str):
    """Busca un usuario en auth.users por email. Pagina si es necesario."""
    page = 1
    while True:
        res = supabase.auth.admin.list_users(page=page, per_page=50)
        users = res if isinstance(res, list) else getattr(res, 'users', [])
        if not users:
            break
        for u in users:
            if u.email and u.email.lower() == email.lower():
                return u
        if len(users) < 50:
            break
        page += 1
    return None

def reset_usuario(email: str):
    print(f"\n{'─'*50}")
    print(f"🔍 Procesando: {email}")

    # 1. Buscar usuario en auth
    user = find_user_by_email(email)

    if not user:
        print(f"   ⚠️  No se encontró usuario en auth.users con ese email.")
        # Intentar limpiar profile por si quedó huérfano (no debería, pero por seguridad)
        # Necesitaríamos el UUID — si no hay auth user, no hay UUID fácil.
        print(f"   ℹ️  No hay nada que eliminar.")
        return

    user_id = user.id
    print(f"   ✅ Encontrado: ID={user_id}, Email={user.email}")

    # 2. Verificar que no sea master admin (protección extra)
    profile_res = supabase.table('profiles').select('is_master_admin, full_name').eq('id', user_id).execute()
    if profile_res.data:
        profile = profile_res.data[0]
        print(f"   👤 Nombre: {profile.get('full_name', 'N/A')}")
        if profile.get('is_master_admin'):
            print(f"   🛑 BLOQUEADO: Este usuario es Master Admin. No se eliminará por seguridad.")
            return

    # 3. Eliminar de auth.users (el CASCADE en profiles se activa automáticamente)
    try:
        supabase.auth.admin.delete_user(user_id)
        print(f"   🗑️  Eliminado de auth.users exitosamente.")
        print(f"   ✅ El perfil y datos asociados fueron limpiados por CASCADE.")
    except Exception as e:
        print(f"   ❌ Error eliminando de auth: {e}")
        return

    # 4. Confirmar que el profile ya no existe
    check = supabase.table('profiles').select('id').eq('id', user_id).execute()
    if not check.data:
        print(f"   ✅ Perfil eliminado correctamente. El usuario puede volver a registrarse.")
    else:
        print(f"   ⚠️  El profile aún existe. Eliminando manualmente...")
        supabase.table('profiles').delete().eq('id', user_id).execute()
        print(f"   ✅ Profile eliminado manualmente.")

def main():
    print("=" * 50)
    print("  RESET DE USUARIOS PARA RE-ONBOARDING")
    print("=" * 50)
    print(f"  Usuarios a eliminar: {len(EMAILS_A_ELIMINAR)}")

    for email in EMAILS_A_ELIMINAR:
        reset_usuario(email)

    print(f"\n{'='*50}")
    print("  Proceso completado.")
    print("  Los usuarios eliminados pueden volver a registrarse y hacer su onboarding desde cero.")
    print("=" * 50)

if __name__ == "__main__":
    main()
