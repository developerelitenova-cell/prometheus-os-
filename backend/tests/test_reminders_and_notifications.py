from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from main import app, verify_jwt
from services.notification_service import NotificationService, EmailDispatcher
from services.reminder_service import (
    BOGOTA_TZ,
    ReminderService,
    compute_reminder_triggers,
    parse_due_datetime_bogota,
)

client = TestClient(app)


def override_verify_jwt():
    return MagicMock(id="admin_1")


app.dependency_overrides[verify_jwt] = override_verify_jwt


def _make_chain_table(rows_by_op=None):
    rows_by_op = rows_by_op or {}
    tbl = MagicMock()
    for method in ("select", "insert", "update", "upsert", "eq", "lte", "single", "order"):
        getattr(tbl, method).return_value = tbl
    tbl.execute.return_value = MagicMock(data=rows_by_op.get("execute", []))
    return tbl


# ------------------------------------------------------------------------------
# Req. 2.1: Tests unitarios de cálculo de triggers (48h, 24h, 2h, <2h, UTC-5)
# ------------------------------------------------------------------------------
def test_compute_three_exact_triggers_america_bogota():
    now_bogota = datetime(2026, 11, 10, 10, 0, 0, tzinfo=BOGOTA_TZ)
    due_bogota = now_bogota + timedelta(hours=72)  # 3 días después en Bogotá

    triggers = compute_reminder_triggers(due_bogota, now=now_bogota)

    assert len(triggers) == 3
    by_type = {t[0]: (t[1], t[2]) for t in triggers}
    assert set(by_type.keys()) == {"48h", "24h", "2h"}

    assert by_type["48h"][0] == (due_bogota - timedelta(hours=48)).astimezone(timezone.utc)
    assert by_type["24h"][0] == (due_bogota - timedelta(hours=24)).astimezone(timezone.utc)
    assert by_type["2h"][0] == (due_bogota - timedelta(hours=2)).astimezone(timezone.utc)
    assert all(is_imm is False for _, is_imm in by_type.values())


def test_parse_due_datetime_bogota_date_and_time():
    dt = parse_due_datetime_bogota("2026-11-15", "14:30")
    assert dt == datetime(2026, 11, 15, 14, 30, 0, tzinfo=BOGOTA_TZ)

    dt_date_only = parse_due_datetime_bogota("2026-11-15")
    assert dt_date_only == datetime(2026, 11, 15, 23, 59, 59, tzinfo=BOGOTA_TZ)


def test_compute_triggers_under_2_hours_fires_immediate():
    now_bogota = datetime(2026, 11, 10, 16, 0, 0, tzinfo=BOGOTA_TZ)
    due_bogota = now_bogota + timedelta(minutes=90)

    triggers = compute_reminder_triggers(due_bogota, now=now_bogota)

    assert len(triggers) == 1
    r_type, trigger_utc, is_immediate = triggers[0]
    assert r_type == "immediate"
    assert is_immediate is True
    assert trigger_utc == now_bogota.astimezone(timezone.utc)


def test_schedule_reschedule_and_cancel_reminders():
    mock_supa = MagicMock()
    tables = {}

    def table_router(name):
        if name not in tables:
            tables[name] = _make_chain_table()
        return tables[name]

    mock_supa.table.side_effect = table_router
    notifier = NotificationService(supabase_client=mock_supa, email_dispatcher=EmailDispatcher())
    service = ReminderService(supabase_client=mock_supa, notifier=notifier)

    now_bogota = datetime(2026, 11, 10, 9, 0, 0, tzinfo=BOGOTA_TZ)
    future_due = (now_bogota + timedelta(hours=72)).isoformat()

    res = service.schedule_task_reminders(
        task_id="task_1",
        assigned_to="emp_1",
        due_date=future_due,
        title="Entregar informe financiero",
        now=now_bogota,
    )

    assert len(res["scheduled"]) == 3
    assert res["immediate_sent"] is False
    assert [r["reminder_type"] for r in res["scheduled"]] == ["48h", "24h", "2h"]
    assert all(r["status"] == "pending" for r in res["scheduled"])

    # Verificar que al reprogramar cancela pendientes previos y recalcula triggers
    new_due = (now_bogota + timedelta(hours=30)).isoformat()
    res_re = service.schedule_task_reminders(
        task_id="task_1",
        assigned_to="emp_1",
        due_date=new_due,
        title="Entregar informe financiero",
        now=now_bogota,
    )
    # 48h ya quedó en el pasado; solo 24h y 2h aplican
    assert [r["reminder_type"] for r in res_re["scheduled"]] == ["24h", "2h"]
    tables["task_reminders"].update.assert_called()


