# Arquitectura Global del Sistema

> **NOVA WORD — Enterprise Operating System**  
> **Versión de Arquitectura:** 2.1.0 | **Diseño:** Micro-Servicios Híbridos / Jamstack Cloud-Native  
> **Empresas Soportadas:** Elite Nutrition S.A.S. & Futupro Colombia

---

## 1. Visión y Topología de Alto Nivel

NOVA WORD está diseñado bajo una arquitectura desacoplada y orientada a eventos, combinando una Single Page Application (SPA) reactiva en el frontend, un motor de lógica e inferencia REST en FastAPI, y un backend as a service empresarial montado sobre PostgreSQL administrado (Supabase).

```mermaid
C4Context
  title Diagrama de Contexto de Sistema (C4 Context) - NOVA WORD

  Person(employee, "Colaborador Operativo", "Ejecuta tareas diarias, sube evidencias fotográficas y consulta manuales.")
  Person(leader, "Líder / Gerente de Área", "Supervisa el cumplimiento de su equipo, delega órdenes y analiza reportes.")
  Person(master, "Master Admin / Auditor", "Gestiona la arquitectura de cargos, seguridad global, modelos IA y directrices.")

  System(novaword, "NOVA WORD", "Plataforma centralizada de gestión operativa, memoria organizacional, KPI tracking y agentes IA.")

  System_Ext(supabase, "Supabase Cloud", "PostgreSQL con pgvector, Auth, Realtime WebSocket y Buckets de Storage.")
  System_Ext(anthropic, "Anthropic API", "Modelos Claude 3.5 Sonnet para RAG, evaluación de KPIs y extracción de flujos.")
  System_Ext(onedrive, "Microsoft OneDrive", "Repositorio corporativo institucional de manuales y actas (pendiente de verificación).")

  Rel(employee, novaword, "Usa interfaz web HTTPS")
  Rel(leader, novaword, "Monitorea cuadrantes operativos y aprueba cuentas")
  Rel(master, novaword, "Controla topología empresarial y credenciales")

  Rel(novaword, supabase, "Consultas directas vía PostgREST y Realtime (JWT RLS)")
  Rel(novaword, anthropic, "Inferencia semántica y generación de directrices")
  Rel(novaword, onedrive, "Hipervínculos a documentación oficial de cargo")
```

---

## 2. Diagrama de Contenedores (C4 Container)

El sistema distribuye sus responsabilidades operativas en tres capas independientes:

```mermaid
graph TB
    subgraph "Capa de Presentación (Frontend)"
        Client["Navegador Web del Usuario"]
        SPA["Vue 3 + Vite SPA\n(Desplegado en Vercel CDN)\n- Tailwind CSS / Glassmorphism\n- Vue Router con RBAC\n- D3.js + Three.js + Chart.js"]
    end

    subgraph "Capa de Lógica & AI Engine (Backend)"
        API["FastAPI Engine (Python 3.11)\n(Desplegado en Render Web Service)\n- Uvicorn / Gunicorn\n- SlowAPI Rate Limiter\n- PyJWT Security Guard"]
        Agents["Submódulo Knowledge Base & Oracle\n- Inyección RAG\n- Generador de KPIs\n- Extractor de Workflows"]
    end

    subgraph "Capa de Persistencia & Eventos (Supabase)"
        Auth["Supabase GoTrue Auth\n(Identidades y Sesiones JWT)"]
        Postgres[("PostgreSQL 15 Enterprise\n- Row Level Security (RLS)\n- pgvector 768 dims (Embeddings)\n- Triggers & Auditoría Inmutable")]
        Storage["Supabase Storage\n- profile_photos\n- task_evidence\n- announcements"]
        Realtime["Supabase Realtime\n(WebSockets CDC Postgres)"]
    end

    subgraph "Servicios Externos de IA"
        Claude["Anthropic Claude 3.5 Sonnet\n(LLM Inference)"]
    end

    Client -->|HTTPS / WSS| SPA
    SPA -->|REST API / Bearer JWT| API
    SPA -->|PostgREST Directo / RLS| Postgres
    SPA -->|WebSockets Escucha| Realtime
    SPA -->|Gestión de Sesión| Auth

    API -->|Service Role Privilegiado| Postgres
    API -->|Almacena Evidencias Binarias| Storage
    API -->|Inferencia LLM| Claude
    Agents -->|Embeddings Search| Postgres
```

