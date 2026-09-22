from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from main import app, verify_jwt, require_password_manager

client = TestClient(app)

class MockUser:
    def __init__(self, id):
        self.id = id

# Sobrescribimos la verificación del token JWT
def override_verify_jwt():
    return MockUser(id="123")

app.dependency_overrides[verify_jwt] = override_verify_jwt

@pytest.fixture(autouse=True)
def mock_require_password_manager():
    with patch("main.require_password_manager") as mock:
        yield mock

@pytest.fixture
def mock_supabase():
    with patch("main.supabase") as mock:
        yield mock

def test_create_employee_success(mock_supabase):
    # Setup mocks
    # 1. Auth Admin mock
    mock_auth_res = MagicMock()
    mock_auth_res.user.id = "new_user_123"
    mock_supabase.auth.admin.create_user.return_value = mock_auth_res
    
    # 2. Database insert mock
    mock_supabase.table().insert().execute.return_value = MagicMock()

    payload = {
        "full_name": "Test Employee",
        "email": "test@elitenutrition.com",
        "password": "Password123!",
        "role_id": "role_123",
        "is_master_admin": False
    }

    response = client.post("/api/v1/admin/create-employee", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "created"
    assert response.json()["user_id"] == "new_user_123"
    
    # Verifica que se llamó a Supabase Auth y a la tabla profiles
    mock_supabase.auth.admin.create_user.assert_called_once()
    mock_supabase.table.assert_called_with("profiles")

def test_create_employee_master_admin_denied(mock_supabase):
    # Simulamos que el usuario que intenta crear no es un master admin
    mock_execute = mock_supabase.table().select().eq().single().execute
    mock_execute.return_value = MagicMock(data={"is_master_admin": False})

    payload = {
        "full_name": "Rogue Admin",
        "email": "rogue@elitenutrition.com",
        "password": "Password123!",
        "role_id": "role_123",
        "is_master_admin": True # Intentando elevar privilegios ilegalmente
    }

    response = client.post("/api/v1/admin/create-employee", json=payload)
    
    assert response.status_code == 403
    assert "Sólo un Master Admin" in response.json()["detail"]

def test_create_employee_rollback_on_profile_error(mock_supabase):
    # 1. Auth Admin mock (pasa bien)
    mock_auth_res = MagicMock()
    mock_auth_res.user.id = "new_user_error"
    mock_supabase.auth.admin.create_user.return_value = mock_auth_res
    
    # 2. Database insert mock (falla)
    mock_supabase.table().insert().execute.side_effect = Exception("Database error")

    payload = {
        "full_name": "Error Employee",
        "email": "error@elitenutrition.com",
        "password": "Password123!",
        "role_id": "role_123",
        "is_master_admin": False
    }

    response = client.post("/api/v1/admin/create-employee", json=payload)
    
    assert response.status_code == 400
    assert "Error creando el perfil" in response.json()["detail"]
    
    # Verificamos el ROLLBACK: debió llamarse a delete_user
    mock_supabase.auth.admin.delete_user.assert_called_once_with("new_user_error")
