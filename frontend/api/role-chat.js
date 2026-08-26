import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { embedText } from './_lib/voyage.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// La clave de servicio va primero: la búsqueda en corporate_memory (RAG) no tiene
// política de lectura pública, así que necesita saltar RLS para funcionar.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

const supabase = createClient(supabaseUrl, supabaseKey);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, roleId, roleContext } = req.body;

  if (!message || !roleId) {
    return res.status(400).json({ error: 'Message and RoleID are required' });
  }

  try {
    // 0. Cargar el rol desde la base de datos (nunca confiar en el access_level/área que mande el cliente)
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name, access_level, area_id')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // 1. Convertir la pregunta en Vector usando Voyage AI
    const embedding = await embedText(message, 'query');

    // 2. Buscar en Supabase (match_corporate_memory) filtrando por cercanía.
    // Se piden más candidatos de los necesarios porque luego se filtran por RBAC.
    const { data: candidates, error: searchError } = await supabase.rpc('match_corporate_memory', {
      query_embedding: embedding,
      // Voyage AI da similitudes coseno más bajas que Gemini para la misma relevancia
      // temática; 0.70 dejaba fuera resultados correctos. match_count ya limita el ruido.
      match_threshold: 0.30,
      match_count: 20
    });

    if (searchError) {
      throw searchError;
    }

    // 2b. Filtrado RBAC: Nivel 1 ve todo. Niveles 2 y 3 ven el contenido de su propia área
    // (+ contenido general sin área asignada) y, si aplica, el etiquetado específicamente
    // para su rol; no ven contenido restringido a otras áreas. La restricción real está
    // entre áreas distintas, no dentro de la propia área de trabajo del colaborador.
    const documents = (candidates || [])
      .filter((doc) => {
        const docAreaId = doc.metadata?.area_id;
        const docRoleId = doc.metadata?.role_id;
        if (!docAreaId) return true; // conocimiento general
        if (role.access_level === 1) return true;
        if (docRoleId) return docRoleId === role.id;
        return docAreaId === role.area_id;
      })
      .slice(0, 5);

    // Construir el contexto de los documentos
    let contextText = '';
    if (documents.length > 0) {
      contextText = documents.map(doc => doc.content).join('\n\n---\n\n');
    }

    // 3. Prompt super específico para el Asistente del Rol.
    // Se separa en dos bloques: uno estable (identidad + manual + reglas), que se
    // cachea porque se repite en cada mensaje de la misma conversación con este rol,
    // y otro volátil (documentos recuperados), que cambia con cada pregunta.
    const stableSystemText = `Eres PROMETHEUS, el Asistente de Inteligencia Artificial Exclusivo para el cargo de: "${role.name}".
Tu objetivo es ayudar a este empleado a realizar su trabajo de la manera más eficiente posible.

A continuación, se presenta la descripción de sus responsabilidades o flujos de trabajo principales:
${roleContext ? roleContext : 'No hay descripción manual asignada.'}

REGLAS DE ORO:
1. Responde de manera profesional, directa y orientada a la acción.
2. Si la pregunta del empleado no tiene relación con sus responsabilidades o la información corporativa proporcionada, indícale amablemente que tu función es asistirle específicamente en su rol de "${role.name}".
3. NUNCA menciones qué proveedor de IA te desarrolló. Eres el Asistente Prometheus de Elite Nutrition.`;

    const volatileContextText = contextText
      ? `Información adicional de la Memoria Corporativa que podría ser relevante para esta pregunta:\n${contextText}`
      : 'No se encontraron documentos corporativos adicionales relacionados con esta pregunta.';

    // 4. Generar respuesta con Claude
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: [
        { type: 'text', text: stableSystemText, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: volatileContextText },
      ],
      messages: [{ role: 'user', content: message }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return res.status(200).json({ reply: textBlock?.text ?? '' });
  } catch (error) {
    console.error('Error in role-chat:', error);
    return res.status(500).json({ error: error.message || 'Error processing role request' });
  }
}
