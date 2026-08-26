// Cliente mínimo para la API de embeddings de Voyage AI (recomendada por Anthropic
// como complemento de Claude, que no ofrece embeddings propios).
// https://docs.voyageai.com/reference/embeddings-api

export const VOYAGE_MODEL = 'voyage-4-lite';
export const VOYAGE_DIMENSION = 1024;

// input_type: 'document' al indexar contenido, 'query' al buscar (embeddings asimétricos).
export async function embedText(text, inputType) {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY no está configurada en el servidor.');
  }

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: VOYAGE_MODEL,
      input_type: inputType,
      output_dimension: VOYAGE_DIMENSION,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Voyage AI error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
