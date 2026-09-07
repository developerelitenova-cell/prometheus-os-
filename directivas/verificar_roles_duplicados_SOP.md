# Verificar Roles Duplicados - SOP

## 1. Objetivo
Verificar en la base de datos (Supabase) si existen roles con nombres duplicados dentro de la misma área o a nivel global, para asegurar la integridad de los datos de la plataforma PROMETHEUS OS.

## 2. Entradas
- Conexión a la base de datos de Supabase vía API REST (usando credenciales de `frontend/.env.local`).
- Tabla `roles`.
- Tabla `areas` (opcional, para contexto de área).

## 3. Salidas
- Script de Python `scripts/verificar_roles_duplicados.py` puro y determinista.
- Reporte impreso en consola listando los nombres de roles que se repiten y la cantidad de veces que aparecen.

## 4. Lógica y Pasos
1. **Conectar a Supabase:** Cargar las variables de entorno desde `frontend/.env.local` e inicializar el cliente de Supabase.
2. **Consultar Roles:** Extraer todos los registros de la tabla `roles` incluyendo su `id`, `name` y `area_id`.
3. **Procesar Datos:** 
   - Crear un diccionario para contar las ocurrencias de cada nombre de rol.
   - (Opcional) Contar las ocurrencias de cada combinación `(name, area_id)`.
4. **Identificar Duplicados:** Filtrar aquellos roles cuyo conteo sea mayor a 1.
5. **Reportar:** Imprimir el listado de roles duplicados de forma clara en la consola para su posterior limpieza si es necesario.

## 5. Restricciones y Casos Borde
- *Trampa Conocida:* Supabase puede devolver resultados paginados si hay más de 1000 registros, pero sabemos que la cantidad total ronda los 70 roles. No se requerirá paginación compleja.
- *Nota:* No se eliminará ningún registro automáticamente en este script. El alcance es únicamente de verificación y reporte (Read-Only).
