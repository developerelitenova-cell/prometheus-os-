import os
import csv
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar las variables de entorno desde frontend/.env.local
env_path = os.path.join(os.path.dirname(__file__), "..", "frontend", ".env.local")
load_dotenv(dotenv_path=env_path)

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key or url == "aqui_va_tu_supabase_url":
    print("Error: Por favor, configura VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en frontend/.env.local antes de ejecutar este script.")
    sys.exit(1)

supabase: Client = create_client(url, key)

def seed_database():
    print("Iniciando migración de datos a Supabase...")
    
    # 1. Leer el TSV
    roles_data = []
    tsv_path = os.path.join(os.path.dirname(__file__), "..", "data", "roles_raw.tsv")
    try:
        with open(tsv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f, delimiter='\t')
            for row in reader:
                if len(row) >= 5:
                    roles_data.append({
                        "Empresa": row[0],
                        "Nombre": row[1],
                        "Cargo": row[2],
                        "Área": row[3],
                        "Nivel": row[4]
                    })
    except Exception as e:
        print(f"Error leyendo el archivo TSV: {e}")
        return

    # 2. Insertar Áreas Únicas
    areas_set = set(row.get("Área", "General") for row in roles_data if row.get("Área"))
    print(f"Creando {len(areas_set)} áreas...")
    
    area_map = {}
    for area in areas_set:
        try:
            # Upsert o insertar área
            response = supabase.table("areas").insert({"name": area}).execute()
            if response.data:
                area_map[area] = response.data[0]['id']
        except Exception as e:
            # Si ya existe, buscar su ID
            try:
                response = supabase.table("areas").select("id").eq("name", area).execute()
                if response.data:
                    area_map[area] = response.data[0]['id']
            except Exception as inner_e:
                print(f"Error fatal con el área {area}: {inner_e}")
                print("⚠️ PARECE QUE LAS TABLAS NO EXISTEN EN SUPABASE. Asegúrate de ejecutar database/schema.sql en el SQL Editor.")
                return

    # 3. Insertar Roles
    print(f"Migrando {len(roles_data)} roles...")
    for row in roles_data:
        area_name = row.get("Área", "General")
        role_name = row.get("Cargo", "Sin Nombre")
        
        # Determinar Nivel de Acceso (Basado en el nombre por ahora)
        access_level = 3 # Por defecto individual
        if "Gerente" in role_name or "Director" in role_name or "CEO" in role_name:
            access_level = 1
        elif "Líder" in role_name or "Coordinador" in role_name or "Jefe" in role_name:
            access_level = 2

        try:
            supabase.table("roles").insert({
                "name": role_name,
                "area_id": area_map.get(area_name),
                "access_level": access_level
            }).execute()
        except Exception as e:
            print(f"Error insertando {role_name}: {e}")

    print("Migración completada. La base de datos en Supabase tiene ahora todos los roles y áreas.")

if __name__ == "__main__":
    seed_database()
