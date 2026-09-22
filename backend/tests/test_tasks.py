from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from main import app, verify_jwt

client = TestClient(app)

# Bypass JWT check for tests
def override_verify_jwt():
    return MagicMock(id="123")

app.dependency_overrides[verify_jwt] = override_verify_jwt

@pytest.fixture
def mock_supabase():
    with patch("performance.task_manager.task_manager.supabase") as mock:
        yield mock

def test_create_task(mock_supabase):
    # Simulate DB insert response
    mock_supabase.table().insert().execute.return_value = MagicMock(
        data=[{"id": "t1", "role_id": "r1", "title": "New Task", "status": "pending"}]
    )

    payload = {
        "role_id": "r1",
        "title": "New Task",
        "description": "Task desc",
        "estimated_hours": 2.5
    }

    response = client.post("/api/v1/tasks", json=payload)
    
    assert response.status_code == 200
    assert response.json()["task"]["id"] == "t1"
    mock_supabase.table.assert_called_with("tasks")

def test_get_tasks_by_role(mock_supabase):
    # Simulate DB select response
    mock_supabase.table().select().eq().execute.return_value = MagicMock(
        data=[{"id": "t1", "title": "Task 1"}]
    )

    response = client.get("/api/v1/tasks/r1")
    
    assert response.status_code == 200
    assert len(response.json()["tasks"]) == 1
    assert response.json()["tasks"][0]["title"] == "Task 1"
