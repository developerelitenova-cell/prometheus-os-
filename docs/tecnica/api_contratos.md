# Especificación Completa de Contratos API REST

> **NOVA WORD — Core Backend API v1**  
> **Servidor Base:** `http://localhost:8000` (Desarrollo) / `https://api.nova-word.com` (Producción — `pendiente de verificación`)  
> **Framework:** FastAPI 2.0 (Python 3.11) | **Especificación OpenAPI:** Swagger UI en `/docs`, ReDoc en `/redoc`

---

## 1. Convenciones y Estándares Globales

### 1.1 Encabezados de Petición (Request Headers)
| Encabezado | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `Authorization` | `string` | Sí (excepto `/`) | Token JWT de Supabase en formato `Bearer <JWT_TOKEN>`. |
| `Content-Type` | `string` | Sí (`POST`, `PUT`) | Obligatorio `application/json` (o `multipart/form-data` para subida de fotos). |
| `Accept` | `string` | No | Por defecto `application/json`. |

### 1.2 Rate Limiting (SlowAPI)
- **Límites globales:** 100 peticiones / minuto por IP para endpoints estándar.
- **Endpoints de Inteligencia Artificial (`/api/v1/chat`, `/api/v1/generate-kpis`, `/api/v1/evaluate-kpis`):** 15 peticiones / minuto por IP/Usuario.
- **Cabeceras de respuesta:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- **Código de exceso:** `429 Too Many Requests`.

