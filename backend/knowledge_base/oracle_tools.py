"""
Herramientas de Auditoría e Inspección Empresarial en Tiempo Real para NOVA WORK (Python Backend)
Permite a los Agentes y al Oráculo consultar la base de datos de Supabase antes de emitir respuestas.
"""

from typing import Dict, Any, List
import json

ORACLE_TOOLS_DEFINITIONS = [
    {
        "name": "audit_corporate_knowledge",
        "description": "Ejecuta una auditoría integral en tiempo real sobre la base de datos de NOVA WORK. Devuelve estadísticas reales: total de roles, áreas, roles con flujos mapeados, manuales operativos, KPIs asignados, memorias indexadas y el porcentaje de cobertura global y por área.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "get_area_audit",
        "description": "Obtiene la auditoría detallada de un área específica de la empresa: lista de cargos pertenecientes al área y el estado de sus 4 dimensiones (mapeo de flujo, manual de funciones, KPIs y memoria IA).",
        "input_schema": {
            "type": "object",
            "properties": {
                "area_name": {
                    "type": "string",
                    "description": "Nombre o parte del nombre del área (ej: Comercial, Contabilidad, Pentágono, Gestión Humana, etc.)"
                }
            },
            "required": ["area_name"]
        }
    },
    {
        "name": "get_role_details",
        "description": "Consulta los datos reales de un cargo o rol específico: área a la que pertenece, nivel de acceso, objetivos, tareas mapeadas y KPIs configurados.",
        "input_schema": {
            "type": "object",
            "properties": {
                "role_name": {
                    "type": "string",
                    "description": "Nombre del cargo o rol a consultar (ej: Gerente de Auditoria, Analista de Selección, Asesor Comercial, Líder de Seguridad, etc.)"
                }
            },
            "required": ["role_name"]
        }
    }
]

def execute_oracle_tool(tool_name: str, tool_input: Dict[str, Any], supabase) -> Dict[str, Any]:
    if not supabase:
        return {"error": "Conexión a Supabase no disponible"}

    try:
        if tool_name == "audit_corporate_knowledge":
            return run_audit_corporate_knowledge(supabase)
        elif tool_name == "get_area_audit":
            return run_get_area_audit(tool_input.get("area_name", ""), supabase)
        elif tool_name == "get_role_details":
            return run_get_role_details(tool_input.get("role_name", ""), supabase)
        else:
            return {"error": f"Herramienta desconocida: {tool_name}"}
    except Exception as e:
        return {"error": str(e)}

