# Creación de Módulo Helpdesk IA y Redirección WhatsApp - SOP

## 1. Objetivo
Establecer el procedimiento determinista para inyectar un componente de chat de Inteligencia Artificial (recepcionista virtual) en el frontend del "Sistema de Inventario". Este asistente resolverá dudas básicas y redirigirá al empleado hacia el WhatsApp corporativo del personal de soporte correspondiente cuando la intención sea compleja (ej. cambio de claves).

## 2. Entradas
- Código fuente del frontend en `C:\Users\smayo\Sistema de Inventario\frontend`.
- Credenciales de API del LLM.
- Directorio de contactos corporativos.

## 3. Salidas
- Un componente de interfaz de usuario (UI) de ChatBot inyectado globalmente en la aplicación.
- Lógica de clasificación de intenciones en la IA.

## 4. Lógica y Pasos
1. **Exploración:** El script Python buscará el layout principal de la aplicación (`App.vue`, `MainLayout.vue` o similares) para inyectar el componente flotante.
2. **Generación del Componente:** El script generará un archivo `AiHelpdesk.vue` o similar.
3. **Inyección del Prompt de Sistema:** Se inyectará el contexto a la IA indicándole que asume el rol de Soporte y que devuelva enlaces dinámicos `https://wa.me/[NUMERO]?text=[MENSAJE]`.
4. **Modificación Estructural:** El script registrará el componente en el archivo principal y asegurará su importación de forma segura sin romper el DOM existente.

## 5. Restricciones y Casos Borde
- *Trampa Conocida:* Los entornos de React y Vue tienen ciclos de vida distintos.
- *Solución:* El script debe confirmar la tecnología leyendo el `package.json` antes de inyectar el componente.
- *Trampa Conocida:* Sobrescritura destructiva de archivos core (`App.vue`).
- *Solución:* El script utilizará búsqueda y reemplazo de patrones seguros (expresiones regulares o AST) para inyectar los tags HTML correspondientes al final de los contenedores principales.
