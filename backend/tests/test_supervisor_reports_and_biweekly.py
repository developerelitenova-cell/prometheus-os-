from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app, verify_jwt
from services.kpi_engine import get_period_bounds_bogota

client = TestClient(app)


def test_period_bounds_bogota_biweekly():
    q1_start, q1_end, q1_lbl = get_period_bounds_bogota("biweekly", "2026-11-10")
    assert (q1_start, q1_end) == ("2026-11-01", "2026-11-15")
    assert q1_lbl == "Quincena 1 (2026-11)"

    q2_start, q2_end, q2_lbl = get_period_bounds_bogota("biweekly", "2026-11-20")
    assert (q2_start, q2_end) == ("2026-11-16", "2026-11-30")
    assert q2_lbl == "Quincena 2 (2026-11)"

    feb_start, feb_end, _ = get_period_bounds_bogota("biweekly", "2024-02-20")
    assert (feb_start, feb_end) == ("2024-02-16", "2024-02-29")


def test_send_report_to_explicit_supervisor():
    mock_supa = MagicMock()
    inserted_notifications = []

    def table_router(name):
        tbl = MagicMock()
        if name == "profiles":
            chain = MagicMock()
            chain.eq.return_value.single.return_value.execute.return_value = MagicMock(
                data={
                    "id": "emp_1",
                    "full_name": "Ana María",
                    "roles": {"name": "Asistente Presidencia"},
                }
            )
            chain.single.return_value.execute.return_value = MagicMock(
                data={"email": "jefe@novawork.local"}
            )
            tbl.select.return_value = chain
        elif name == "notifications":
            def insert_fn(payload):
                inserted_notifications.append(payload)
                res = MagicMock()
                res.execute.return_value = MagicMock(data=[payload])
                return res

            tbl.insert.side_effect = insert_fn
        return tbl

    mock_supa.table.side_effect = table_router

    prev_override = app.dependency_overrides.get(verify_jwt)
    app.dependency_overrides[verify_jwt] = lambda: MagicMock(id="emp_1")
    try:
        with patch("main.supabase", mock_supa):
            resp = client.post(
                "/api/v1/reports/send-to-supervisor",
                json={
                    "supervisor_id": "sup_1",
                    "date_str": "2026-11-20",
                    "compliance_percentage": 92.5,
                    "completed_tasks": 9,
                    "total_tasks": 10,
                    "unfulfilled_tasks": 1,
                    "export_format": "excel",
                    "notes": "Todo al día.",
                },
            )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "sent"
        assert body["recipients"] == ["sup_1"]
        assert body["notification_count"] == 1

        assert len(inserted_notifications) == 1
        notif = inserted_notifications[0]
        assert notif["profile_id"] == "sup_1"
        assert notif["type"] == "message"
        assert notif["action_url"] == "/workspace?view_as=emp_1"
        assert "Ana María" in notif["message"]
        assert "92.5%" in notif["message"]
        assert "EXCEL" in notif["message"]
    finally:
        if prev_override is not None:
            app.dependency_overrides[verify_jwt] = prev_override
        else:
            app.dependency_overrides.pop(verify_jwt, None)


def test_send_report_auto_resolves_area_leader_and_forbids_impersonation():
    profiles_list = [
        {
            "id": "emp_1",
            "full_name": "Ana María",
            "email": "ana@novawork.local",
            "is_master_admin": False,
            "role_id": "r_asist",
            "roles": {"id": "r_asist", "name": "Asistente", "area_id": "area_pres", "access_level": 3},
        },
        {
            "id": "leader_pres",
            "full_name": "Coordinador Presidencia",
            "email": "coord@novawork.local",
            "is_master_admin": False,
            "role_id": "r_coord",
            "roles": {"id": "r_coord", "name": "Coordinador", "area_id": "area_pres", "access_level": 2},
        },
        {
            "id": "other_leader",
            "full_name": "Líder Operaciones",
            "email": "ops@novawork.local",
            "is_master_admin": False,
            "role_id": "r_ops",
            "roles": {"id": "r_ops", "name": "Líder Ops", "area_id": "area_ops", "access_level": 2},
        },
    ]

    mock_supa = MagicMock()
    inserted_notifications = []

    def table_router(name):
        tbl = MagicMock()
        if name == "profiles":
            chain = MagicMock()
            chain.eq.return_value.single.return_value.execute.return_value = MagicMock(
                data=profiles_list[0]
            )
            chain.execute.return_value = MagicMock(data=profiles_list)
            tbl.select.return_value = chain
        elif name == "notifications":
            def insert_fn(payload):
                inserted_notifications.append(payload)
                res = MagicMock()
                res.execute.return_value = MagicMock(data=[payload])
                return res

            tbl.insert.side_effect = insert_fn
        return tbl

    mock_supa.table.side_effect = table_router

    prev_override = app.dependency_overrides.get(verify_jwt)
    app.dependency_overrides[verify_jwt] = lambda: MagicMock(id="emp_1")
    try:
        with patch("main.supabase", mock_supa):
            # A. Resolución automática de jefe directo en la misma área
            resp = client.post(
                "/api/v1/reports/send-to-supervisor",
                json={
                    "date_str": "2026-11-20",
                    "compliance_percentage": 100.0,
                    "completed_tasks": 5,
                    "total_tasks": 5,
                    "export_format": "word",
                },
            )
            assert resp.status_code == 200
            assert resp.json()["recipients"] == ["leader_pres"]
            assert inserted_notifications[0]["profile_id"] == "leader_pres"

            # B. Colaborador regular no puede enviar reporte suplantando a otro empleado
            forbidden_resp = client.post(
                "/api/v1/reports/send-to-supervisor",
                json={
                    "employee_id": "other_emp",
                    "date_str": "2026-11-20",
                    "compliance_percentage": 100.0,
                    "completed_tasks": 5,
                    "total_tasks": 5,
                },
            )
            assert forbidden_resp.status_code == 403
    finally:
        if prev_override is not None:
            app.dependency_overrides[verify_jwt] = prev_override
        else:
            app.dependency_overrides.pop(verify_jwt, None)
