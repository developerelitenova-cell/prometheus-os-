-- Activa la extensión de vectores
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla de Memoria Corporativa (El Cerebro)
CREATE TABLE IF NOT EXISTS corporate_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(768),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda de similitud rápida
CREATE INDEX IF NOT EXISTS corporate_memory_embedding_idx ON corporate_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Crear función RPC para hacer coincidencias (búsqueda RAG)
CREATE OR REPLACE FUNCTION match_corporate_memory(
  query_embedding VECTOR(768),
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
