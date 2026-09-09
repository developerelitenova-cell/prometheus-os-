# SOP: Reset de Usuarios para Re-Onboarding

## Objetivo
Eliminar el registro de auth y el perfil de usuarios específicos de Supabase para que puedan volver a realizar el proceso completo de onboarding (registro, aprobación y mapeo de flujo).

## Cuándo usarlo
Cuando un usuario:
- Cometió errores en su proceso de mapeo y necesita reiniciarlo
- Fue cambiado de cargo y debe hacer el proceso desde cero
- Presentó problemas técnicos durante el onboarding

## Entradas Requeridas
- Lista de emails de los usuarios a eliminar
- Credenciales de Supabase (VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)

## Pasos del Script (`scripts/reset_usuarios.py`)
1. Cargar credenciales desde `frontend/.env.local` y `scripts/.env.local`
2. Para cada email:
   a. Buscar el usuario en `auth.users` via `admin.list_users()`
   b. Mostrar la información encontrada para confirmación
   c. Eliminar el registro de `profiles` (ON DELETE CASCADE elimina dependencias)
   d. Eliminar el usuario de `auth.users` via `admin.delete_user(user_id)`
3. Reportar resultado por cada usuario

## Restricciones / Casos Borde
- **NUNCA eliminar** usuarios con `is_master_admin = true` sin confirmación explícita
- La eliminación de `auth.users` activa el `ON DELETE CASCADE` en `profiles`, por lo tanto el orden CORRECTO es borrar de auth primero (o dejar que cascade lo haga)
- Si el usuario no existe en auth pero sí en profiles, eliminar solo el profile
- `list_users()` pagina — si hay muchos usuarios, iterar páginas. La API devuelve 50 por defecto
- El campo `approval_status` puede quedar pendiente si no se borra correctamente el profile

## Salida
Log por consola confirmando cada eliminación exitosa o error por usuario.