def test_schedule_under_2h_dispatches_immediate_notification():
    mock_supa = MagicMock()
    tables = {}

    def table_router(name):
        if name not in tables:
            tables[name] = _make_chain_table()
        return tables[name]

    mock_supa.table.side_effect = table_router
    notifier = NotificationService(supabase_client=mock_supa, email_dispatcher=EmailDispatcher())
    service = ReminderService(supabase_client=mock_supa, notifier=notifier)

    now_bogota = datetime(2026, 11, 10, 15, 0, 0, tzinfo=BOGOTA_TZ)
    due_soon = (now_bogota + timedelta(minutes=45)).isoformat()

    res = service.schedule_task_reminders(
        task_id="task_urgent",
        assigned_to="emp_1",
        due_date=due_soon,
        title="Aprobar nómina",
        now=now_bogota,
    )

    assert res["immediate_sent"] is True
    assert len(res["scheduled"]) == 1
    assert res["scheduled"][0]["reminder_type"] == "immediate"
    assert res["scheduled"][0]["status"] == "sent"
    tables["notifications"].insert.assert_called_once()
    notif_payload = tables["notifications"].insert.call_args[0][0]
    assert notif_payload["type"] == "due_reminder"
    assert notif_payload["profile_id"] == "emp_1"


def test_process_due_reminders_sends_pending_and_cancels_completed():
    mock_supa = MagicMock()
    rem_table = MagicMock()
    tasks_table = MagicMock()
    notif_table = MagicMock()

    now_bogota = datetime(2026, 11, 10, 12, 0, 0, tzinfo=BOGOTA_TZ)

    # 2 recordatorios vencidos: uno de tarea pendiente y otro de tarea ya completada
    pending_reminders = [
        {"id": "rem_1", "task_id": "t_open", "profile_id": "emp_1", "reminder_type": "24h", "trigger_at": "2026-11-10T16:00:00+00:00"},
        {"id": "rem_2", "task_id": "t_done", "profile_id": "emp_1", "reminder_type": "2h", "trigger_at": "2026-11-10T16:30:00+00:00"},
    ]

    rem_select_chain = MagicMock()
    rem_select_chain.eq.return_value = rem_select_chain
    rem_select_chain.lte.return_value = rem_select_chain
    rem_select_chain.execute.return_value = MagicMock(data=pending_reminders)
    rem_table.select.return_value = rem_select_chain

    rem_update_chain = MagicMock()
    rem_update_chain.eq.return_value = rem_update_chain
    rem_update_chain.execute.return_value = MagicMock(data=[{}])
    rem_table.update.return_value = rem_update_chain

    def task_select(*_args):
        chain = MagicMock()
        def eq_fn(_col, val):
            sub = MagicMock()
            sub.single.return_value = sub
            if val == "t_open":
                sub.execute.return_value = MagicMock(data={
                    "id": "t_open", "title": "Reporte Diario", "status": "pending",
                    "due_date": "2026-11-11", "due_time": "12:00:00", "assigned_to": "emp_1"
                })
            else:
                sub.execute.return_value = MagicMock(data={
                    "id": "t_done", "title": "Tarea Terminada", "status": "completed",
                    "due_date": "2026-11-10", "due_time": "14:00:00", "assigned_to": "emp_1"
                })
            return sub
        chain.eq.side_effect = eq_fn
        return chain

    tasks_table.select.side_effect = task_select
    notif_table.insert.return_value.execute.return_value = MagicMock(data=[{"id": "n1"}])

    def router(name):
        if name == "task_reminders":
            return rem_table
        if name == "tasks":
            return tasks_table
        if name == "notifications":
            return notif_table
        return _make_chain_table()

    mock_supa.table.side_effect = router
    notifier = NotificationService(supabase_client=mock_supa, email_dispatcher=EmailDispatcher())
    service = ReminderService(supabase_client=mock_supa, notifier=notifier)

    stats = service.process_due_reminders(now=now_bogota)

    assert stats == {"processed": 2, "sent": 1, "cancelled": 1}
    notif_table.insert.assert_called_once()
    assert notif_table.insert.call_args[0][0]["type"] == "due_reminder"


