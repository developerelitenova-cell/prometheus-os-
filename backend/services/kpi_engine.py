"""
Motor de medición automática de KPI a partir de actividades programadas vs. ejecutadas (Req. 2.8).
Zona horaria operativa: America/Bogota (UTC-5).
Períodos soportados: weekly, biweekly, monthly, quarterly.
"""

from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from services.reminder_service import BOGOTA_TZ, get_bogota_now, parse_due_datetime_bogota


KPI_CATALOG: Dict[str, Dict[str, Any]] = {
    "compliance_rate": {
        "key": "compliance_rate",
        "name": "Tasa de Cumplimiento",
        "formula": "(Actividades ejecutadas / Total programadas aplicables) * 100",
        "target": 85.0,
        "operator": ">=",
        "unit": "%",
    },
    "on_time_rate": {
        "key": "on_time_rate",
        "name": "Puntualidad",
        "formula": "(Actividades ejecutadas a tiempo / Total ejecutadas) * 100",
        "target": 80.0,
        "operator": ">=",
        "unit": "%",
    },
    "overdue_rate": {
        "key": "overdue_rate",
        "name": "Tasa de Vencidas",
        "formula": "(Actividades vencidas pendientes / Total programadas aplicables) * 100",
        "target": 10.0,
        "operator": "<=",
        "unit": "%",
    },
}

NA_STATUSES = {"not_applicable", "na", "n/a", "cancelled", "exempt"}


def get_period_bounds_bogota(
    period_type: str,
    reference_date: Optional[str] = None,
    now: Optional[datetime] = None,
) -> Tuple[str, str, str]:
    """
    Calcula (start_date_str, end_date_str, label) en America/Bogota para:
      - weekly (lunes a domingo)
      - biweekly (quincena 1-15 o 16-fin de mes)
      - monthly (día 1 a último día del mes)
      - quarterly (Q1..Q4)
    """
    if reference_date:
        ref = date.fromisoformat(reference_date.strip()[:10])
    else:
        ref = get_bogota_now(now).date()

    p_type = (period_type or "monthly").lower()
    if p_type == "weekly":
        start = ref - timedelta(days=ref.weekday())
        end = start + timedelta(days=6)
        iso_year, iso_week, _ = start.isocalendar()
        return start.isoformat(), end.isoformat(), f"Semana {iso_year}-W{iso_week:02d}"

    if p_type == "biweekly":
        if ref.day <= 15:
            start = date(ref.year, ref.month, 1)
            end = date(ref.year, ref.month, 15)
            return start.isoformat(), end.isoformat(), f"Quincena 1 ({ref.year}-{ref.month:02d})"
        last_day = monthrange(ref.year, ref.month)[1]
        start = date(ref.year, ref.month, 16)
        end = date(ref.year, ref.month, last_day)
        return start.isoformat(), end.isoformat(), f"Quincena 2 ({ref.year}-{ref.month:02d})"

    if p_type == "quarterly":
        q = (ref.month - 1) // 3 + 1
        start_month = (q - 1) * 3 + 1
        end_month = start_month + 2
        start = date(ref.year, start_month, 1)
        last_day = monthrange(ref.year, end_month)[1]
        end = date(ref.year, end_month, last_day)
        return start.isoformat(), end.isoformat(), f"Trimestre {ref.year}-Q{q}"

    # monthly (por defecto)
    start = date(ref.year, ref.month, 1)
    last_day = monthrange(ref.year, ref.month)[1]
    end = date(ref.year, ref.month, last_day)
    return start.isoformat(), end.isoformat(), f"Mes {ref.year}-{ref.month:02d}"


def _evaluate_target(value: Optional[float], target: float, operator: str) -> str:
    if value is None:
        return "na"
    if operator == ">=":
        return "pass" if value >= target else "fail"
    if operator == "<=":
        return "pass" if value <= target else "fail"
    return "na"


def _is_completed_on_time(activity: Dict[str, Any]) -> bool:
    due_date = activity.get("due_date")
    completed_at = activity.get("completed_at")
    if not due_date or not completed_at:
        return True
    due_dt = parse_due_datetime_bogota(due_date, activity.get("due_time"))
    comp_dt = parse_due_datetime_bogota(completed_at)
    if not due_dt or not comp_dt:
        return True
    return comp_dt <= due_dt


def _is_overdue_pending(activity: Dict[str, Any], now_bogota: datetime) -> bool:
    status = (activity.get("status") or "pending").lower()
    if status not in ("pending", "in_progress"):
        return False
    due_date = activity.get("due_date")
    if not due_date:
        return False
    due_dt = parse_due_datetime_bogota(due_date, activity.get("due_time"))
    if not due_dt:
        return False
    return due_dt < now_bogota


