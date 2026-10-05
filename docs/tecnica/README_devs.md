# Guía de Onboarding y Convenciones para Desarrolladores

> **Módulo:** Ingeniería de Software y Desarrollo  
> **Audiencia:** Desarrolladores Frontend, Desarrolladores Backend, QA Engineers  
> **Relacionado con:** [INDICE_MAESTRO.md](../INDICE_MAESTRO.md) | [instalacion_configuracion.md](../instalacion_configuracion.md) | [SDLC.md](../flujos/SDLC.md)

---

## 1. Bienvenida al Equipo de Ingeniería

**NOVA WORD** es el sistema operativo corporativo y gemelo digital de **Elite Nutrition S.A.S.** y **Futupro**. Su propósito es orquestar las tres capas operativas de la compañía (tareas estándar de cargo, entregas programadas y pendientes directos), integrando evaluación continua de KPIs y un gemelo digital asistido por modelos avanzados de Inteligencia Artificial (Claude de Anthropic).

---

## 2. Estructura del Repositorio

El monorepositorio está organizado de forma modular para desacoplar claramente el frontend cliente del backend de servicios y la capa de persistencia:

```text
nova-word-/
├── backend/                  # API REST en Python (FastAPI)
│   ├── knowledge_base/       # Agentes de IA y memoria de roles
│   ├── performance/          # Motores de KPIs y gestión de tareas
│   ├── simulation_engine/    # Simulación y gemelo digital corporativo
│   ├── tests/                # Pruebas unitarias de backend con pytest
│   ├── main.py               # Punto de entrada de la aplicación FastAPI
│   ├── render.yaml           # Manifiesto de despliegue en Render
│   └── requirements.txt      # Dependencias de producción Python
├── database/                 # Migraciones SQL para Supabase PostgreSQL
├── docs/                     # Suite maestra de documentación técnica y operativa
├── frontend/                 # Aplicación SPA en Vue 3 + Vite
│   ├── public/               # Assets estáticos (logos, favicons)
│   ├── src/
│   │   ├── api/              # Clientes HTTP (Axios, Supabase, KPIs, Auth)
│   │   ├── assets/           # CSS global y Tailwind (tailwind.css)
│   │   ├── components/       # Componentes Vue reutilizables (modales, visores)
│   │   ├── router/           # Vue Router con guards RBAC (index.js)
│   │   ├── utils/            # Funciones utilitarias (cálculo de periodos, fechas)
│   │   ├── views/            # Vistas principales de página
│   │   ├── App.vue           # Componente raíz
│   │   └── main.js           # Inicialización de la aplicación Vue
│   ├── tests/                # Pruebas unitarias frontend con Vitest
│   ├── package.json          # Dependencias y scripts npm
│   ├── tailwind.config.js    # Paleta de colores corporativa y tokens de diseño
│   └── vite.config.js        # Configuración del bundler Vite
└── package.json              # Tooling de apoyo a nivel raíz
```

---

## 3. Convenciones de Código y Estándares Técnicos

### 3.1. Frontend (Vue 3 / JavaScript / CSS)
1. **Composition API Exclusivo:** Toda vista o componente debe utilizar la sintaxis `<script setup>` de Vue 3. Se prohíbe el uso de Options API en nuevo código.
2. **Nomenclatura de Archivos:**
   - Componentes y Vistas: **PascalCase** (ej. `LeaderDashboard.vue`, `TaskEvidenceModal.vue`).
   - Módulos utilitarios y servicios: **camelCase** (ej. `taskPeriods.js`, `supabase.js`).
3. **Estilos y Tokens de Diseño:**
   - Utilice **Tailwind CSS** respetando la paleta institucional:
     - Tonos primarios dorados/ámbar: `#d4b06a`, `#8a6d3d`, `#b08d57`.
     - Tonos de éxito/evidencia: `#2e7d32`, `#34c759`, `#e8f5e9`.
     - Tonos de error/alerta: `#c62828`, `#ff3b30`, `#ffebee`.
   - Se prohíbe el uso de colores genéricos planos sin atenuación o contraste accesible.
4. **Manejo de Errores y Estados Visuales:**
   - Todo formulario o acción asíncrona debe reflejar visualmente:
     - Estado de carga (`loading`, spinners accesibles).
     - Estado de éxito (toast flotante reactivo).
     - Estado de error (alertas contextuales con mensaje explicativo).

### 3.2. Backend (FastAPI / Python)
1. **Tipado Estricto con Pydantic:** Todos los cuerpos de petición (`request body`) y respuestas deben modelarse usando clases `BaseModel` de Pydantic con tipos anotados (`Optional`, `List`, `Dict`).
2. **PEP 8:** Seguir el estándar oficial de estilo Python (sangría de 4 espacios, nombres de funciones en `snake_case`, constantes en `UPPER_CASE`).
3. **Manejo de Excepciones:** Lanzar siempre excepciones controladas mediante `HTTPException(status_code=..., detail=...)`. Nunca dejar fallar el worker con errores 500 no capturados.
4. **Seguridad en Endpoints:** Proteger los endpoints sensibles con la dependencia `Depends(verify_jwt)` y validadores de rol (`require_admin_or_manager`, `require_password_manager`).

---

## 4. Flujo de Trabajo en 5 Minutos (Quickstart)

```bash
# 1. Clonar el repositorio
git clone https://github.com/developerelitenova-cell/nova-word-.git
cd nova-word-

# 2. Configurar y levantar el backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 5001 &

# 3. Configurar y levantar el frontend
cd ../frontend
npm install
npm run dev
```

Abra su navegador en `http://localhost:5173`. Para ingresar, solicite credenciales de prueba al administrador del sistema o use una cuenta aprobada.
