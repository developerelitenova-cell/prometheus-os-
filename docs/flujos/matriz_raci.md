# Matriz RACI de Roles y Responsabilidades Operativas

> **Módulo:** Gobernanza Organizacional  
> **Audiencia:** Gerencia General, Líderes de Área, RRHH, Auditores, Desarrolladores  
> **Relacionado con:** [INDICE_MAESTRO.md](../INDICE_MAESTRO.md) | [usabilidad/manual_roles_permisos.md](../usabilidad/manual_roles_permisos.md) | [flujos/auditoria_y_seguridad.md](./auditoria_y_seguridad.md)

---

## 1. Definición del Estándar RACI

Para garantizar la fluidez operativa y delimitar las responsabilidades en **NOVA WORD**, cada actividad del sistema se rige bajo la metodología internacional **RACI**:

- **R — Responsable (*Responsible*):** Quien realiza directamente la actividad o ejecuta el procedimiento en la plataforma.
- **A — Aprobador (*Accountable*):** Quien tiene la autoridad final, responde por el resultado y aprueba o rechaza la acción. Solo puede haber un Aprobador principal por actividad.
- **C — Consultado (*Consulted*):** Quien provee información técnica, contexto o soporte previo a la ejecución.
- **I — Informado (*Informed*):** Quien recibe notificaciones o reportes sobre el progreso y resultado de la acción sin intervenir directamente.

---

## 2. Roles y Actores Participantes

1. **Colaborador (Nivel 3):** Personal operativo y táctico que ejecuta tareas y reporta evidencias en `/workspace`.
2. **Líder de Área (Nivel 2):** Coordinadores y supervisores de área con acceso al Centro de Control.
3. **Gerente de Área (Nivel 1):** Cabezas de departamento con autoridad ejecutiva, aprobación y evaluación.
4. **Analista de Datos / Especialista KPIs:** Rol técnico con acceso exclusivo al módulo `/kpis` para auditoría métrica.
5. **Administrador Maestro (Master Admin):** Custodio del sistema con control global sobre todas las áreas y entidades.
6. **Dirección General / Junta:** Stakeholders receptores de informes ejecutivos consolidados.

---

## 3. Matriz RACI Consolidada por Proceso

| Proceso / Actividad del Sistema | Colaborador (Nivel 3) | Líder de Área (Nivel 2) | Gerente de Área (Nivel 1) | Analista de Datos | Administrador Maestro | Dirección General |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Auto-registro y solicitud de cuenta** | **R** | I | I | I | **A** | I |
| **Aprobación o rechazo de nuevos usuarios** | I | C | C | I | **R / A** | I |
| **Creación y modificación de Áreas y Roles** | I | C | C | C | **R / A** | I |
| **Definición de memoria del cargo (`role_task_templates`)** | C | **R** | **A** | C | I | I |
| **Asignación de tareas ad-hoc y pendientes del día** | I | **R** | **A** | I | C | I |
| **Creación de órdenes programadas recurrentes** | I | **R** | **A** | I | C | I |
| **Ejecución de tareas y registro de foto de evidencia** | **R / A** | I | I | I | I | I |
| **Justificación de tareas no cumplidas (`unfulfilled`)** | **R** | I | **A** | I | I | I |
| **Revisión del Informe Diario de Operaciones** | I | **R** | **A** | I | C | I |
| **Ejecución de Presión Gerencial masiva o individual** | I | **R** | **A** | I | I | I |
| **Generación y ajuste de indicadores y actas en `/kpis`** | C | C | C | **R / A** | **A** | I |
| **Publicación de noticias corporativas en `/rrhh`** | I | C | C | I | **R / A** | I |
| **Delegación y reseteo de contraseñas de colaboradores** | I | C | **R / A** *(si delegado)* | I | **R / A** | I |
| **Inyección de conocimiento RAG y Gemelo Digital** | C | C | C | C | **R / A** | I |
| **Auditoría de logs y revisiones de seguridad** | I | I | I | I | **R** | **A** |

---

## 4. Reglas Operativas Derivadas de la Matriz

1. **Autoridad sobre la Memoria del Cargo:**
   - Ningún colaborador individual puede alterar sus propias plantillas recurrentes de cargo. Estas son definidas por los líderes y aprobadas por el Gerente de Área o el Administrador Maestro para garantizar la estandarización operativa de los 70 roles.
2. **Cadena de Justificación:**
   - Cuando una tarea no se cumple, el colaborador es el **Responsable (R)** de registrar el motivo antes de finalizar la jornada laboral. El Gerente es el **Aprobador (A)** que evalúa si la causa es imputable al trabajador o a un cuello de botella de la organización durante la revisión del Informe Diario.
3. **Exclusividad del Módulo de KPIs:**
   - La gestión de metas, ponderaciones y actas de compromiso en `/kpis` está restringida al Analista de Datos y al Administrador Maestro, evitando que los evaluados puedan auto-modificar sus metas operativas.
