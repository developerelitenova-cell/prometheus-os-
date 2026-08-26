# Ingesta Masiva de Flujos de Trabajo - SOP

## 1. Objetivo
Automatizar la recopilación y estructuración de la información operativa de cada rol. En lugar de procesar manualmente cada archivo de texto a través del frontend (`MapperView.vue`), utilizaremos un script para procesar de forma masiva los archivos `.txt` exportados previamente.

## 2. Entradas
- Archivos `.txt` con los manuales/transcripciones ubicados en la carpeta `frontend/` (ej. `tmp_gerente_general.txt`).
- Base de datos en Supabase (tabla `roles`).

## 3. Salidas
- Inserción o actualización en la tabla `role_workflows` en Supabase con los datos estructurados en formato JSON (`tasks`, `inputs`, `outputs`, `tools_used`, `bottlenecks`, `kpis`).
- Actualización de los datos en batch.

## 4. Lógica y Pasos
1. **Mapeo de Archivos:** Iterar sobre los archivos `tmp_*.txt` en la carpeta `frontend/`.
2. **Emparejamiento de Roles:** Usar heurísticas o coincidencias de nombre para buscar el `id` del rol correspondiente en la tabla `roles`.
3. **Procesamiento de IA:** Llamar a la API de Anthropic (Claude) pasando el texto del archivo junto con el prompt predefinido para extraer el flujo estructurado.
4. **Almacenamiento:** Guardar la respuesta validada en `role_workflows` (usando `upsert` basado en el `role_id`).

## 5. Restricciones y Casos Borde
- *Trampa Conocida:* Los archivos pueden tener nombres que no coincidan exactamente con la base de datos (ej. `tmp_disenadorgrafico.txt` vs "Diseñador Gráfico").
- *Solución:* Implementar normalización de strings (quitar acentos, espacios, minúsculas) para emparejar los archivos con el nombre del rol en la base de datos, o permitir mapeo manual en un log.
- *Trampa Conocida:* Los resultados del LLM pueden venir envueltos en bloques de código markdown (` ```json ... ``` `).
- *Solución:* Remover las etiquetas de bloque de código antes de hacer `json.loads`.
