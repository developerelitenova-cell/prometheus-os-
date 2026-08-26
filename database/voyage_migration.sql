-- Migra corporate_memory de embeddings de Gemini (768 dim) a Voyage AI (voyage-4-lite, 1024 dim).
-- La tabla estaba vacía al momento de esta migración: si ya existen filas al ejecutar esto,
-- hay que volver a inyectar todo el conocimiento después (los vectores viejos no son compatibles
-- con el nuevo espacio vectorial ni con la nueva dimensión).

DROP INDEX IF EXISTS corporate_memory_embedding_idx;

ALTER TABLE corporate_memory
  ALTER COLUMN embedding TYPE VECTOR(1024);

CREATE INDEX corporate_memory_embedding_idx ON corporate_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_corporate_memory(
  query_embedding VECTOR(1024),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    corporate_memory.id,
    corporate_memory.content,
    corporate_memory.metadata,
    1 - (corporate_memory.embedding <=> query_embedding) AS similarity
  FROM corporate_memory
  WHERE 1 - (corporate_memory.embedding <=> query_embedding) > match_threshold
  ORDER BY corporate_memory.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