def run_audit_corporate_knowledge(supabase) -> Dict[str, Any]:
    roles_res = supabase.table("roles").select("id, name, area_id, access_level").execute()
    areas_res = supabase.table("areas").select("id, name").execute()
    workflows_res = supabase.table("role_workflows").select("role_id, kpis").execute()
    manuals_res = supabase.table("manuals").select("role_id").execute()
    kpi_templates_res = supabase.table("kpi_role_templates").select("role_id").execute()
    kpi_assign_res = supabase.table("kpi_assignments").select("role_id").execute()
    memory_res = supabase.table("corporate_memory").select("metadata").execute()
    task_res = supabase.table("role_task_templates").select("role_id").eq("active", True).execute()

    mapped_ids = set(w["role_id"] for w in (workflows_res.data or []) if w.get("role_id"))
    manual_ids = set(m["role_id"] for m in (manuals_res.data or []) if m.get("role_id"))
    kpi_ids = set(t["role_id"] for t in (kpi_templates_res.data or []) if t.get("role_id"))
    kpi_ids.update(a["role_id"] for a in (kpi_assign_res.data or []) if a.get("role_id"))
    for w in (workflows_res.data or []):
        if w.get("kpis") and len(w["kpis"]) > 0:
            kpi_ids.add(w["role_id"])

    memory_count = {}
    for m in (memory_res.data or []):
        meta = m.get("metadata") or {}
        r_id = meta.get("role_id")
        if r_id:
            memory_count[r_id] = memory_count.get(r_id, 0) + 1
    for t in (task_res.data or []):
        r_id = t.get("role_id")
        if r_id:
            memory_count[r_id] = memory_count.get(r_id, 0) + 1

    roles = roles_res.data or []
    areas_data = areas_res.data or []
    areas_summary = []

    for a in areas_data:
        area_roles = [r for r in roles if r.get("area_id") == a["id"]]
        if not area_roles:
            continue
        dim = len(area_roles) * 4
        cov = sum(
            (1 if r["id"] in mapped_ids else 0) +
            (1 if r["id"] in manual_ids else 0) +
            (1 if r["id"] in kpi_ids else 0) +
            (1 if memory_count.get(r["id"], 0) > 0 else 0)
            for r in area_roles
        )
        pct = round((cov / dim) * 100) if dim > 0 else 0
        areas_summary.append({
            "name": a["name"],
            "total_roles": len(area_roles),
            "coverage_pct": pct
        })

    areas_summary.sort(key=lambda x: x["coverage_pct"], reverse=True)

    total_roles = len(roles)
    global_cov = len(mapped_ids) + len(manual_ids) + len(kpi_ids) + len(memory_count)
    total_dim = total_roles * 4
    global_pct = round((global_cov / total_dim) * 100) if total_dim > 0 else 0

    return {
        "total_roles": total_roles,
        "total_areas": len(areas_summary),
        "roles_mapped_workflows": len(mapped_ids),
        "roles_with_manuals": len(manual_ids),
        "roles_with_kpis": len(kpi_ids),
        "roles_with_ai_memory": len(memory_count),
        "global_coverage_percentage": global_pct,
        "areas_ranking": areas_summary
    }

def run_get_area_audit(area_name: str, supabase) -> Dict[str, Any]:
    areas = supabase.table("areas").select("id, name").ilike("name", f"%{area_name}%").execute()
    if not areas.data:
        return {"message": f"No se encontró área que coincida con '{area_name}'."}

    area = areas.data[0]
    roles = supabase.table("roles").select("id, name, access_level").eq("area_id", area["id"]).execute()
    if not roles.data:
        return {"area": area["name"], "roles": [], "message": "No hay roles en esta área."}

    role_ids = [r["id"] for r in roles.data]
    wf = supabase.table("role_workflows").select("role_id").in_("role_id", role_ids).execute()
    mn = supabase.table("manuals").select("role_id").in_("role_id", role_ids).execute()
    kp = supabase.table("kpi_role_templates").select("role_id").in_("role_id", role_ids).execute()

    wf_set = set(w["role_id"] for w in (wf.data or []))
    mn_set = set(m["role_id"] for m in (mn.data or []))
    kp_set = set(k["role_id"] for k in (kp.data or []))

    detailed = []
    for r in roles.data:
        detailed.append({
            "name": r["name"],
            "tiene_flujo": r["id"] in wf_set,
            "tiene_manual": r["id"] in mn_set,
            "tiene_kpi": r["id"] in kp_set
        })

    return {
        "area": area["name"],
        "total_roles": len(roles.data),
        "roles": detailed
    }

def run_get_role_details(role_name: str, supabase) -> Dict[str, Any]:
    res = supabase.table("roles").select("id, name, area_id, access_level, objective, areas(name)").ilike("name", f"%{role_name}%").limit(1).execute()
    if not res.data:
        return {"message": f"No se encontró el cargo '{role_name}'."}

    role = res.data[0]
    wf = supabase.table("role_workflows").select("*").eq("role_id", role["id"]).maybe_single().execute()
    kp = supabase.table("kpi_role_templates").select("*").eq("role_id", role["id"]).execute()
    users = supabase.table("profiles").select("full_name, approval_status").eq("role_id", role["id"]).execute()

    return {
        "nombre": role["name"],
        "area": role.get("areas", {}).get("name") if role.get("areas") else "No asignada",
        "nivel_acceso": role.get("access_level"),
        "objetivo": role.get("objective") or "Sin objetivo definido",
        "flujo_mapeado": wf.data if wf.data else "No mapeado",
        "kpis": kp.data or [],
        "colaboradores": users.data or []
    }
