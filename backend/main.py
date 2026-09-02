from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client
from anthropic import Anthropic

# Imports de los nuevos módulos propietarios
from performance.task_manager import task_manager
from performance.kpi_evaluator import kpi_evaluator
from knowledge_base.role_agents import orchestrator

# Cargar variables de entorno (asumiendo que están en frontend/.env.local)
env_path = os.path.join(os.path.dirname(__file__), "..", "frontend", ".env.local")
load_dotenv(dotenv_path=env_path)

supabase_url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
claude_model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

if supabase_url and supabase_key:
    supabase: Client = create_client(supabase_url, supabase_key)
else:
    supabase = None

if anthropic_api_key:
    anthropic = Anthropic(api_key=anthropic_api_key)
else:
    anthropic = None

app = FastAPI(title="Gemelo Digital Corporativo - Elite Nutrition", version="2.0")

# Configurar CORS (Seguridad para Vercel)
allowed_origins_str = os.environ.get("ALLOWED_ORIGINS", "*")
origins = [origin.strip() for origin in allowed_origins_str.split(",")] if allowed_origins_str != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Gemelo Digital Corporativo (Fase 2) - Backend Inicializado"}

# --- Módulo de Administración: Roles ---
@app.get("/api/v1/roles")
def get_roles():
    return {"roles": []}

@app.post("/api/v1/roles")
def create_role(role_data: dict):
    return {"status": "created", "role": role_data}

@app.put("/api/v1/roles/{role_id}")
def update_role(role_id: str, role_data: dict):
    return {"status": "updated", "role_id": role_id}

# --- Módulo de Administración: Cuentas de Empleados ---
# Usa la Service Role Key (solo disponible aquí, en el backend) para crear
# usuarios de Supabase Auth. Nunca se debe exponer esta llave al frontend.
class CreateEmployeeRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role_id: Optional[str] = None
    is_master_admin: bool = False

@app.post("/api/v1/admin/create-employee")
def create_employee(req: CreateEmployeeRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend (falta SUPABASE_SERVICE_ROLE_KEY)")

    try:
        auth_res = supabase.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True
        })
        user_id = auth_res.user.id
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creando el usuario de acceso: {str(e)}")

    try:
        profile_payload = {
            "id": user_id,
            "full_name": req.full_name,
            "role_id": req.role_id,
            "is_master_admin": req.is_master_admin,
            "mapping_completed": False,
            # Cuentas creadas por un admin quedan aprobadas de entrada -- la cola
            # de aprobacion (approval_status default 'pending') es solo para el
            # auto-registro publico (signUp) en LoginView.vue.
            "approval_status": "approved"
        }
        supabase.table("profiles").insert(profile_payload).execute()
    except Exception as e:
        # Rollback: si falla crear el perfil, no dejamos un usuario de Auth huérfano.
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=f"Error creando el perfil: {str(e)}")

    return {"status": "created", "user_id": user_id}

