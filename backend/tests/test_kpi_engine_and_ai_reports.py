import json
from datetime import datetime
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app, verify_jwt
from services.kpi_engine import (
    calculate_kpis_from_activities,
    get_period_bounds_bogota,
)
from services.reminder_service import BOGOTA_TZ
from services.report_ai_agent import ReportAIAgent

client = TestClient(app)


def override_verify_jwt():
    return MagicMock(id="leader_1")


app.dependency_overrides[verify_jwt] = override_verify_jwt


def test_period_bounds_bogota_weekly_monthly_quarterly():
    w_start, w_end, w_lbl = get_period_bounds_bogota("weekly", "2026-11-11")
    assert (w_start, w_end) == ("2026-11-09", "2026-11-15")
    assert "Semana" in w_lbl

    m_start, m_end, m_lbl = get_period_bounds_bogota("monthly", "2026-11-11")
    assert (m_start, m_end) == ("2026-11-01", "2026-11-30")
    assert m_lbl == "Mes 2026-11"

    q_start, q_end, q_lbl = get_period_bounds_bogota("quarterly", "2026-11-11")
    assert (q_start, q_end) == ("2026-10-01", "2026-12-31")
    assert q_lbl == "Trimestre 2026-Q4"


def test_calculate_kpis_from_activities_formulas_targets_and_na_exclusion():
    now_bogota = datetime(2026, 11, 12, 10, 0, 0, tzinfo=BOGOTA_TZ)
    activities = [
        # 1. Completada a tiempo
        {
            "id": "a1",
            "title": "Cierre contable",
            "status": "completed",
            "due_date": "2026-11-10",
            "due_time": "18:00:00",
            "completed_at": "2026-11-10T17:00:00-05:00",
        },
        # 2. Completada a tiempo
        {
            "id": "a2",
            "title": "Conciliación",
            "status": "completed",
            "due_date": "2026-11-11",
            "due_time": "18:00:00",
            "completed_at": "2026-11-11T16:00:00-05:00",
        },
        # 3. Completada tarde
        {
            "id": "a3",
            "title": "Reporte ventas",
            "status": "completed",
            "due_date": "2026-11-09",
            "due_time": "12:00:00",
            "completed_at": "2026-11-09T15:00:00-05:00",
        },
        # 4. Pendiente vencida
        {
            "id": "a4",
            "title": "Inventario",
            "status": "pending",
            "due_date": "2026-11-10",
            "due_time": "18:00:00",
            "assignee_name": "Carlos Ruiz",
        },
        # 5. No aplicable -> excluida del denominador
        {
            "id": "a5",
            "title": "Feriado",
            "status": "not_applicable",
            "due_date": "2026-11-11",
        },
    ]

    res = calculate_kpis_from_activities(activities, now=now_bogota)
    assert res["summary"] == {
        "total_scheduled": 4,
        "na_excluded": 1,
        "completed": 3,
        "on_time": 2,
        "overdue": 1,
    }

    kpis = {k["key"]: k for k in res["kpis"]}
    # 3 / 4 = 75.0% (< 85% -> fail)
    assert kpis["compliance_rate"]["value"] == 75.0
    assert kpis["compliance_rate"]["status"] == "fail"
    # 2 / 3 = 66.67% (< 80% -> fail)
    assert kpis["on_time_rate"]["value"] == 66.67
    assert kpis["on_time_rate"]["status"] == "fail"
    # 1 / 4 = 25.0% (> 10% -> fail)
    assert kpis["overdue_rate"]["value"] == 25.0
    assert kpis["overdue_rate"]["status"] == "fail"


def test_calculate_kpis_empty_or_only_na_returns_na_without_penalizing():
    res = calculate_kpis_from_activities([{"id": "x1", "status": "na"}])
    assert res["summary"]["total_scheduled"] == 0
    assert res["summary"]["na_excluded"] == 1
    for k in res["kpis"]:
        assert k["value"] is None
        assert k["status"] == "na"


