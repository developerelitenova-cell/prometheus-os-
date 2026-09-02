# Actualización de Despliegue - SOP

## 1. Objetivo
Automatizar y estandarizar el proceso de despliegue de nuevas actualizaciones del frontend (PROMETHEUS OS) a producción utilizando Vercel.

## 2. Entradas
- Código fuente actualizado en el directorio `frontend/`.
- Configuración de Vercel preexistente.

## 3. Salidas
- Nueva versión de la aplicación desplegada en Vercel.
- Logs de la ejecución del despliegue guardados o mostrados en consola.

## 4. Lógica y Pasos
1. **Verificación de Entorno:** Asegurar que la ejecución se realiza apuntando a la carpeta `frontend/`.
2. **Despliegue a Producción:** Ejecutar el comando `vercel --prod` para enviar los cambios a Vercel y realizar el pase a producción.
3. **Captura de Logs:** Imprimir y verificar el output del comando para confirmar si el despliegue fue exitoso.

## 5. Restricciones y Casos Borde
- *Trampa Conocida:* El comando de vercel podría fallar si la sesión no está autenticada.
- *Solución:* Actualmente se asume que el CLI de Vercel está configurado a nivel global en el equipo de desarrollo.
- *Trampa Conocida:* Errores de linting o compilación (TypeScript/Vue) en el build remoto de Vercel.
- *Solución:* El script debe abortar la ejecución y mostrar el `stderr` del comando para que el agente inicie el Protocolo de Auto-Corrección.
