from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app, verify_jwt
from services.project_kanban_service import (
    DEFAULT_KANBAN_COLUMNS,
    ProjectKanbanService,
    calculate_project_edt_progress,
)

client = TestClient(app)


def override_verify_jwt():
    return MagicMock(id="leader_1")


app.dependency_overrides[verify_jwt] = override_verify_jwt


def test_calculate_weighted_edt_progress_hierarchy():
    # Fase padre 1.0 tiene hijos 1.1 (peso 30) y 1.2 (peso 50); fase 2.0 tiene hijo 2.1 (peso 20).
    # Total peso hojas = 100. Solo hojas cuentan para no duplicar peso de fases padre.
    edt_items = [
        {"id": "p1", "parent_id": None, "edt_code": "1.0", "title": "Fase 1", "status": "todo", "weight": 80},
        {"id": "c1", "parent_id": "p1", "edt_code": "1.1", "title": "Diseño", "status": "completed", "weight": 30},
        {"id": "c2", "parent_id": "p1", "edt_code": "1.2", "title": "Desarrollo", "status": "in_progress", "weight": 50},
        {"id": "p2", "parent_id": None, "edt_code": "2.0", "title": "Fase 2", "status": "todo", "weight": 20},
        {"id": "c3", "parent_id": "p2", "edt_code": "2.1", "title": "Pruebas", "status": "in_review", "weight": 20},
    ]

    summary = calculate_project_edt_progress(edt_items, DEFAULT_KANBAN_COLUMNS)

    assert summary["total_weight"] == 100.0
    assert summary["completed_weight"] == 30.0
    assert summary["percentage"] == 30.0
    assert summary["completed_count"] == 1
    assert summary["total_count"] == 3
    assert summary["parent_progress"]["p1"]["percentage"] == 37.5
    assert summary["parent_progress"]["p2"]["percentage"] == 0.0


def test_transition_edt_status_recalculates_and_persists_progress():
    mock_supa = MagicMock()

    state = {
        "project": {
            "id": "prj_1",
            "kanban_columns": DEFAULT_KANBAN_COLUMNS,
            "progress_percentage": 0.0,
        },
        "items": [
            {"id": "p1", "project_id": "prj_1", "parent_id": None, "edt_code": "1.0", "title": "Fase 1", "status": "todo", "weight": 100},
            {"id": "c1", "project_id": "prj_1", "parent_id": "p1", "edt_code": "1.1", "title": "Entregable A", "status": "todo", "weight": 25},
            {"id": "c2", "project_id": "prj_1", "parent_id": "p1", "edt_code": "1.2", "title": "Entregable B", "status": "todo", "weight": 75},
        ],
    }

    def table_router(name):
        tbl = MagicMock()
        if name == "project_edt_items":
            def select_fn(*_a):
                chain = MagicMock()
                def eq_fn(col, val):
                    sub = MagicMock()
                    if col == "id":
                        found = next((i for i in state["items"] if i["id"] == val), None)
                        sub.single.return_value = sub
                        sub.execute.return_value = MagicMock(data=found)
                    else:
                        sub.execute.return_value = MagicMock(data=state["items"])
                    return sub
                chain.eq.side_effect = eq_fn
                return chain

            def update_fn(payload):
                chain = MagicMock()
                def eq_fn(_col, val):
                    for item in state["items"]:
                        if item["id"] == val:
                            item.update(payload)
                            res_data = [item]
                            break
                    else:
                        res_data = []
                    sub = MagicMock()
                    sub.execute.return_value = MagicMock(data=res_data)
                    return sub
                chain.eq.side_effect = eq_fn
                return chain

            tbl.select.side_effect = select_fn
            tbl.update.side_effect = update_fn

        elif name == "projects":
            tbl.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
                data=state["project"]
            )
            def proj_update(payload):
                chain = MagicMock()
                def eq_fn(_col, _val):
                    state["project"].update(payload)
                    sub = MagicMock()
                    sub.execute.return_value = MagicMock(data=[state["project"]])
                    return sub
                chain.eq.side_effect = eq_fn
                return chain
            tbl.update.side_effect = proj_update

        return tbl

    mock_supa.table.side_effect = table_router

    with patch("main.supabase", mock_supa):
        # 1. Mover 1.1 (peso 25) a "completed" -> avance debe pasar a 25%
        resp1 = client.patch("/api/v1/edt/c1/status", json={"status": "completed"})
        assert resp1.status_code == 200
        assert resp1.json()["progress"]["percentage"] == 25.0
        assert state["project"]["progress_percentage"] == 25.0

        # 2. Mover 1.2 (peso 75) a "completed" -> avance debe pasar a 100%
        resp2 = client.patch("/api/v1/edt/c2/status", json={"status": "completed"})
        assert resp2.status_code == 200
        assert resp2.json()["progress"]["percentage"] == 100.0
        assert state["project"]["progress_percentage"] == 100.0

        # 3. Devolver 1.1 a "in_review" -> avance debe bajar a 75%
        resp3 = client.patch("/api/v1/edt/c1/status", json={"status": "in_review"})
        assert resp3.status_code == 200
        assert resp3.json()["progress"]["percentage"] == 75.0
        assert state["project"]["progress_percentage"] == 75.0

        # 4. Estado inválido rechazado con 400
        resp_bad = client.patch("/api/v1/edt/c1/status", json={"status": "nonexistent_col"})
        assert resp_bad.status_code == 400