def test_get_auto_kpi_report_and_ai_insights_endpoints():
    mock_supa = MagicMock()

    profiles_data = [
        {
            "id": "emp_1",
            "full_name": "Ana Pérez",
            "role_id": "r1",
            "roles": {"id": "r1", "name": "Analista", "area_id": "area_fin", "areas": {"id": "area_fin", "name": "Finanzas"}},
        },
        {
            "id": "emp_2",
            "full_name": "Luis Gómez",
            "role_id": "r2",
            "roles": {"id": "r2", "name": "Bodega", "area_id": "area_log", "areas": {"id": "area_log", "name": "Logística"}},
        },
    ]
    tasks_data = [
        {
            "id": "t1",
            "title": "Flujo de caja",
            "status": "completed",
            "due_date": "2026-11-10",
            "due_time": "18:00:00",
            "completed_at": "2026-11-10T17:00:00-05:00",
            "assigned_to": "emp_1",
        },
        {
            "id": "t2",
            "title": "Pago proveedores",
            "status": "pending",
            "due_date": "2026-11-05",
            "due_time": "18:00:00",
            "assigned_to": "emp_1",
        },
        {
            "id": "t3",
            "title": "Despacho ruta",
            "status": "completed",
            "due_date": "2026-11-10",
            "assigned_to": "emp_2",
        },
    ]

    def table_router(name):
        tbl = MagicMock()
        if name == "profiles":
            # Puede llamarse para _resolve_leader_area_scope (con .eq().single()) o compute_report (sin .eq())
            chain = MagicMock()
            chain.eq.return_value.single.return_value.execute.return_value = MagicMock(
                data={"is_master_admin": True, "roles": {"access_level": 1, "area_id": "area_fin"}}
            )
            chain.execute.return_value = MagicMock(data=profiles_data)
            tbl.select.return_value = chain
        elif name == "tasks":
            chain = MagicMock()
            chain.gte.return_value = chain
            chain.lte.return_value = chain
            chain.execute.return_value = MagicMock(data=tasks_data)
            tbl.select.return_value = chain
        return tbl

    mock_supa.table.side_effect = table_router

    with patch("main.supabase", mock_supa), patch("main.require_admin_or_manager"):
        resp = client.get("/api/v1/kpis/auto?period_type=monthly&reference_date=2026-11-11&area_id=area_fin")
        assert resp.status_code == 200
        report = resp.json()

        # Solo emp_1 pertenece a area_fin -> 2 tareas (1 completada, 1 vencida) -> 50%
        assert report["summary"]["total_scheduled"] == 2
        assert report["summary"]["completed"] == 1
        kpi_map = {k["key"]: k["value"] for k in report["kpis"]}
        assert kpi_map["compliance_rate"] == 50.0
        assert kpi_map["on_time_rate"] == 100.0

        # Probar Agente IA con el payload real del informe
        ai_resp = client.post("/api/v1/reports/ai-insights", json={"report": report})
        assert ai_resp.status_code == 200
        analysis = ai_resp.json()["analysis"]
        assert "50.0%" in analysis["executive_summary"]
        assert "100.0%" in analysis["executive_summary"]
        assert any("Pago proveedores" in b for b in analysis["bottlenecks"])


def test_report_ai_agent_with_anthropic_mock():
    mock_claude = MagicMock()
    mock_claude.messages.create.return_value = MagicMock(
        content=[
            MagicMock(
                text=json.dumps({
                    "executive_summary": "Cumplimiento de 90.0% en Mes 2026-11.",
                    "key_findings": ["Cumplimiento superó la meta de 85%."],
                    "bottlenecks": [],
                    "recommendations": ["Mantener seguimiento semanal."],
                })
            )
        ]
    )
    agent = ReportAIAgent(anthropic_client=mock_claude, claude_model="claude-sonnet-5")
    out = agent.analyze_report({"period": {"label": "Mes 2026-11"}, "summary": {"total_scheduled": 10, "completed": 9}})
    assert out["generated_by"].startswith("claude:")
    assert "90.0%" in out["executive_summary"]

