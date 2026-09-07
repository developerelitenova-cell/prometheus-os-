import os
from dotenv import load_dotenv
from supabase import create_client, Client
from collections import defaultdict

# 1. Configurar conexión
env_path = os.path.join(os.path.dirname(__file__), "..", "frontend", ".env.local")
load_dotenv(dotenv_path=env_path)

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not key:
    key = os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print("Iniciando verificación de roles duplicados...")

try:
    # 2. Consultar Roles y Áreas
    roles_response = supabase.table('roles').select('id, name, area_id').execute()
    roles = roles_response.data
    
    areas_response = supabase.table('areas').select('id, name').execute()
    areas_dict = {area['id']: area['name'] for area in areas_response.data}
    
    # 3. Procesar Datos
    name_counts = defaultdict(list)
    
    for role in roles:
        name = role.get('name', '').strip()
        area_id = role.get('area_id')
        area_name = areas_dict.get(area_id, "Sin Área")
        name_counts[name].append({"id": role.get('id'), "area": area_name})
        
    # 4. Identificar Duplicados
    duplicates = {name: data for name, data in name_counts.items() if len(data) > 1}
    
    # 5. Reportar
    if duplicates:
        print(f"\nSe encontraron {len(duplicates)} nombres de roles duplicados:\n")
        for name, data in duplicates.items():
            print(f"- Rol: '{name}' (Aparece {len(data)} veces)")
            for item in data:
                print(f"    * ID: {item['id']} | Área: {item['area']}")
            print("")
    else:
        print("\nNo se encontraron roles duplicados. Todo está en orden.")

except Exception as e:
    print(f"Error durante la verificación: {e}")
