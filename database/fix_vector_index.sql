-- El índice ivfflat necesita miles de filas para funcionar bien (con "lists = 100" y
-- pocas filas, la búsqueda solo revisa una fracción de los documentos y pierde resultados
-- relevantes). Se quita mientras el catálogo de conocimiento es pequeño; sin índice,
-- pgvector hace búsqueda exacta, que a esta escala es igual de rápida y sí encuentra todo.
DROP INDEX IF EXISTS corporate_memory_embedding_idx;
