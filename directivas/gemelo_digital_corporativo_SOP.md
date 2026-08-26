# Gemelo Digital Corporativo - SOP (Actualizado Fase 2)

## 1. Objetivo
Construir un ecosistema de gestión inteligente de desempeño y asistencia por rol para Elite Nutrition S.A.S. & FutuPro S.A.S. integrando manuales de cargo, evaluación de tareas diarias y chatbots especializados.

## 2. Entradas
- Matriz de Roles (`data/roles_raw.tsv`) - 70 cargos en 8 áreas.
- Manuales y Plantillas asociadas a cada rol.

## 3. Salidas
- `scripts/agent_builder.py`: Ingesta TSV y construye jerarquías, RBAC y módulos KPI.
- `backend/performance/`: Módulo de evaluación de tareas y KPIs.
- `backend/knowledge_base/role_agents.py`: Orquestador de Chatbots especializados por cargo.
- `frontend/`: Portal "Academia Elite" con paneles de desempeño y asistente IA.

## 4. Lógica y Pasos
1. **Ingestión & Hub**:
   - `DataHub.vue` proporciona la interfaz de carga masiva rápida (CRUD avanzado) para el recopilador.
   - `SharedProcessManager.vue` asigna objetivos y procesos compartidos a múltiples roles de un área con un clic.
   - `agent_builder.py` ingesta esta metadata enriquecida.
2. **RBAC & Jerarquía**:
   - Nivel 1: Acceso Total.
   - Nivel 2: Acceso a su área y Nivel 3 de otras áreas.
   - Nivel 3: Acceso solo a Nivel 3 de su área.
3. **Tareas y KPIs**: Los colaboradores reportan tareas diarias. El motor computa el cumplimiento contra el manual del cargo usando OKRs.
4. **Chatbot de Rol**: GraphRAG restringe el contexto (documentos y procesos) al rol específico del usuario conectado.

## 5. Restricciones y Casos Borde
- *Trampa Conocida*: Diseño base aburrido y difícil de leer para 70 roles.
- *Solución*: Implementar Vanilla CSS con diseño Premium Dark Mode y Glassmorphism para "Academia Elite" y "Data Hub", mejorando el UX del recopilador.