@app.delete("/api/v1/admin/employee/{user_id}")
def delete_employee(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend")
    try:
        supabase.table("profiles").delete().eq("id", user_id).execute()
        supabase.auth.admin.delete_user(user_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Módulo de Desempeño: Tareas y KPIs ---
class TaskCreate(BaseModel):
    role_id: str
    title: str
    description: str
    estimated_hours: float

@app.post("/api/v1/tasks")
def create_task(task: TaskCreate):
    t = task_manager.create_task(task.role_id, task.title, task.description, task.estimated_hours)
    return {"status": "created", "task": t}

@app.get("/api/v1/tasks/{role_id}")
def get_tasks(role_id: str):
    return {"tasks": task_manager.get_tasks_by_role(role_id)}

@app.post("/api/v1/evaluate/{role_id}")
def evaluate_role(role_id: str):
    # Lógica de evaluación basada en tareas completadas vs OKRs
    tasks = task_manager.get_tasks_by_role(role_id)
    # Ejemplo con KPIs simulados (Normalmente vienen del agente config)
    kpis = [{"name": "Cumplimiento Semanal", "target": 90}]
    evaluation = kpi_evaluator.evaluate_role(role_id, tasks, kpis)
    return {"status": "evaluated", "evaluation": evaluation}

# --- Módulo Inteligencia Artificial: Chatbots por Rol ---
class ChatQuery(BaseModel):
    role_id: str
    query: str

@app.post("/api/v1/chat")
def chat_with_agent(chat_query: ChatQuery):
    if chat_query.role_id not in orchestrator.active_agents:
        # Instanciar el agente si no existe (Normalmente leyendo la DB)
        orchestrator.spawn_agent({"role": chat_query.role_id, "access_level": 3, "area": "Desconocida", "name": "Usuario"})
    
    agent = orchestrator.active_agents[chat_query.role_id]
    response = agent.chat(chat_query.query)
    return {"reply": response}

# --- Módulo de Ingesta y Procesamiento de Flujos ---
class ExtractWorkflowRequest(BaseModel):
    roleId: str
    sourceText: str

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
10. "decision_rules" son las condiciones, bifurcaciones o reglas lógicas de negocio (ej. "si X es verdadero, entonces Y").
11. "coordination" son las interacciones interdepartamentales, flujos de aprobación o puntos de contacto con otras personas.
12. "unmet_needs" son carencias operativas, herramientas que faltan o procesos manuales que el empleado reporta como ausentes (ej. "no tengo una herramienta que me avise"). Extrae estas ausencias operativas aquí.
13. Responde EXCLUSIVAMENTE en JSON válido, sin texto adicional ni bloques de código, con este esquema exacto:
{
  "tasks": [string],
  "inputs": [string],
  "outputs": [string],
  "tools_used": [string],
  "bottlenecks": [string],
  "kpis": [string],
  "decision_rules": [string],
  "coordination": [string],
  "unmet_needs": [string]
}"""

@app.post("/api/v1/extract-workflow")
def extract_workflow(req: ExtractWorkflowRequest):
    if not supabase or not anthropic:
        raise HTTPException(status_code=500, detail="Supabase o Anthropic no configurados")
    
    if not req.sourceText.strip():
        raise HTTPException(status_code=400, detail="El texto fuente está vacío")

    # Obtener nombre de rol desde supabase (opcional para el prompt, pero mejora el contexto)
    res = supabase.table("roles").select("name").eq("id", req.roleId).execute()
    role_name = res.data[0]["name"] if res.data else "Rol Desconocido"

    user_prompt = f"Cargo: {role_name}\n\nTEXTO FUENTE:\n{req.sourceText}"

    try:
        ai_response = anthropic.messages.create(
            model=claude_model,
            max_tokens=4096,
            system=SYSTEM_INSTRUCTIONS,
            messages=[{"role": "user", "content": user_prompt}]
        )

        text_block = next((b for b in ai_response.content if b.type == 'text'), None)
        if not text_block:
            raise HTTPException(status_code=502, detail="No se obtuvo un bloque de texto del modelo")

        raw_json = text_block.text.strip()
        if raw_json.startswith("```"):
            lines = raw_json.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            raw_json = "\n".join(lines).strip()

        workflow_data = json.loads(raw_json)

        def as_list(k):
            val = workflow_data.get(k, [])
            return [str(x) for x in val] if isinstance(val, list) else []

        workflow = {
            "tasks": as_list("tasks"),
            "inputs": as_list("inputs"),
            "outputs": as_list("outputs"),
            "tools_used": as_list("tools_used"),
            "bottlenecks": as_list("bottlenecks"),
            "kpis": as_list("kpis"),
            "decision_rules": as_list("decision_rules"),
            "coordination": as_list("coordination"),
            "unmet_needs": as_list("unmet_needs"),
        }

        return {"workflow": workflow}

    except Exception as e:
        print(f"Error procesando extracción: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
