# Registro de Decisiones de Arquitectura (ADR)

> **NOVA WORD — Architecture Decision Records**  
> **Estándar:** Basado en el formato propuesto por Michael Nygard (Contexto, Decisión, Consecuencias)  
> **Estado Global:** Aprobado e Implementado en Producción

---

## Índice de Decisiones Registradas

- [ADR-001: Adopción de Supabase como Backend-as-a-Service](#adr-001-adopción-de-supabase-como-backend-as-a-service)
- [ADR-002: Elección de Vue 3 con Composition API y Vite](#adr-002-elección-de-vue-3-con-composition-api-y-vite)
- [ADR-003: Empleo de FastAPI (Python) para el Motor de IA y Lógica Central](#adr-003-empleo-de-fastapi-python-para-el-motor-de-ia-y-lógica-central)
- [ADR-004: Integración de Claude 3.5 Sonnet para RAG y Razonamiento](#adr-004-integración-de-claude-35-sonnet-para-rag-y-razonamiento)
- [ADR-005: Modelo de Seguridad con Row Level Security (RLS) en PostgreSQL](#adr-005-modelo-de-seguridad-con-row-level-security-rls-en-postgresql)
- [ADR-006: Cierre de Tareas con Evidencia Inmutable y Justificación Obligatoria](#adr-006-cierre-de-tareas-con-evidencia-inmutable-y-justificación-obligatoria)
- [ADR-007: Modelo Híbrido de Tareas en Tres Capas Especializadas](#adr-007-modelo-híbrido-de-tareas-en-tres-capas-especializadas)

---

### ADR-001: Adopción de Supabase como Backend-as-a-Service

- **Fecha:** 2026-01-10
- **Estado:** Aprobado
- **Contexto:**  
  El proyecto requería una infraestructura robusta de base de datos relacional para modelar la jerarquía de cargos, tareas operativas, manuales y perfiles, además de soporte nativo para autenticación segura (JWT), suscripciones en tiempo real (WebSockets) para tableros de control y almacenamiento de archivos (fotos de perfil y evidencias de tareas). Construir y mantener servicios separados (Postgres autogestionado, Redis para pub/sub, servidor MinIO de storage y servidor de autenticación OAuth) aumentaba drásticamente la sobrecarga de mantenimiento para el equipo.
- **Decisión:**  
  Adoptar **Supabase** como plataforma central de persistencia y servicios base, aprovechando su motor PostgreSQL administrado con soporte nativo para la extensión `vector` (pgvector), Supabase Auth y Storage.
- **Consecuencias:**  
  - *Positivas:* Aceleración drástica del desarrollo; soporte out-of-the-box de Row Level Security (RLS) directamente evaluado por PostgreSQL; capacidades nativas de WebSockets mediante Realtime CDC; reducción a cero de tareas de mantenimiento de clústeres de base de datos.
  - *Negativas:* Acoplamiento a la API y SDK de Supabase; costo por consumo escalable según volumen de transferencia y almacenamiento (`pendiente de verificación`).

---

### ADR-002: Elección de Vue 3 con Composition API y Vite

- **Fecha:** 2026-01-12
- **Estado:** Aprobado
- **Contexto:**  
  La interfaz requería ser un centro de control operativo con tiempos de respuesta instantáneos, renderizado reactivo de organigramas interactivos (D3.js), gráficos de simulación tridimensional (Three.js) y cuadrantes de tareas en vivo, con una curva de desarrollo ágil y código altamente mantenible.
- **Decisión:**  
  Seleccionar **Vue 3** utilizando la sintaxis de **Composition API con `<script setup>`**, empaquetado y servido a través de **Vite**.
- **Consecuencias:**  
  - *Positivas:* Tiempos de inicio en desarrollo inferiores a 300 ms gracias al Hot Module Replacement (HMR) nativo de Vite; código limpio, declarativo y fuertemente tipado con Composition API; integración fluida con librerías imperativas de renderizado (D3 y Three.js) sin fugas de memoria en hooks de ciclo de vida.
  - *Negativas:* Necesidad de disciplina rigurosa para no mezclar Options API con Composition API en componentes nuevos.

---

### ADR-003: Empleo de FastAPI (Python) para el Motor de IA y Lógica Central

- **Fecha:** 2026-01-18
- **Estado:** Aprobado
- **Contexto:**  
  Aunque el frontend interactúa directamente con Supabase para lecturas estándar, existen operaciones altamente sensibles (aprovisionamiento administrativo de empleados, cálculo cuantitativo de KPIs, extracción de flujos de diagramas y consultas vectoriales RAG) que requerían un microservicio de backend seguro.
- **Decisión:**  
  Implementar el backend auxiliar en **Python 3.11** utilizando el framework **FastAPI**, complementado con **SlowAPI** para control de tráfico y rate limiting.
- **Consecuencias:**  
  - *Positivas:* Ecosistema natural para integración con librerías de Inteligencia Artificial y embeddings; generación automática de especificaciones OpenAPI (Swagger); alto rendimiento asíncrono con `asyncio` y validación estricta de esquemas mediante Pydantic.
  - *Negativas:* Requiere gestionar el despliegue de dos capas separadas (Vercel para frontend y Render para backend).

---

### ADR-004: Integración de Claude 3.5 Sonnet para RAG y Razonamiento

- **Fecha:** 2026-02-05
- **Estado:** Aprobado
- **Contexto:**  
  Los colaboradores requieren consultar directrices operativas complejas extraídas de manuales de cargos de Elite Nutrition y Futupro. Se evaluaron modelos de OpenAI (GPT-4o) y Anthropic (Claude 3.5 Sonnet).
- **Decisión:**  
  Estandarizar el motor de inferencia semántica sobre **Claude 3.5 Sonnet** (vía Anthropic SDK con identificador `claude-3-5-sonnet-20241022`).
- **Consecuencias:**  
  - *Positivas:* Capacidad superior en comprensión y seguimiento estricto de directrices corporativas, extracción estructurada de workflows desde texto desestructurado y menor tasa de alucinación en preguntas normativas.
  - *Negativas:* Dependencia del SLA y cuotas de la API de Anthropic; costo por millón de tokens procesados (`pendiente de verificación`).

---

### ADR-005: Modelo de Seguridad con Row Level Security (RLS) en PostgreSQL

- **Fecha:** 2026-02-14
- **Estado:** Aprobado
- **Contexto:**  
  En arquitecturas tradicionales, la seguridad depende enteramente de que los controladores del backend verifiquen el ID del usuario en cada endpoint. Dado que NOVA WORD permite lectura directa desde el cliente Vue hacia Supabase para optimizar latencia, confiar en la capa de aplicación creaba un riesgo inaceptable de acceso no autorizado.
- **Decisión:**  
  Delegar la frontera definitiva de autorización a **Row Level Security (RLS)** en el motor PostgreSQL. Ninguna tabla del esquema público puede consultarse o modificarse sin una política explícita ligada a `auth.uid()`.
- **Consecuencias:**  
  - *Positivas:* Arquitectura Zero-Trust a nivel de datos. Incluso si el frontend fuese manipulado en el navegador, el motor de base de datos deniega cualquier fila que no corresponda al área o cargo del usuario.
  - *Negativas:* Complejidad mayor al diseñar migraciones SQL y necesidad de tests unitarios específicos para validar las políticas de seguridad.

---

### ADR-006: Cierre de Tareas con Evidencia Inmutable y Justificación Obligatoria

- **Fecha:** 2026-03-01
- **Estado:** Aprobado
- **Contexto:**  
  Anteriormente, los colaboradores podían marcar tareas como "completadas" simplemente haciendo clic en un checkbox sin aportar comprobantes, imposibilitando las auditorías de control interno de gerencia. Si una tarea no se podía ejecutar, se eliminaba o quedaba en el limbo sin trazabilidad.
- **Decisión:**  
  Modificar el flujo de interacción de tareas:
  1. Al presionar una tarea, el sistema no la marca de inmediato; abre una ventana modal emergente obligatoria (`EvidenceModal.vue`).
  2. El colaborador tiene dos opciones: **Realizado** (debe ingresar texto explicativo y fotografía/captura de pantalla de la evidencia) o **No fue posible cumplir** (debe ingresar justificación detallada de causa raíz).
  3. Los registros son inmutables y quedan a disposición del Gerente de Área para la consolidación de su **Informe Diario de Operaciones**.
- **Consecuencias:**  
  - *Positivas:* Trazabilidad total de la operación, respaldo fotográfico para auditorías de inventario y calidad, y eliminación de "falsos positivos" en el cumplimiento de tareas.
  - *Negativas:* Fricción operativa mínima de 15-30 segundos por tarea para el colaborador, mitigada mediante compresión automática de imágenes en el cliente.

---

### ADR-007: Modelo Híbrido de Tareas en Tres Capas Especializadas

- **Fecha:** 2026-03-15
- **Estado:** Aprobado
- **Contexto:**  
  La organización presentaba tres tipos disímiles de requerimientos laborales que no encajaban en un modelo relacional único sin generar redundancia y confusión:
  1. Rutinas inherentes al cargo (diarias, semanales, mensuales).
  2. Entregables corporativos de periodicidad estricta (ej. cierre contable los días 30, o reporte de inventario los viernes).
  3. Pendientes operativos ad-hoc del día a día (solicitudes puntuales del líder al empleado).
- **Decisión:**  
  Segmentar el modelo en tres capas independientes:
  - **Capa 1 (Memoria del Cargo):** `role_task_templates` y `task_completions`.
  - **Capa 2 (Entregas Programadas / Centro de Control):** `scheduled_deliveries` y `scheduled_delivery_completions`.
  - **Capa 3 (Pendientes Ad-Hoc):** `tasks` con campos de trazabilidad fotográfica y justificación.
- **Consecuencias:**  
  - *Positivas:* Claridad conceptual absoluta; la memoria de lo que debe hacer un cargo no se pierde con la rotación de personal; el Centro de Control de líderes no contamina las rutinas diarias.
  - *Negativas:* Requiere sincronización de múltiples tablas al calcular el índice general de productividad del empleado.

---

*Documento enlazado a [INDICE_MAESTRO.md](../INDICE_MAESTRO.md), [arquitectura.md](arquitectura.md) y [SDLC.md](../flujos/SDLC.md).*
