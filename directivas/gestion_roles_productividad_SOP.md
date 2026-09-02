# Gestión de Roles, Productividad y Comunicación - SOP

## 1. Objetivo
Implementar un sistema integral de comunicación, documentación y gestión de productividad en PROMETHEUS OS, que incluya asignación de roles avanzada (tipo Discord), distribución de manuales, planner de tareas, mensajes categorizados y cronogramas con confirmación obligatoria, permitiendo a los líderes monitorear el rendimiento en tiempo real.

## 2. Entradas
- Datos de usuarios, roles y áreas existentes.
- Requerimiento de 8 módulos: Manuales, Mensajes, Dashboard de Liderazgo, Cronogramas, Planner Diario, Interfaz de Permisos, Listado de Pendientes y Programador de Eventos.

## 3. Salidas
- `database/productividad_migration.sql`: Migración de base de datos para agregar tablas de `manuals`, `notifications`, `messages`, `events` y `event_acknowledgements`.
- Controladores/Rutas para interactuar con estas nuevas tablas.
- Componentes Frontend en Vue 3:
  - Visualizador y Gestor de Manuales.
  - Interfaz de asignación de roles estilo Discord.
  - Dashboard de Liderazgo.
  - Planner (Diario, Semanal, Mensual).
  - Calendario y Modal de Comunicados.

## 4. Lógica y Pasos
1. **Base de Datos**: Extender el esquema actual con las nuevas entidades vinculadas a la tabla `roles` y `profiles`.
2. **Interfaz de Roles (Discord-like)**: Crear un panel donde los Super Admins y Encargados de Área puedan asignar permisos (`access_level`) y roles a los perfiles visualmente.
3. **Manuales y Alertas**: Cuando un manual se actualiza o se asigna una tarea a un rol, se genera una notificación ("alerta roja").
4. **Dashboard de Líderes**: Consultar métricas, tareas y desempeño histórico de los perfiles subordinados, filtrado por el área del líder (para niveles de acceso 1 y 2).
5. **Calendario y Modal Obligatorio**: Mostrar comunicados importantes. Si un evento requiere confirmación obligatoria, aparecerá un pop-up que solo se cierra al darle a "Entendido".

## 5. Restricciones y Casos Borde
- *Trampa Conocida*: El modal de confirmación podría atascar la experiencia del usuario si falla la conexión de red al dar clic en "Entendido".
- *Solución*: Manejar el estado localmente, ocultar el modal de inmediato y hacer la petición en segundo plano.
- *Restricción*: La seguridad de la información. Un líder nivel 3 (Individual) no debe poder acceder al Dashboard de Líderes, solo niveles 1 y 2.