---

## 3. Principios de Arquitectura y Patrones de Diseño

### 3.1 Doble Canal de Comunicación (Dual-Channel Architecture)
1. **Canal Directo Frontend ↔ Supabase (PostgREST & Realtime):**
   - Utilizado para operaciones transaccionales comunes: lectura de tareas, marcado de checklist, consulta de catálogo de cargos y notificaciones en vivo.
   - La seguridad no reside en el servidor web intermedio, sino en el motor PostgreSQL mediante políticas de **Row Level Security (RLS)** que evalúan `auth.uid()`.
2. **Canal Seguro Frontend ↔ FastAPI ↔ Supabase/Anthropic:**
   - Utilizado para operaciones de alta criticidad: creación administrativa de usuarios (`admin/create-employee`), subida y validación estricta de fotos de identidad, cálculo algorítmico de KPIs, inferencia RAG y conversiones vectoriales.
   - FastAPI utiliza la `SUPABASE_SERVICE_ROLE_KEY` tras autenticar y autorizar rigurosamente el JWT del usuario emisor.

### 3.2 Aislamiento Multi-Empresa (Multi-Tenant Segregation)
NOVA WORD soporta la operación conjunta de **Elite Nutrition S.A.S.** y **Futupro Colombia**:
- Cada usuario en `profiles` cuenta con el atributo `company`.
- Las consultas en la interfaz y las políticas RLS aíslan los registros operativos según la empresa del usuario en sesión, impidiendo que líderes o colaboradores accedan a datos financieros o actas de la otra entidad.
- El usuario **Master Admin** posee visibilidad global y puede conmutar entre contextos corporativos.

### 3.3 Integración de Inteligencia Artificial (RAG & Agentes Especialistas)
- **Vector Store:** PostgreSQL con la extensión `vector` habilitada, almacenando tensores de 768 dimensiones generados a partir de los manuales y directrices operativas.
- **Inferencia Contextual:** Cuando un usuario consulta al Agente de su Cargo (`/api/v1/chat`), el backend realiza una búsqueda de similitud de coseno (`1 - (embedding <=> query)`), inyecta los fragmentos pertinentes en el System Prompt de Claude 3.5 Sonnet y genera respuestas alineadas con los manuales corporativos.

---

## 4. Perímetro de Red y Seguridad

```mermaid
flowchart LR
    Internet((Internet Pública)) --> Cloudflare["WAF / CDN (Vercel)"]
    Cloudflare --> SPA_Host["Frontend Static Assets"]
    Internet --> Render_LB["Render Reverse Proxy & TLS"]
    Render_LB --> FastAPI_Pod["FastAPI Workers (Gunicorn)"]
    FastAPI_Pod --> Supabase_Firewall["Supabase Network Firewall"]
    Supabase_Firewall --> DB[(PostgreSQL + Storage)]
    FastAPI_Pod --> Anthropic_API["Anthropic AI Gateway"]
```

- **Cifrado en Tránsito:** Todo el tráfico transita exclusivamente por TLS 1.3 con certificados gestionados automáticamente.
- **Encabezados de Seguridad:** Inyección de `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin`.
- **Cero Secretos en el Frontend:** Las variables expuestas al navegador (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) solo conceden privilegios públicos protegidos por RLS. Las llaves maestras (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`) residen encriptadas en el backend.

---

*Documento enlazado a [INDICE_MAESTRO.md](../INDICE_MAESTRO.md), [arquitectura_backend.md](arquitectura_backend.md) y [arquitectura_frontend.md](arquitectura_frontend.md).*
