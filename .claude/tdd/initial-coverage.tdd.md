# TDD Evidence Report: Initial Coverage

## 1. Source Plan
Plan original: `implementation_plan.md` 
Meta: Evaluar cobertura de todo el sistema e implementar infraestructura TDD en el frontend y backend.

## 2. User Journeys
- **As a system auditor**, I want to ensure that only authorized roles can manage access and passwords, so that the corporate data is protected.
- **As a frontend developer**, I want to use reliable password generation logic, so that users get strong, unpredictable initial passwords.

## 3. Task Report
- **Configuración Inicial:** Configurados y probados con éxito Pytest (Backend) y Vitest (Frontend).
- **Cobertura Backend (Auth):** Tests para `require_password_manager` simulan diferentes roles y verifican acceso delegado o maestro.
- **Cobertura Backend (Gestión de Miembros):** Creadas pruebas de integración para el endpoint `create_employee`. Validados 3 escenarios: Creación exitosa, Intento de escalada de privilegios a Master Admin (Rechazado) y manejo de errores (Rollback borrando el usuario de autenticación si falla la Base de Datos).
- **Cobertura Frontend:** `generateRandomPassword` testeado por longitud, aleatoriedad y caracteres no confusos.

## 4. Test Specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|--------------------|----------------------|-----------|--------|----------|
| 1 | Master admin bypasses role checks | `test_auth.py:test_require_password_manager_master_admin` | unit/auth | PASS | `pytest tests/test_auth.py` |
| 2 | Level 1 access bypasses checks | `test_auth.py:test_require_password_manager_access_level_1` | unit/auth | PASS | `pytest tests/test_auth.py` |
| 3 | Auditors have delegated access | `test_auth.py:test_require_password_manager_auditor` | unit/auth | PASS | `pytest tests/test_auth.py` |
| 4 | Unauthorized roles raise 403 HTTP | `test_auth.py:test_require_password_manager_no_access` | unit/auth | PASS | `pytest tests/test_auth.py` |
| 5 | Employee creation success | `test_employees.py:test_create_employee_success` | int/api | PASS | `pytest tests/test_employees.py` |
| 6 | Elevate to Master Admin is blocked | `test_employees.py:test_create_employee_master_admin_denied` | int/api | PASS | `pytest tests/test_employees.py` |
| 7 | Auth rollback on Profile error | `test_employees.py:test_create_employee_rollback_on_profile_error` | int/api | PASS | `pytest tests/test_employees.py` |
| 8 | Password generator outputs 10 chars | `passwordUtils.test.js:generates a 10-character password` | unit/util | PASS | `vitest run` |
| 9 | Password excludes confusable chars | `passwordUtils.test.js:generates strings without easily confused chars` | unit/util | PASS | `vitest run` |
| 10 | Login shows loading state | `LoginView.test.js:shows loading state on submit` | unit/ui | PASS | `vitest run` |
| 11 | Login intercepts errors without breaking UI | `LoginView.test.js:displays error message on invalid credentials` | unit/ui | PASS | `vitest run` |
| 12 | Login routes user after success | `LoginView.test.js:redirects to master admin portal` | unit/ui | PASS | `vitest run` |

## 5. Coverage and Known Gaps
- El coverage backend actual pasó de 0% a **37%** (solo `main.py` y `test_auth.py`). Aún hay un gap de cobertura importante en la lógica de endpoints y la simulación.
- El coverage frontend es marginal, cubriendo la primera utilidad y dejando a los componentes visuales como el siguiente paso para futuras iteraciones TDD.

## 6. Merge Evidence
Tests verdes confirmados para Backend y Frontend. El refactor de mover `generateRandomPassword` del archivo Vue principal al `passwordUtils.js` fue validado y no rompió la compilación de Vite (`npm run build`).
