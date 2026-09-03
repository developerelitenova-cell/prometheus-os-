# Directiva de Ciberseguridad: 6 Capas de Protección (SOP)

## Objetivo
Establecer y mantener un marco de seguridad inquebrantable de 6 núcleos para el Gemelo Digital Corporativo de Elite Nutrition (PROMETHEUS OS), garantizando la integridad, confidencialidad y disponibilidad de la información ante ataques internos o externos.

## Los 6 Núcleos de Seguridad

### Capa 1: Infraestructura y Red (Network & Hosting)
- **Despliegue Vercel:** Se confía en el WAF (Web Application Firewall) de Vercel para mitigar ataques DDoS en el frontend.
- **CORS Estricto:** El backend (FastAPI) debe rechazar cualquier petición que no provenga del dominio oficial de producción.
- **Conexiones Encriptadas:** Tráfico forzado 100% sobre HTTPS/TLS 1.3.

### Capa 2: Identidad y Autenticación (Auth)
- **Supabase Auth:** Manejo de sesiones mediante JWT (JSON Web Tokens) firmados y con corto tiempo de expiración.
- **Validación de Correos:** Solo se activan cuentas verificadas o pre-creadas por el Master Admin.
- **Contraseñas Fuertes:** Bloqueo de contraseñas débiles y protección contra ataques de fuerza bruta (Rate limiting de Supabase Auth).

### Capa 3: Autorización de Base de Datos (Row Level Security - RLS)
- **Filtrado a Nivel de Fila:** Toda tabla en Supabase debe tener RLS habilitado.
- **Principio de Menor Privilegio:** Un empleado (Nivel 1) solo puede ver sus propias tareas e información de su área. Los gerentes (Nivel 2) solo de su área. Master Admin (Nivel 3) tiene acceso total.
- **Llave de Servicio (Service Role Key):** NUNCA debe estar en el frontend. Solo el backend la usa para tareas administrativas críticas.

### Capa 4: Seguridad del Backend (FastAPI API Gateway)
- **Validación de Entradas (Sanitization):** Todo payload enviado al backend debe ser validado estructuralmente por Pydantic para evitar Inyecciones SQL y NoSQL (Payload validation).
- **Rate Limiting:** Protección de endpoints críticos (`/api/v1/extract-workflow`, `/api/v1/chat`) contra abusos masivos de la API de IA, evitando agotamiento de tokens.
- **Verificación de Sesión:** El backend debe rechazar peticiones anónimas a endpoints protegidos.

### Capa 5: Seguridad del Frontend (Client-Side)
- **Prevención XSS:** Vue.js neutraliza automáticamente la ejecución de scripts (XSS) al usar interpolaciones `{{}}`, pero se prohíbe el uso indiscriminado de `v-html` con datos ingresados por el usuario.
- **Router Guards:** Protección de rutas locales (`/workspace`, `/dashboard`) redirigiendo a intrusos que modifiquen el LocalStorage sin un JWT válido.
- **Zero-Trust:** El frontend no asume ninguna regla; el backend y la BD son la última palabra.

### Capa 6: Auditoría, Registro y Respuesta (Monitoring)
- **Logs de Trazabilidad:** Todo cambio crítico (como el mapeo de roles) registra un log inmutable en la tabla `mapping_audit_log` con User-Agent e ID de perfil.
- **Monitoreo de Anomalías:** Detección de cuentas suspendidas o con comportamiento anómalo.
- **Backups Regulares:** Point-in-time recovery habilitado en Supabase para restaurar ante cualquier catástrofe de datos.

---

## Restricciones y Casos Borde
- **Nota: No exponer variables de entorno en frontend:** Cualquier variable prefijada con `VITE_` se compila al código fuente. Asegurarse de que `SUPABASE_SERVICE_ROLE_KEY` o las APIs de IA jamás tengan este prefijo.
- **Nota: Cuidado con la caché:** Evitar que datos sensibles de otros usuarios se queden en estado global. Al cerrar sesión, se debe purgar todo el estado del cliente.