### 1.3 Formato Estándar de Error
```json
{
  "detail": "Descripción del error o violación de regla de negocio",
  "status_code": 403,
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

---

## 2. Mapa Rápido de Endpoints

| Método | Endpoint | Nivel de Acceso Requerido | Rate Limit | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Público | Ninguno | Healthcheck operativo del servicio. |
| `GET` | `/api/v1/roles` | Autenticado | 100/min | Listado general de cargos activos. |
| `POST` | `/api/v1/roles` | Nivel 1 o Master Admin | 30/min | Creación de nuevo cargo y plantilla. |
| `PUT` | `/api/v1/roles/{role_id}` | Nivel 1 o Master Admin | 30/min | Modificación de metadatos del cargo. |
| `DELETE`| `/api/v1/admin/roles/{role_id}`| Master Admin | 10/min | Eliminación de cargo de la estructura. |
| `DELETE`| `/api/v1/admin/areas/{area_id}`| Master Admin | 10/min | Eliminación de área organizacional. |
| `GET` | `/api/v1/admin/employees` | Nivel 1, 2 o Master | 60/min | Listado de colaboradores según alcance. |
| `POST` | `/api/v1/admin/create-employee`| Nivel 1 o Master Admin | 20/min | Provisión de usuario en Supabase Auth y BD. |
| `PUT` | `/api/v1/admin/employee/{user_id}`| Nivel 1 o Master Admin | 30/min | Actualización de perfil y rol de empleado. |
| `DELETE`| `/api/v1/admin/employee/{user_id}`| Master Admin | 10/min | Desactivación lógica de colaborador. |
| `GET` | `/api/v1/admin/password-delegated-roles`| Master Admin | 30/min | Roles autorizados para delegar contraseñas. |
| `POST` | `/api/v1/admin/roles/{role_id}/password-permission`| Master Admin | 20/min | Otorga o revoca delegación de contraseña. |
| `POST` | `/api/v1/user/verification-photo` | Autenticado (Propio) | 10/min | Carga de foto de verificación de identidad. |
| `GET` | `/api/v1/user/verification-photo/{user_id}`| Autenticado | 60/min | Consulta de URL de foto de perfil/verificación. |
| `POST` | `/api/v1/tasks` | Autenticado | 60/min | Creación de pendiente ad-hoc. |
| `GET` | `/api/v1/tasks/{role_id}` | Autenticado | 60/min | Consulta de pendientes asignados al rol. |
| `PUT` | `/api/v1/tasks/{task_id}/status` | Autenticado | 60/min | Actualización de estado de una tarea. |
| `POST` | `/api/v1/evaluate/{role_id}` | Nivel 1 o Master Admin | 20/min | Evaluación de rendimiento y scoring operativo. |
| `POST` | `/api/v1/chat` | Autenticado | 15/min | Conversación con el Agente IA del rol (Claude). |
| `POST` | `/api/v1/generate-kpis` | KPI Access (Master/Datos) | 10/min | Generación inteligente de metas vía LLM. |
| `POST` | `/api/v1/evaluate-kpis` | KPI Access (Master/Datos) | 10/min | Análisis cuantitativo de KPIs ejecutados. |
| `POST` | `/api/v1/extract-workflow` | Master Admin | 10/min | Extracción estructurada de diagrama Miro/IA. |

---

## 3. Especificación Detallada de Endpoints

### 3.1 Verificación de Salud
#### `GET /`
- **Descripción:** Healthcheck básico para orquestadores y balanceadores (Render/Docker).
- **Seguridad:** Ninguna (Público).
- **Respuesta 200 OK:**
```json
{
  "status": "healthy",
  "service": "NOVA WORD Backend Engine",
  "version": "1.0.0"
}
```

---

### 3.2 Gestión Organizacional (Cargos y Áreas)

#### `GET /api/v1/roles`
- **Descripción:** Retorna el catálogo completo de cargos activos en la organización con sus respectivas áreas asignadas.
- **Seguridad:** Requiere Bearer JWT.
- **Respuesta 200 OK:**
```json
[
  {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "Gerente de Operaciones",
    "area_id": "c1f7a224-1188-4a41-863a-2374e2d35812",
    "access_level": 1,
    "description": "Responsable de la cadena logística y de inventario",
    "created_at": "2026-01-15T10:00:00Z",
    "areas": {
      "id": "c1f7a224-1188-4a41-863a-2374e2d35812",
      "name": "Operaciones y Logística"
    }
  }
]
```

#### `POST /api/v1/roles`
- **Descripción:** Crea un nuevo cargo formal en la estructura jerárquica.
- **Seguridad:** Requiere JWT de usuario con rol Nivel 1 o Master Admin.
- **Cuerpo de la Petición (Request Body):**
```json
{
  "name": "Analista de Inventarios",
  "area_id": "c1f7a224-1188-4a41-863a-2374e2d35812",
  "access_level": 3,
  "description": "Control de existencias físicas y auditorías en bodega",
  "supervisor_role_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
}
```
- **Respuesta 201 Created:**
```json
{
  "id": "d4e5f6a7-8901-2345-6789-0123456789ab",
  "name": "Analista de Inventarios",
  "status": "success",
  "message": "Cargo creado exitosamente"
}
```
- **Errores:**
  - `401 Unauthorized`: Token ausente o caducado.
  - `403 Forbidden`: Nivel de acceso inferior a 1.
  - `422 Unprocessable Entity`: Campos requeridos faltantes o tipos inválidos.

#### `PUT /api/v1/roles/{role_id}`
- **Descripción:** Actualiza los atributos de un cargo existente.
- **Seguridad:** Nivel 1 o Master Admin.
- **Parámetros de Ruta:** `role_id` (UUID).
- **Cuerpo de la Petición:** Campos opcionales a modificar (`name`, `area_id`, `access_level`, `description`).
- **Respuesta 200 OK:** Objeto del cargo actualizado.

#### `DELETE /api/v1/admin/roles/{role_id}`
- **Descripción:** Elimina un cargo del catálogo si no posee dependencias activas críticas.
- **Seguridad:** Estricto Master Admin (`is_master_admin: true`).
- **Respuesta 200 OK:**
```json
{
  "status": "success",
  "message": "Cargo eliminado permanentemente"
}
```

---

### 3.3 Administración de Empleados y Cuentas

#### `GET /api/v1/admin/employees`
- **Descripción:** Lista colaboradores. Si el usuario es Master Admin, lista toda la compañía. Si es Líder (Nivel 1 o 2), filtra exclusivamente a los miembros de su área o cargos a cargo.
- **Seguridad:** Nivel 1, Nivel 2 o Master Admin.
- **Respuesta 200 OK:**
```json
[
  {
    "id": "e5b3c21a-4d2e-4f1a-9876-123456789abc",
    "email": "juan.perez@elitenutrition.com",
    "full_name": "Juan Pérez",
    "cedula": "1020304050",
    "phone": "+57 300 1234567",
    "role_id": "d4e5f6a7-8901-2345-6789-0123456789ab",
    "approval_status": "approved",
    "company": "Elite Nutrition",
    "is_master_admin": false,
    "roles": {
      "name": "Analista de Inventarios",
      "access_level": 3
    }
  }
]
```

#### `POST /api/v1/admin/create-employee`
- **Descripción:** Crea un empleado directamente usando el cliente privilegiado (`service_role`). Crea la identidad en `auth.users` de Supabase y el registro en la tabla pública `profiles`.
- **Seguridad:** Nivel 1 o Master Admin.
- **Cuerpo de la Petición:**
```json
{
  "email": "carlos.mendoza@futupro.com",
  "password": "PasswordSeguro2026!",
  "full_name": "Carlos Mendoza",
  "cedula": "1122334455",
  "phone": "+57 310 9876543",
  "role_id": "d4e5f6a7-8901-2345-6789-0123456789ab",
  "company": "Futupro",
  "approval_status": "approved",
  "is_master_admin": false
}
```
- **Respuesta 201 Created:**
```json
{
  "status": "success",
  "user_id": "98a7b6c5-4321-fedc-ba98-76543210fedc",
  "message": "Empleado y credenciales aprovisionados satisfactoriamente"
}
```

#### `PUT /api/v1/admin/employee/{user_id}`
- **Descripción:** Actualiza rol, estado de aprobación (`approved`, `suspended`, `rejected`), cédula, teléfono o datos de contacto.
- **Seguridad:** Nivel 1 o Master Admin.

#### `DELETE /api/v1/admin/employee/{user_id}`
- **Descripción:** Desactiva lógicamente el usuario y revoca sus sesiones activas en Supabase Auth.
- **Seguridad:** Estricto Master Admin.

---

### 3.4 Evidencias y Verificación Visual

#### `POST /api/v1/user/verification-photo`
- **Descripción:** Carga la fotografía de verificación del colaborador hacia el bucket seguro de Supabase Storage `profile_photos`.
- **Seguridad:** Bearer JWT (el usuario solo puede subir su propia foto a menos que sea Master Admin).
- **Content-Type:** `multipart/form-data`
- **Parámetros de Formulario:**
  - `file`: Archivo binario (JPEG, PNG, WebP). Tamaño máximo: 5 MB.
  - `user_id`: UUID del colaborador.
- **Respuesta 200 OK:**
```json
{
  "status": "success",
  "photo_url": "https://<supabase-id>.supabase.co/storage/v1/object/public/profile_photos/e5b3c21a-4d2e...png",
  "uploaded_at": "2026-10-01T15:30:00Z"
}
```

---

### 3.5 Trazabilidad de Tareas y Pendientes Ad-Hoc

#### `POST /api/v1/tasks`
- **Descripción:** Asigna un pendiente ad-hoc a un colaborador o cargo.
- **Seguridad:** Autenticado.
- **Cuerpo de la Petición:**
```json
{
  "title": "Verificación física de stock en pasillo 4",
  "description": "Revisar discrepancia de 12 unidades en producto Proteína Whey 2kg",
  "role_id": "d4e5f6a7-8901-2345-6789-0123456789ab",
  "assigned_to": "e5b3c21a-4d2e-4f1a-9876-123456789abc",
  "priority": "alta",
  "due_date": "2026-10-02T18:00:00Z"
}
```

#### `GET /api/v1/tasks/{role_id}`
- **Descripción:** Consulta tareas y pendientes asignados a un rol específico con estado de ejecución.

---

### 3.6 Motor de Inteligencia Artificial (Claude 3.5 Sonnet / Oracle)

#### `POST /api/v1/chat`
- **Descripción:** Inferencia RAG con el Agente Especialista del cargo. Consulta fragmentos semánticos en `role_knowledge_embeddings` vía similitud de coseno y genera directrices operativas.
- **Seguridad:** Autenticado.
- **Rate Limit:** 15 req/min.
- **Cuerpo de la Petición:**
```json
{
  "role_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "message": "¿Cuál es el procedimiento estandarizado cuando un lote llega sin registro INVIMA?",
  "conversation_history": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "Buen día. Soy el Agente de Operaciones de Elite Nutrition. ¿En qué te asisto?" }
  ]
}
```
- **Respuesta 200 OK:**
```json
{
  "reply": "De acuerdo con el Manual de Buenas Prácticas de Almacenamiento (Sección 4.2), todo lote sin registro INVIMA debe ser retenido inmediatamente en el área de Cuarentena física y virtual...",
  "sources_used": [
    {
      "source_document": "Manual_Operaciones_Bodega_2026.pdf",
      "similarity_score": 0.892
    }
  ]
}
```

#### `POST /api/v1/generate-kpis`
- **Descripción:** Deduce y formula los KPIs cuantitativos y cualitativos para un cargo específico a partir de su descripción de funciones y objetivos estratégicos.
- **Seguridad:** Exclusivo Master Admin o Analista de Datos (`meta.kpiAccessOnly`).
- **Cuerpo de la Petición:**
```json
{
  "role_id": "d4e5f6a7-8901-2345-6789-0123456789ab",
  "frequency": "mensual",
  "strategic_focus": "Disminución de mermas e inventario fantasma"
}
```
- **Respuesta 200 OK:**
```json
{
  "kpis": [
    {
      "name": "Índice de Exactitud de Registro (IRA)",
      "target": 98.5,
      "unit": "%",
      "formula": "(Conteo Físico Coincidente / Conteo Teórico Total) * 100",
      "weight": 0.40
    }
  ]
}
```

#### `POST /api/v1/evaluate-kpis`
- **Descripción:** Realiza la ponderación algorítmica y cualitativa del cumplimiento de metas operativas de un periodo para alimentar el semáforo gerencial.
- **Seguridad:** Exclusivo Master Admin o Analista de Datos.

---

## 4. Matriz de Códigos de Respuesta HTTP

| Código | Significado | Causa Típica en NOVA WORD |
| :---: | :--- | :--- |
| `200` | OK | Petición ejecutada con éxito retornando datos. |
| `201` | Created | Creación de entidad exitosa (Usuario, Cargo, Tarea). |
| `400` | Bad Request | Parámetros inválidos o incompatibilidad de datos. |
| `401` | Unauthorized | Falta de token Bearer o firma criptográfica inválida/expirada. |
| `403` | Forbidden | El usuario no posee el `access_level` suficiente o viola el aislamiento de área. |
| `404` | Not Found | Entidad solicitada inexistente en la base de datos. |
| `422` | Unprocessable | Fallo de validación en esquema Pydantic. |
| `429` | Too Many Requests | Se sobrepasó la cuota de peticiones por minuto de SlowAPI. |
| `500` | Internal Error | Excepción no controlada en el backend o fallo de conexión a Supabase/Anthropic. |

---

*Documento enlazado a [INDICE_MAESTRO.md](../INDICE_MAESTRO.md) y [arquitectura_backend.md](arquitectura_backend.md).*
