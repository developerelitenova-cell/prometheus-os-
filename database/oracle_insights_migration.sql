-- ============================================================
-- Panorama de Conocimiento del Oráculo (inspirado en LLM Wiki:
-- detectar vacíos y conexiones en vez de solo responder preguntas).
--
-- corporate_memory tiene RLS activado pero NUNCA tuvo una política de
-- lectura -- hasta ahora solo se leía desde funciones serverless con
-- la service role key (memory.js, role-chat.js), que saltan RLS. Para
-- que el admin master pueda ver el panorama de qué sabe y qué no sabe
-- el Oráculo directamente desde el cliente, agregamos una política de
-- solo-lectura restringida a is_master_admin().
-- ============================================================

CREATE POLICY "corporate_memory_admin_select" ON corporate_memory
  FOR SELECT USING (is_master_admin());
