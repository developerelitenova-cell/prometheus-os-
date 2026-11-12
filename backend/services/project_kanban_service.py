"""
Servicio de gestión de Proyectos Kanban y cálculo dinámico de avance EDT.
Fórmula ponderada:
  avance (%) = (Suma de pesos de EDT ejecutables en estado "Completado" / Peso total de EDT ejecutables) * 100
En jerarquía Padre -> Hijo, solo los entregables hoja (sin hijos) se suman en el avance
para evitar doble contabilización; las fases padre calculan su rollup a partir de sus hijos.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set


DEFAULT_KANBAN_COLUMNS: List[Dict[str, Any]] = [
    {"key": "todo", "label": "Por hacer", "is_done": False},
    {"key": "in_progress", "label": "En progreso", "is_done": False},
    {"key": "in_review", "label": "En revisión", "is_done": False},
    {"key": "completed", "label": "Completado", "is_done": True},
]


def get_done_column_keys(kanban_columns: Optional[List[Dict[str, Any]]]) -> Set[str]:
    cols = kanban_columns or DEFAULT_KANBAN_COLUMNS
    done_keys = {c["key"] for c in cols if c.get("is_done") and c.get("key")}
    return done_keys or {"completed"}


def get_executable_edt_items(edt_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Retorna únicamente los EDT ejecutables (nodos hoja sin hijos)."""
    parent_ids = {item["parent_id"] for item in edt_items if item.get("parent_id")}
    return [item for item in edt_items if item["id"] not in parent_ids]


def calculate_project_edt_progress(
    edt_items: List[Dict[str, Any]],
    kanban_columns: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Calcula el avance ponderado general del proyecto y el rollup por cada fase padre.
    """
    done_keys = get_done_column_keys(kanban_columns)
    leaf_items = get_executable_edt_items(edt_items)

    total_weight = sum(float(item.get("weight") or 0) for item in leaf_items)
    completed_weight = sum(
        float(item.get("weight") or 0)
        for item in leaf_items
        if item.get("status") in done_keys
    )
    completed_count = sum(1 for item in leaf_items if item.get("status") in done_keys)

    percentage = round((completed_weight / total_weight) * 100, 2) if total_weight > 0 else 0.0

    # Rollup por cada fase padre
    parent_ids = {item["parent_id"] for item in edt_items if item.get("parent_id")}
    parent_progress: Dict[str, Dict[str, Any]] = {}
    for pid in parent_ids:
        children = [item for item in leaf_items if item.get("parent_id") == pid]
        p_total = sum(float(c.get("weight") or 0) for c in children)
        p_done = sum(float(c.get("weight") or 0) for c in children if c.get("status") in done_keys)
        p_pct = round((p_done / p_total) * 100, 2) if p_total > 0 else 0.0
        parent_progress[pid] = {
            "total_weight": round(p_total, 2),
            "completed_weight": round(p_done, 2),
            "percentage": p_pct,
        }

    return {
        "percentage": percentage,
        "completed_weight": round(completed_weight, 2),
        "total_weight": round(total_weight, 2),
        "completed_count": completed_count,
        "total_count": len(leaf_items),
        "parent_progress": parent_progress,
    }


class ProjectKanbanService:
    """Gestiona proyectos, columnas Kanban y transiciones EDT con persistencia en Supabase."""

    def __init__(self, supabase_client=None):
        self.supabase = supabase_client

    def initialize_clients(self, supabase_client):
        self.supabase = supabase_client

    def recalculate_and_persist_project_progress(self, project_id: str) -> Dict[str, Any]:
        if not self.supabase:
            raise RuntimeError("Supabase client not initialized")

        proj_res = (
            self.supabase.table("projects")
            .select("id, kanban_columns")
            .eq("id", project_id)
            .single()
            .execute()
        )
        project = proj_res.data or {}
        columns = project.get("kanban_columns") or DEFAULT_KANBAN_COLUMNS

        edt_res = (
            self.supabase.table("project_edt_items")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )
        edt_items = edt_res.data or []
        summary = calculate_project_edt_progress(edt_items, columns)

        now_iso = datetime.now(timezone.utc).isoformat()
        self.supabase.table("projects").update(
            {"progress_percentage": summary["percentage"], "updated_at": now_iso}
        ).eq("id", project_id).execute()

        return summary

    def transition_edt_status(
        self,
        edt_id: str,
        target_status: str,
        position: Optional[int] = None,
    ) -> Dict[str, Any]:
        if not self.supabase:
            raise RuntimeError("Supabase client not initialized")

        edt_res = (
            self.supabase.table("project_edt_items")
            .select("*")
            .eq("id", edt_id)
            .single()
            .execute()
        )
        edt_item = edt_res.data
        if not edt_item:
            raise ValueError("EDT item not found")

        project_id = edt_item["project_id"]
        proj_res = (
            self.supabase.table("projects")
            .select("id, kanban_columns")
            .eq("id", project_id)
            .single()
            .execute()
        )
        project = proj_res.data or {}
        columns = project.get("kanban_columns") or DEFAULT_KANBAN_COLUMNS
        valid_keys = {c["key"] for c in columns if c.get("key")}
        if target_status not in valid_keys:
            raise ValueError(f"Estado '{target_status}' no válido para las columnas del proyecto")

        done_keys = get_done_column_keys(columns)
        now_iso = datetime.now(timezone.utc).isoformat()
        update_payload: Dict[str, Any] = {
            "status": target_status,
            "completed_at": now_iso if target_status in done_keys else None,
            "updated_at": now_iso,
        }
        if position is not None:
            update_payload["position"] = position

        upd_res = (
            self.supabase.table("project_edt_items")
            .update(update_payload)
            .eq("id", edt_id)
            .execute()
        )
        updated_item = upd_res.data[0] if upd_res.data else {**edt_item, **update_payload}

        progress_summary = self.recalculate_and_persist_project_progress(project_id)
        return {"item": updated_item, "progress": progress_summary}


project_kanban_service = ProjectKanbanService()

