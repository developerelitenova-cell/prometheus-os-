# NOVA WORD

> **Enterprise Operating System & Organizational Intelligence**  
> Plataforma de gestión operativa, memoria corporativa, evaluación de desempeño y automatización para **Elite Nutrition S.A.S.** y **Futupro Colombia**.

---

## 🏛️ Descripción General

**NOVA WORD** es una plataforma desacoplada y orientada a la gobernanza operativa empresarial. Conecta la jerarquía organizacional, los manuales de funciones y la rendición de cuentas diaria a través de tres capas de tareas sincronizadas:

1. **Memoria del Cargo (Rutinas Recurrentes):** Plantillas de tareas diarias, semanales y mensuales inherentes al rol laboral.
2. **Centro de Control Gerencial (Entregas Programadas):** Delegación de hitos corporativos con periodicidad mensual o semanal.
3. **Trazabilidad Ad-Hoc con Evidencia Inmutable:** Sistema de confirmación de tareas mediante fotografía/captura y justificación obligatoria en caso de incumplimiento.

---

## 📚 Suite Maestra de Documentación Técnica y Operativa

La documentación completa del proyecto ha sido auditada y generada de manera exhaustiva en el directorio [`/docs`](docs/INDICE_MAESTRO.md):

| Documento | Audiencia Principal | Enlace Directo |
| :--- | :--- | :--- |
| **Índice Maestro de Documentación** | Todas las audiencias | [docs/INDICE_MAESTRO.md](docs/INDICE_MAESTRO.md) |
| **Instalación y Configuración** | DevOps / Desarrolladores | [docs/instalacion_configuracion.md](docs/instalacion_configuracion.md) |
| **Modelo de Datos y Esquemas ERD** | Arquitectos / Desarrolladores | [docs/modelo_datos.md](docs/modelo_datos.md) |
| **Contratos de API REST** | Desarrolladores Backend & Frontend | [docs/tecnica/api_contratos.md](docs/tecnica/api_contratos.md) |
| **Arquitectura Global del Sistema** | Arquitectos / Tech Leads | [docs/tecnica/arquitectura.md](docs/tecnica/arquitectura.md) |
| **Manual de Operaciones y Monitoreo (SRE)** | Operadores / SysAdmins | [docs/tecnica/manual_operacion_monitoreo.md](docs/tecnica/manual_operacion_monitoreo.md) |
| **Guía de Diagnóstico (Troubleshooting)** | Soporte / Desarrolladores | [docs/tecnica/guia_troubleshooting.md](docs/tecnica/guia_troubleshooting.md) |
| **Catálogo de Pantallas y Vistas** | Diseñadores / Operadores | [docs/usabilidad/catalogo_pantallas.md](docs/usabilidad/catalogo_pantallas.md) |
| **Flujos Operativos Paso a Paso** | Colaboradores y Gerentes | [docs/usabilidad/flujos_operativos.md](docs/usabilidad/flujos_operativos.md) |
| **Manual de Roles y Matriz de Permisos** | Gerencia, Auditoría y RRHH | [docs/usabilidad/manual_roles_permisos.md](docs/usabilidad/manual_roles_permisos.md) |

---

## ⚡ Inicio Rápido (Quickstart)

### Prerrequisitos
- **Node.js** v18+ y `npm`
- **Python** 3.11+ y `pip` / `virtualenv`
- Cuenta activa en **Supabase** y credenciales de API

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend (Vue 3 + Vite)
```bash
cd frontend
npm install
npm run dev
```

La aplicación quedará accesible en `http://localhost:5173`. Para más detalles, consulte la [Guía de Instalación](docs/instalacion_configuracion.md).
