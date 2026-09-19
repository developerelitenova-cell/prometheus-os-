from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client
from anthropic import Anthropic
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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

orchestrator.initialize_clients(supabase, anthropic, claude_model)
kpi_evaluator.initialize_clients(supabase, anthropic, claude_model)

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
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

# Configurar Rate Limiting (SlowAPI)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Dependencia de Autenticación JWT ---
security = HTTPBearer()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifica que el JWT provisto en el header 'Authorization: Bearer <token>' 
    sea válido usando Supabase.
    """
    token = credentials.credentials
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en backend")
    
    try:
        # get_user verifica la firma JWT contra el servidor de Supabase
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token JWT inválido o expirado",
            )
        return user_response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Autenticación fallida: {str(e)}",
        )

def require_admin_or_manager(user):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend")
    res = supabase.table("profiles").select("is_master_admin, roles(access_level)").eq("id", user.id).single().execute()
    if not res.data:
        raise HTTPException(status_code=403, detail="Perfil no encontrado")
    
    is_master = res.data.get("is_master_admin")
    roles = res.data.get("roles")
    access_level = roles.get("access_level") if roles else None
    
    if not is_master and access_level not in [1, 2]:
        raise HTTPException(status_code=403, detail="Esta acción requiere permisos administrativos (Leader o Master Admin)")

@app.get("/")
def read_root():
    return {"message": "Gemelo Digital Corporativo (Fase 2) - Backend Inicializado"}

# --- Módulo de Administración: Roles ---
@app.get("/api/v1/roles")
def get_roles(user=Depends(verify_jwt)):
    require_admin_or_manager(user)
    return {"roles": []}

@app.post("/api/v1/roles")
def create_role(role_data: dict, user=Depends(verify_jwt)):
    require_admin_or_manager(user)
    return {"status": "created", "role": role_data}

@app.put("/api/v1/roles/{role_id}")
def update_role(role_id: str, role_data: dict, user=Depends(verify_jwt)):
    require_admin_or_manager(user)
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

class UpdateEmployeeRequest(BaseModel):
    full_name: Optional[str] = None
    role_id: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    approval_status: Optional[str] = None
    is_master_admin: Optional[bool] = None

@app.get("/api/v1/admin/employees")
def list_employees(user=Depends(verify_jwt)):
    require_admin_or_manager(user)
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend")
    try:
        profiles_res = supabase.table("profiles").select("*, roles(id, name, access_level, area_id, areas(id, name))").order("full_name").execute()
        profiles = profiles_res.data or []

        try:
            auth_users_res = supabase.auth.admin.list_users()
            email_map = {u.id: u.email for u in auth_users_res}
        except Exception:
            email_map = {}

        for p in profiles:
            p["email"] = email_map.get(p["id"], "")

        return {"employees": profiles}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/admin/create-employee")
def create_employee(req: CreateEmployeeRequest, user=Depends(verify_jwt)):
    require_admin_or_manager(user)
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend (falta SUPABASE_SERVICE_ROLE_KEY)")
    
    if req.is_master_admin:
        res = supabase.table("profiles").select("is_master_admin").eq("id", user.id).single().execute()
        if not res.data or not res.data.get("is_master_admin"):
            raise HTTPException(status_code=403, detail="Sólo un Master Admin puede otorgar el rol de Master Admin a otro usuario.")

    try:
        auth_res = supabase.auth.admin.create_user({
            "email": req.email.strip(),
            "password": req.password,
            "email_confirm": True
        })
        user_id = auth_res.user.id
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creando el usuario de acceso: {str(e)}")

    try:
        profile_payload = {
            "id": user_id,
            "full_name": req.full_name.strip(),
            "role_id": req.role_id if req.role_id != "" else None,
            "is_master_admin": req.is_master_admin,
            "mapping_completed": False,
            # Cuentas creadas por un admin quedan aprobadas de entrada
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

@app.put("/api/v1/admin/employee/{user_id}")
def update_employee(user_id: str, req: UpdateEmployeeRequest, user=Depends(verify_jwt)):
    require_admin_or_manager(user)
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend")
    
    if req.is_master_admin is not None:
        res = supabase.table("profiles").select("is_master_admin").eq("id", user.id).single().execute()
        if not res.data or not res.data.get("is_master_admin"):
            raise HTTPException(status_code=403, detail="Sólo un Master Admin puede otorgar o remover el rol de Master Admin a otro usuario.")

    # 1. Actualizar credenciales en Supabase Auth si se suministraron
    auth_updates = {}
    if req.email and req.email.strip():
        auth_updates["email"] = req.email.strip()
        auth_updates["email_confirm"] = True
    if req.password and req.password.strip():
        auth_updates["password"] = req.password.strip()

    if auth_updates:
        try:
            supabase.auth.admin.update_user_by_id(user_id, auth_updates)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error actualizando credenciales en Auth: {str(e)}")

    # 2. Actualizar registro en profiles
    profile_updates = {}
    if req.full_name is not None:
        profile_updates["full_name"] = req.full_name.strip()
    if req.role_id is not None:
        profile_updates["role_id"] = req.role_id if req.role_id != "" else None
    if req.approval_status is not None:
        profile_updates["approval_status"] = req.approval_status
    if req.is_master_admin is not None:
        profile_updates["is_master_admin"] = req.is_master_admin

    if profile_updates:
        try:
            supabase.table("profiles").update(profile_updates).eq("id", user_id).execute()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error actualizando perfil: {str(e)}")

    return {"status": "updated", "user_id": user_id}

@app.delete("/api/v1/admin/employee/{user_id}")
def delete_employee(user_id: str, user=Depends(verify_jwt)):
    require_admin_or_manager(user)
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend")
    try:
        supabase.table("profiles").delete().eq("id", user_id).execute()
        supabase.auth.admin.delete_user(user_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Módulo de Delegación de Contraseñas y Accesos ---
class RolePasswordPermissionRequest(BaseModel):
    can_manage_passwords: bool

@app.get("/api/v1/admin/password-delegated-roles")
def get_password_delegated_roles(user=Depends(verify_jwt)):
    require_admin_or_manager(user)
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend")

    # 1. Intentar consultar la columna can_manage_passwords en roles
    try:
        res = supabase.table("roles").select("id, name, can_manage_passwords").execute()
        delegated = [r["id"] for r in (res.data or []) if r.get("can_manage_passwords") or "auditor" in (r.get("name") or "").lower()]
        return {"delegated_role_ids": delegated}
    except Exception:
        pass

    # 2. Fallback: consultar corporate_memory
    try:
        res = supabase.table("corporate_memory").select("metadata").eq("content", "password_delegated_roles").execute()
        if res.data and len(res.data) > 0:
            delegated = res.data[0].get("metadata", {}).get("role_ids", [])
            return {"delegated_role_ids": delegated}
    except Exception:
        pass

    # 3. Fallback por defecto: roles de Auditoría
    try:
        res = supabase.table("roles").select("id, name").execute()
        delegated = [r["id"] for r in (res.data or []) if "auditor" in (r.get("name") or "").lower()]
        return {"delegated_role_ids": delegated}
    except Exception:
        return {"delegated_role_ids": []}

@app.post("/api/v1/admin/roles/{role_id}/password-permission")
def set_role_password_permission(role_id: str, req: RolePasswordPermissionRequest, user=Depends(verify_jwt)):
    require_admin_or_manager(user)
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend")

    updated_in_roles = False
    try:
        supabase.table("roles").update({"can_manage_passwords": req.can_manage_passwords}).eq("id", role_id).execute()
        updated_in_roles = True
    except Exception:
        pass

    try:
        res = supabase.table("corporate_memory").select("id, metadata").eq("content", "password_delegated_roles").execute()
        existing_ids = []
        record_id = None
        if res.data and len(res.data) > 0:
            record_id = res.data[0]["id"]
            existing_ids = res.data[0].get("metadata", {}).get("role_ids", []) or []

        if req.can_manage_passwords:
            if role_id not in existing_ids:
                existing_ids.append(role_id)
        else:
            existing_ids = [rid for rid in existing_ids if rid != role_id]

        payload = {"source": "system_permissions", "role_ids": existing_ids}
        if record_id:
            supabase.table("corporate_memory").update({"metadata": payload}).eq("id", record_id).execute()
        else:
            supabase.table("corporate_memory").insert({
                "content": "password_delegated_roles",
                "metadata": payload
            }).execute()

        return {"status": "success", "role_id": role_id, "can_manage_passwords": req.can_manage_passwords}
    except Exception as e:
        if updated_in_roles:
            return {"status": "success", "role_id": role_id, "can_manage_passwords": req.can_manage_passwords}
        raise HTTPException(status_code=400, detail=f"Error al guardar permisos: {str(e)}")

# --- Módulo de Verificación de Identidad (Foto de Perfil) ---
class VerificationPhotoRequest(BaseModel):
    user_id: str
    photo: str

@app.post("/api/v1/user/verification-photo")
def save_verification_photo(req: VerificationPhotoRequest, user=Depends(verify_jwt)):
    if user.id != req.user_id:
        require_admin_or_manager(user)
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend")

    # 1. Intentar actualizar en la tabla profiles
    try:
        supabase.table("profiles").update({
            "verification_photo": req.photo,
            "avatar_url": req.photo,
            "welcome_seen": True
        }).eq("id", req.user_id).execute()
    except Exception:
        try:
            supabase.table("profiles").update({"welcome_seen": True}).eq("id", req.user_id).execute()
        except Exception:
            pass

    # 2. Guardar en corporate_memory para respaldo
    try:
        existing = supabase.table("corporate_memory").select("id").eq("content", f"verification_photo:{req.user_id}").execute()
        payload = {
            "type": "verification_photo",
            "user_id": req.user_id,
            "photo": req.photo
        }
        if existing.data and len(existing.data) > 0:
            rec_id = existing.data[0]["id"]
            supabase.table("corporate_memory").update({"metadata": payload}).eq("id", rec_id).execute()
        else:
            supabase.table("corporate_memory").insert({
                "content": f"verification_photo:{req.user_id}",
                "metadata": payload
            }).execute()
    except Exception:
        pass

    return {"status": "success", "user_id": req.user_id}

# --- Módulo de Administración: Áreas y Cargos (borrado) ---
# Requiere JWT válido + is_master_admin=true en el perfil -- borrar un área o
# un cargo reestructura la organización entera, así que queda al mismo nivel
# de exigencia que crear cuentas Admin Master (ver RolePermissionManager.vue).
def require_master_admin(user):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no configurado en el backend")
    res = supabase.table("profiles").select("is_master_admin").eq("id", user.id).single().execute()
    if not res.data or not res.data.get("is_master_admin"):
        raise HTTPException(status_code=403, detail="Esta acción es exclusiva del Admin Master.")

@app.delete("/api/v1/admin/areas/{area_id}")
def delete_area(area_id: str, user=Depends(verify_jwt)):
    require_master_admin(user)
    roles_res = supabase.table("roles").select("id", count="exact").eq("area_id", area_id).execute()
    role_count = roles_res.count or 0
    if role_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar: el área todavía tiene {role_count} cargo(s) asignado(s). Eliminalos o movelos a otra área primero."
        )
    try:
        supabase.table("areas").delete().eq("id", area_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo eliminar el área: {str(e)}")

@app.delete("/api/v1/admin/roles/{role_id}")
def delete_role(role_id: str, user=Depends(verify_jwt)):
    require_master_admin(user)
    members_res = supabase.table("profiles").select("id", count="exact").eq("role_id", role_id).execute()
    member_count = members_res.count or 0
    if member_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar: todavía hay {member_count} persona(s) con este cargo. Reasignalas a otro cargo o eliminá sus cuentas primero."
        )
    try:
        supabase.table("roles").delete().eq("id", role_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo eliminar el cargo: {str(e)}")

# --- Módulo de Desempeño: Tareas y KPIs ---
class TaskCreate(BaseModel):
    role_id: str
    title: str
    description: str
    estimated_hours: float

@app.post("/api/v1/tasks")
def create_task(task: TaskCreate, user=Depends(verify_jwt)):
    t = task_manager.create_task(task.role_id, task.title, task.description, task.estimated_hours)
    return {"status": "created", "task": t}

@app.get("/api/v1/tasks/{role_id}")
def get_tasks(role_id: str, user=Depends(verify_jwt)):
    return {"tasks": task_manager.get_tasks_by_role(role_id)}

@app.post("/api/v1/evaluate/{role_id}")
def evaluate_role(role_id: str, user=Depends(verify_jwt)):
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
    user_id: Optional[str] = None # Para cargar la memoria específica
    history: Optional[List[Dict]] = None # Historial de chat

@app.post("/api/v1/chat")
@limiter.limit("10/minute")
def chat_with_agent(request: Request, chat_query: ChatQuery, user=Depends(verify_jwt)):
    # Usamos el id del token JWT para mayor seguridad
    user_id = user.id if user else chat_query.user_id
    agent_key = f"{user_id}_{chat_query.role_id}"
    
    if agent_key not in orchestrator.active_agents:
        # Instanciar el agente leyendo la DB
        orchestrator.spawn_agent({
            "role": chat_query.role_id, 
            "access_level": 3, 
            "area": "Desconocida", 
            "name": "Usuario",
            "user_id": user_id
        })
    
    agent = orchestrator.active_agents[agent_key]
    response = agent.chat(chat_query.query, conversation_history=chat_query.history)
    return {"reply": response}

# --- Generación Automática de KPIs ---
class GenerateKpiRequest(BaseModel):
    area_name: str
    description: Optional[str] = ""

KPI_SYSTEM_INSTRUCTIONS = """Eres un experto en Recursos Humanos y OKRs.
El usuario te dará el nombre de un área o cargo (y opcionalmente una descripción).
Tu tarea es sugerir 3 a 5 KPIs (Indicadores Clave de Rendimiento) profesionales y realistas para ese cargo.
Responde EXCLUSIVAMENTE en JSON válido con este esquema:
{
  "kpis": [
    {
      "name": "Nombre del KPI (ej. Cumplimiento de Ventas)",
      "meta_label": "Valor meta (ej. 100%, $5000, 10)",
      "meta_type": "percentage" | "currency" | "count" | "text"
    }
  ]
}"""

@app.post("/api/v1/generate-kpis")
@limiter.limit("5/minute")
def generate_kpis(request: Request, req: GenerateKpiRequest, user=Depends(verify_jwt)):
    if not anthropic:
        raise HTTPException(status_code=500, detail="Anthropic no configurado")
    
    user_prompt = f"Cargo o Área: {req.area_name}\nDescripción adicional: {req.description}"
    
    try:
        ai_response = anthropic.messages.create(
            model=claude_model,
            max_tokens=1000,
            system=KPI_SYSTEM_INSTRUCTIONS,
            messages=[{"role": "user", "content": user_prompt}]
        )
        
        text_block = next((b for b in ai_response.content if b.type == 'text'), None)
        if not text_block:
            raise HTTPException(status_code=502, detail="No se obtuvo texto del modelo")

        raw_json = text_block.text.strip()
        if raw_json.startswith("```"):
            lines = raw_json.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            raw_json = "\n".join(lines).strip()

        data = json.loads(raw_json)
        return data

    except Exception as e:
        print(f"Error generando KPIs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
@limiter.limit("5/minute")
def extract_workflow(request: Request, req: ExtractWorkflowRequest, user=Depends(verify_jwt)):
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