# ------------------------------------------------------------------------------
# Req. 2.6: Notificaciones al asignar tarea y al modificar cargo/empleado
# ------------------------------------------------------------------------------
def test_create_task_endpoint_notifies_and_schedules_reminders():
    mock_supa = MagicMock()
    tables = {}

    def router(name):
        if name not in tables:
            tables[name] = _make_chain_table()
        return tables[name]

    mock_supa.table.side_effect = router
    future_due = (datetime.now(BOGOTA_TZ) + timedelta(hours=72)).strftime("%Y-%m-%d")

    with patch("main.supabase", mock_supa), patch("performance.task_manager.task_manager.supabase", mock_supa):
        tables["tasks"] = _make_chain_table({"execute": [{"id": "task_99", "title": "Auditar KPI", "status": "pending"}]})
        resp = client.post(
            "/api/v1/tasks",
            json={
                "role_id": "role_1",
                "title": "Auditar KPI",
                "description": "Revisar métricas",
                "assigned_to": "emp_42",
                "due_date": future_due,
                "priority": "high",
            },
        )

    assert resp.status_code == 200
    assert resp.json()["task"]["id"] == "task_99"
    # Notificación task_assigned generada
    tables["notifications"].insert.assert_called_once()
    notif = tables["notifications"].insert.call_args[0][0]
    assert notif["profile_id"] == "emp_42"
    assert notif["type"] == "task_assigned"
    # 3 recordatorios creados (48h, 24h, 2h)
    assert tables["task_reminders"].upsert.call_count == 3


def test_update_employee_role_notifies_employee_and_hr():
    mock_supa = MagicMock()
    profiles_tbl = MagicMock()
    roles_tbl = MagicMock()
    notif_tbl = MagicMock()
    audit_tbl = MagicMock()

    # Select previo del perfil + select de RRHH/Master Admin
    prev_profile_chain = MagicMock()
    prev_profile_chain.eq.return_value = prev_profile_chain
    prev_profile_chain.single.return_value = prev_profile_chain
    prev_profile_chain.execute.return_value = MagicMock(data={
        "id": "emp_10",
        "full_name": "Laura Gómez",
        "role_id": "role_old",
        "company": "Elite Nutrition",
        "approval_status": "approved",
        "is_master_admin": False,
        "roles": {"name": "Auxiliar Operativo"},
    })

    hr_list_chain = MagicMock()
    hr_list_chain.execute.return_value = MagicMock(data=[
        {"id": "emp_10", "is_master_admin": False, "roles": {"name": "Coordinador"}},
        {"id": "hr_1", "is_master_admin": False, "roles": {"name": "Analista de RRHH"}},
        {"id": "master_1", "is_master_admin": True, "roles": {"name": "CEO"}},
    ])

    def profiles_select(cols, *_args):
        if "is_master_admin, roles" in cols:
            return hr_list_chain
        return prev_profile_chain

    profiles_tbl.select.side_effect = profiles_select
    profiles_tbl.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    roles_tbl.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"name": "Coordinador de Operaciones"}
    )
    notif_tbl.insert.return_value.execute.return_value = MagicMock(data=[{"id": "n_1"}])
    audit_tbl.insert.return_value.execute.return_value = MagicMock(data=[{"id": "a_1"}])

    def router(name):
        if name == "profiles":
            return profiles_tbl
        if name == "roles":
            return roles_tbl
        if name == "notifications":
            return notif_tbl
        if name == "role_change_audit_logs":
            return audit_tbl
        return _make_chain_table()

    mock_supa.table.side_effect = router

    with patch("main.supabase", mock_supa), patch("main.require_password_manager"):
        resp = client.put(
            "/api/v1/admin/employee/emp_10",
            json={"role_id": "role_new"},
        )

    assert resp.status_code == 200
    # Se debió registrar auditoría y notificar a emp_10 + hr_1 + master_1 (3 notificaciones)
    audit_tbl.insert.assert_called_once()
    assert notif_tbl.insert.call_count == 3
    notified_ids = {call.args[0]["profile_id"] for call in notif_tbl.insert.call_args_list}
    assert notified_ids == {"emp_10", "hr_1", "master_1"}
    assert all(call.args[0]["type"] == "role_updated" for call in notif_tbl.insert.call_args_list)

