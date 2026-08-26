import os
import sys
import glob
import json
import difflib
import unicodedata
from dotenv import load_dotenv
from supabase import create_client, Client
from anthropic import Anthropic

# Cargar variables de entorno desde frontend/.env.local
env_path = os.path.join(os.path.dirname(__file__), "..", "frontend", ".env.local")
load_dotenv(dotenv_path=env_path)

supabase_url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
claude_model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

if not supabase_url or not supabase_key:
    print("Error: Configura VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en frontend/.env.local")
    sys.exit(1)

if not anthropic_api_key:
    print("Error: Configura ANTHROPIC_API_KEY en frontend/.env.local")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)
anthropic = Anthropic(api_key=anthropic_api_key)

SYSTEM_INSTRUCTIONS = """Eres el Motor de Mapeo de Flujos de PROMETHEUS OS. Tu tarea es leer la transcripción de una entrevista o los documentos operativos de un cargo, y extraer de ahí una estructura de flujo de trabajo (workflow) real y precisa.

Vas a recibir en el mensaje del usuario el texto fuente (transcripción de entrevista, manuales de cargo, procesos documentados, etc.) para un cargo específico.

REGLAS DE ORO:
1. Extrae ÚNICAMENTE información que esté explícita o claramente implícita en el texto fuente. NUNCA inventes tareas, herramientas o KPIs que no estén respaldados por el texto.
2. Si el texto no menciona nada para una categoría (por ejemplo, no hay KPIs mencionados), devuelve un arreglo vacío para esa categoría en vez de inventar contenido.
3. Cada elemento de cada lista debe ser una frase corta, concreta y accionable (no párrafos largos).
4. "tasks" son las responsabilidades y actividades que ejecuta la persona en el cargo.
5. "inputs" son la información, documentos o insumos que la persona necesita recibir de otras áreas para trabajar.
6. "outputs" son los entregables, reportes o resultados que la persona produce para otros.
7. "tools_used" son software, plataformas, aplicaciones o equipos mencionados explícitamente.
8. "bottlenecks" son cuellos de botella, ineficiencias, riesgos u oportunidades de mejora mencionados.
9. "kpis" son indicadores de desempeño o metas mencionados explícitamente, con su meta si se menciona.
10. Responde EXCLUSIVAMENTE en JSON válido, sin texto adicional ni bloques de código, con este esquema exacto:
{
  "tasks": [string],
  "inputs": [string],
  "outputs": [string],
  "tools_used": [string],
  "bottlenecks": [string],
  "kpis": [string]
}"""

def normalize_text(text: str) -> str:
    """Quita acentos y pasa a minúscula."""
    text = text.lower()
    text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
    text = text.replace('_', ' ')
    return text.strip()

def ingest_workflows():
    print("Iniciando Ingesta de Flujos...")
    
    # Obtener roles de la base de datos
    response = supabase.table("roles").select("id, name").execute()
    db_roles = response.data
    
    if not db_roles:
        print("No se encontraron roles en la base de datos.")
        return

    # Crear diccionario normalizado: { nombre_normalizado: {id, original_name} }
    roles_map = {}
    for r in db_roles:
        norm = normalize_text(r["name"])
        roles_map[norm] = r
    
    db_role_names = list(roles_map.keys())

    # Buscar archivos tmp_*.txt en frontend/
    frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
    txt_files = glob.glob(os.path.join(frontend_dir, "tmp_*.txt"))
    
    print(f"Archivos encontrados: {len(txt_files)}")
    
    success_count = 0
    fail_count = 0
    failed_files = []

    for file_path in txt_files:
        filename = os.path.basename(file_path)
        # Extraer nombre base del archivo: tmp_gerente_general.txt -> gerente_general -> gerente general
        base_name = filename.replace("tmp_", "").replace(".txt", "")
        norm_file = normalize_text(base_name)
        
        # Buscar el rol más cercano usando difflib
        matches = difflib.get_close_matches(norm_file, db_role_names, n=1, cutoff=0.5)
        
        if not matches:
            print(f"[-] No se encontró un rol en DB para '{filename}' (Normalizado: '{norm_file}')")
            fail_count += 1
            failed_files.append(filename)
            continue
            
        matched_norm = matches[0]
        role_data = roles_map[matched_norm]
        role_id = role_data["id"]
        role_original_name = role_data["name"]
        
        print(f"[*] Mapeado '{filename}' -> Rol DB: '{role_original_name}'")
        
        # Leer el contenido del archivo
        with open(file_path, "r", encoding="utf-8") as f:
            source_text = f.read().strip()
            
        if not source_text:
            print(f"    - Archivo vacío, omitiendo.")
            continue
            
        # Llamar a Anthropic
        user_prompt = f"Cargo: {role_original_name}\n\nTEXTO FUENTE:\n{source_text}"
        print(f"    - Extrayendo flujo con {claude_model}...")
        
        try:
            ai_response = anthropic.messages.create(
                model=claude_model,
                max_tokens=4096,
                system=SYSTEM_INSTRUCTIONS,
                messages=[{"role": "user", "content": user_prompt}]
            )
            
            text_block = next((b for b in ai_response.content if b.type == 'text'), None)
            if not text_block:
                raise ValueError("No text block in response")
            raw_json = text_block.text.strip()
            # Limpiar posible bloque de markdown
            if raw_json.startswith("```"):
                lines = raw_json.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_json = "\n".join(lines).strip()
                
            workflow_data = json.loads(raw_json)
            
            # Upsert en Supabase
            # Convertimos a listas de strings por seguridad
            def as_list(k):
                val = workflow_data.get(k, [])
                if isinstance(val, list):
                    return [str(x) for x in val]
                return []
                
            payload = {
                "role_id": role_id,
                "tasks": as_list("tasks"),
                "inputs": as_list("inputs"),
                "outputs": as_list("outputs"),
                "tools_used": as_list("tools_used"),
                "bottlenecks": as_list("bottlenecks"),
                "kpis": as_list("kpis"),
                "raw_transcript": source_text
            }
            
            supabase.table("role_workflows").upsert(payload).execute()
            print(f"    [+] Flujo guardado correctamente para '{role_original_name}'.")
            success_count += 1
            
        except Exception as e:
            print(f"    [x] Error procesando '{filename}': {e}")
            fail_count += 1
            failed_files.append(filename)

    print("-" * 40)
    print("RESUMEN DE INGESTA:")
    print(f"Exitosos: {success_count}")
    print(f"Fallidos: {fail_count}")
    if failed_files:
        print("Archivos con problemas:")
        for f in failed_files:
            print(f"  - {f}")

if __name__ == "__main__":
    ingest_workflows()