def calculate_kpis_from_activities(
    activities: List[Dict[str, Any]],
    now: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Calcula los 3 KPI del catálogo sobre una lista normalizada de actividades.
    - Actividades con status en NA_STATUSES se excluyen del denominador sin penalizar.
    - Si no hay actividades aplicables, los KPIs retornan value=None y status='na'.
    """
    now_bogota = get_bogota_now(now)

    applicable: List[Dict[str, Any]] = []
    na_excluded = 0
    for act in activities:
        status = (act.get("status") or "pending").lower()
        if status in NA_STATUSES or act.get("is_applicable") is False:
            na_excluded += 1
            continue
        applicable.append(act)

    total_applicable = len(applicable)
    completed_items = [a for a in applicable if (a.get("status") or "").lower() == "completed"]
    completed_count = len(completed_items)
    on_time_count = sum(1 for a in completed_items if _is_completed_on_time(a))
    overdue_items = [a for a in applicable if _is_overdue_pending(a, now_bogota)]
    overdue_count = len(overdue_items)

    if total_applicable == 0:
        compliance_val = None
        on_time_val = None
        overdue_val = None
    else:
        compliance_val = round((completed_count / total_applicable) * 100, 2)
        on_time_val = round((on_time_count / completed_count) * 100, 2) if completed_count > 0 else 0.0
        overdue_val = round((overdue_count / total_applicable) * 100, 2)

    values_map = {
        "compliance_rate": compliance_val,
        "on_time_rate": on_time_val,
        "overdue_rate": overdue_val,
    }

    kpis = []
    for key, meta in KPI_CATALOG.items():
        val = values_map[key]
        kpis.append({
            **meta,
            "value": val,
            "status": _evaluate_target(val, meta["target"], meta["operator"]),
        })

    return {
        "summary": {
            "total_scheduled": total_applicable,
            "na_excluded": na_excluded,
            "completed": completed_count,
            "on_time": on_time_count,
            "overdue": overdue_count,
        },
        "kpis": kpis,
        "overdue_items": overdue_items,
    }


class KpiEngineService:
    """Servicio que consulta actividades reales en Supabase y genera reportes de KPI."""

    def __init__(self, supabase_client=None):
        self.supabase = supabase_client

    def initialize_clients(self, supabase_client):
        self.supabase = supabase_client

    def compute_report(
        self,
        period_type: str = "monthly",
        reference_date: Optional[str] = None,
        area_id: Optional[str] = None,
        user_id: Optional[str] = None,
        scope_area_id: Optional[str] = None,
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        if not self.supabase:
            raise RuntimeError("Supabase client not initialized")

        start_str, end_str, period_label = get_period_bounds_bogota(period_type, reference_date, now=now)

        # 1. Cargar perfiles y áreas
        prof_res = (
            self.supabase.table("profiles")
            .select("id, full_name, role_id, roles(id, name, area_id, areas(id, name))")
            .execute()
        )
        profiles = prof_res.data or []
        profiles_map = {p["id"]: p for p in profiles}

        effective_area_id = scope_area_id or area_id

        # 2. Cargar tareas asignadas en el rango de fechas
        tasks_res = (
            self.supabase.table("tasks")
            .select("*")
            .gte("due_date", start_str)
            .lte("due_date", end_str)
            .execute()
        )
        raw_tasks = tasks_res.data or []

        activities: List[Dict[str, Any]] = []
        for t in raw_tasks:
            uid = t.get("assigned_to")
            prof = profiles_map.get(uid) or {}
            role_obj = prof.get("roles") or {}
            act_area_id = role_obj.get("area_id")
            act_area_name = (role_obj.get("areas") or {}).get("name") or "General"

            if effective_area_id and act_area_id != effective_area_id:
                continue
            if user_id and uid != user_id:
                continue

            activities.append({
                "id": t.get("id"),
                "title": t.get("title") or "Actividad",
                "status": t.get("status") or "pending",
                "due_date": t.get("due_date"),
                "due_time": t.get("due_time"),
                "completed_at": t.get("completed_at"),
                "assignee_id": uid,
                "assignee_name": prof.get("full_name") or "Sin asignar",
                "area_id": act_area_id,
                "area_name": act_area_name,
            })

        overall = calculate_kpis_from_activities(activities, now=now)

        # Desglose por colaborador
        by_user_map: Dict[str, List[Dict[str, Any]]] = {}
        for act in activities:
            uid = act.get("assignee_id") or "unassigned"
            by_user_map.setdefault(uid, []).append(act)

        by_user: List[Dict[str, Any]] = []
        for uid, u_acts in by_user_map.items():
            u_calc = calculate_kpis_from_activities(u_acts, now=now)
            kpi_dict = {k["key"]: k["value"] for k in u_calc["kpis"]}
            by_user.append({
                "user_id": uid,
                "full_name": u_acts[0]["assignee_name"],
                "area_name": u_acts[0]["area_name"],
                "summary": u_calc["summary"],
                "compliance_rate": kpi_dict["compliance_rate"],
                "on_time_rate": kpi_dict["on_time_rate"],
                "overdue_rate": kpi_dict["overdue_rate"],
            })

        by_user.sort(key=lambda u: (u["compliance_rate"] is None, u["compliance_rate"] or 0))

        bottlenecks = [
            {
                "id": item["id"],
                "title": item["title"],
                "assignee_name": item["assignee_name"],
                "due_date": item["due_date"],
            }
            for item in overall["overdue_items"][:10]
        ]

        return {
            "period": {
                "type": period_type,
                "label": period_label,
                "start_date": start_str,
                "end_date": end_str,
            },
            "filters": {
                "area_id": effective_area_id,
                "user_id": user_id,
            },
            "summary": overall["summary"],
            "kpis": overall["kpis"],
            "by_user": by_user,
            "bottlenecks": bottlenecks,
        }


kpi_engine = KpiEngineService()

