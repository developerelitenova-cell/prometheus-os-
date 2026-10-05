# Historial de Cambios (CHANGELOG)

> Todas las modificaciones notables de **NOVA WORD** se registran en este documento.  
> El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/), y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [2.1.0] - 2026-10-01

### Añadido
- **Sistema de Cierre de Tareas con Evidencia Inmutable (`EvidenceModal.vue`):**
  - Flujo obligatorio al hacer clic en cualquier tarea: el colaborador ya no puede marcar una tarea sin justificación.
  - Modal emergente con dos alternativas excluyentes: **"Realizado"** (requiere texto explicativo y archivo adjunto de captura/fotografía) y **"No fue posible cumplir"** (requiere justificación detallada de causa raíz).
- **Consolidación de Informe Diario de Operaciones:**
  - Vista especializada para Gerentes de Área que compila todas las actividades concluidas, pendientes reprogramados y evidencias fotográficas del equipo a su cargo en la jornada.
- **Soporte Multi-Empresa Nativo:**
  - Inclusión de la columna `company` en `profiles` para segregar datos operativos entre **Elite Nutrition S.A.S.** y **Futupro Colombia**.
- **Control de Acceso Estricto para KPIs y Actas:**
  - Guard de navegación `kpiAccessOnly` que restringe el acceso al módulo `/kpis` exclusivamente al Analista/Especialista de Datos y al Master Admin.
- **Suite Maestra de Documentación Técnica:**
  - Creación de 21 documentos modulares organizados por audiencias en el directorio `/docs`.

### Modificado
- **Centro de Control Gerencial (`LeaderDashboard.vue`):**
  - Segregación estricta por área: un Gerente de Área (ej. Contabilidad) únicamente puede crear órdenes y visualizar colaboradores pertenecientes a su departamento.
  - Desacoplamiento de estilos visuales para evitar que el módulo de KPIs permanezca resaltado al navegar en el Centro de Control.
- **Catálogo de Cargos (`MapaCargos.vue`):**
  - Depuración de cargos duplicados en la visualización del organigrama (ej. corrección del doble registro de "Gerente Auditoría Pentágono").
  - Retiro definitivo del botón de enlace externo a Miro, integrando la visualización directa en el sistema.

### Seguridad
- Refuerzo de políticas RLS en PostgreSQL para impedir que un líder de una empresa consulte colaboradores de la otra entidad.
- Validación de tipos MIME y tamaño máximo (5 MB) en la subida de fotografías a Supabase Storage.

---

## [2.0.0] - 2026-06-15

### Añadido
- **Modelo de Tareas en Tres Capas:**
  - Capa 1: Plantillas recurrentes inherentes al cargo (`role_task_templates` / `task_completions`).
  - Capa 2: Entregas y órdenes programadas (`scheduled_deliveries` / `scheduled_delivery_completions`).
  - Capa 3: Pendientes ad-hoc asignados individualmente (`tasks`).
- **Motor de Inferencia RAG y Oráculo:**
  - Integración de extensión `vector` (pgvector 768 dims) en PostgreSQL para búsqueda semántica de manuales y directrices operativas.
  - Conexión con Anthropic API utilizando el modelo `claude-3-5-sonnet-20241022`.
- **Organigrama Interactivo con D3.js:**
  - Árbol jerárquico colapsable con renderizado vectorial SVG de áreas, líderes y subordinados.

### Modificado
- Migración de base de datos a PostgreSQL administrado por Supabase.
- Estandarización del frontend sobre Vue 3 Composition API con Vite y Tailwind CSS.

---

## [1.5.0] - 2026-03-20

### Añadido
- Módulo de Administración de Talento Humano (`/rrhh`):
  - Flujo de auto-registro con aprobación previa obligatoria (`approval_status`: `pending`, `approved`, `suspended`).
  - Pantalla única de bienvenida (`/welcome`) para nuevos colaboradores tras aprobación.
- Delegación de permisos para reseteo y gestión de contraseñas de subordinados (`password_delegated_roles`).
- Módulo de Academia Corporativa (`/academia`) para consulta de contenidos formativos y manuales.

---

## [1.0.0] - 2026-01-15

### Añadido
- Versión inicial fundacional de NOVA WORD para Elite Nutrition S.A.S.
- Autenticación básica de usuarios vía Supabase Auth.
- Formulario de mapeo de cargos (`/mapper/:role_id`).
- Tablero de tareas personales tipo checklist.

---

*Documento enlazado a [INDICE_MAESTRO.md](../INDICE_MAESTRO.md) y [SDLC.md](../flujos/SDLC.md).*
