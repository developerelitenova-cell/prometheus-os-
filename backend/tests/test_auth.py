from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException
from main import require_password_manager

class MockUser:
    def __init__(self, id):
        self.id = id

@pytest.fixture
def mock_supabase():
    with patch("main.supabase") as mock:
        yield mock

def test_require_password_manager_master_admin(mock_supabase):
    # Mocking single().execute() to return is_master_admin=True
    mock_execute = mock_supabase.table().select().eq().single().execute
    mock_execute.return_value = MagicMock(data={"is_master_admin": True})
    
    user = MockUser(id="123")
    # Should not raise an exception
    require_password_manager(user)

def test_require_password_manager_access_level_1(mock_supabase):
    mock_execute = mock_supabase.table().select().eq().single().execute
    mock_execute.return_value = MagicMock(data={
        "is_master_admin": False,
        "roles": {"name": "Test", "access_level": 1, "can_manage_passwords": False}
    })
    
    user = MockUser(id="123")
    require_password_manager(user)

def test_require_password_manager_auditor(mock_supabase):
    mock_execute = mock_supabase.table().select().eq().single().execute
    mock_execute.return_value = MagicMock(data={
        "is_master_admin": False,
        "roles": {"name": "Gerente Auditoría", "access_level": 3, "can_manage_passwords": False}
    })
    
    user = MockUser(id="123")
    require_password_manager(user)

def test_require_password_manager_no_access(mock_supabase):
    mock_execute = mock_supabase.table().select().eq().single().execute
    mock_execute.return_value = MagicMock(data={
        "is_master_admin": False,
        "role_id": "role_xyz",
        "roles": {"name": "Empleado", "access_level": 5, "can_manage_passwords": False}
    })
    
    # Mock for corporate memory returning empty or not matching
    mock_execute_mem = mock_supabase.table().select().eq().execute
    mock_execute_mem.return_value = MagicMock(data=[])
    
    user = MockUser(id="123")
    with pytest.raises(HTTPException) as excinfo:
        require_password_manager(user)
    
    assert excinfo.value.status_code == 403
    assert "No tienes permiso delegado" in excinfo.value.detail
