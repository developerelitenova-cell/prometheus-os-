import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { embedText } from './_lib/voyage.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// La clave de servicio va primero: 'embed' escribe en corporate_memory, lo que requiere
// saltar RLS (no hay política que permita INSERT con la clave pública).
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

let supabase = null;
let anthropic = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, text, query, history = [] } = req.body;

    if (!supabase) {
      return res.status(500).json({ error: 'La conexión a la Memoria Corporativa no está configurada.' });
    }

    if (action === 'embed') {
      if (!process.env.VOYAGE_API_KEY) {
        return res.status(500).json({ error: 'El Motor de Embeddings no está configurado.' });
      }

      const embedding = await embedText(text, 'document');

      const { error: insertError } = await supabase
        .from('corporate_memory')
        .insert([{ content: text, embedding: `[${embedding.join(',')}]` }]);

      if (insertError) throw insertError;

      return res.status(200).json({
        message: 'Conocimiento inyectado al Cerebro Corporativo exitosamente.',
      });
    }

    if (action === 'chat') {
      if (!process.env.VOYAGE_API_KEY) {
        return res.status(500).json({ error: 'El Motor de Embeddings no está configurado.' });
      }
      if (!anthropic) {
        return res.status(500).json({ error: 'El Motor de Razonamiento no está configurado.' });
      }

      // 1. Convert user query to embedding
      const embedding = await embedText(query, 'query');

      // 2. Query Supabase corporate_memory
      // Voyage AI da similitudes coseno más bajas que Gemini para la misma relevancia
      // temática; 0.70 dejaba fuera resultados correctos.
      const { data: documents, error: searchError } = await supabase.rpc('match_corporate_memory', {
        query_embedding: embedding,
        match_threshold: 0.30,
        match_count: 5
      });

      if (searchError) throw searchError;

      let contextText = '';
      if (documents && documents.length > 0) {
        contextText = documents.map(doc => doc.content).join('\n\n---\n\n');
      }

      // 3. Obtener la Personalidad (Role Agent) y Memoria del Usuario
      let roleName = 'Oráculo';
      let rolePrompt = 'Eres NOVA WORK, el Cerebro Corporativo y Oráculo de Elite Nutrition.';
      let userMemoryStr = '';
      
      const { user_id } = req.body;
      if (user_id) {
        // A) Obtener el rol del usuario
        const { data: profile } = await supabase.from('profiles').select('role_id').eq('id', user_id).single();
        if (profile && profile.role_id) {
          const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).single();
          if (roleData) {
            roleName = roleData.name;
            // B) Buscar el System Prompt para este Rol
            const { data: promptData } = await supabase.from('ai_system_prompts').select('prompt_text').eq('role_name', roleName).single();
            if (promptData && promptData.prompt_text) {
              rolePrompt = promptData.prompt_text;
            }
          }
        }
        // C) Obtener la Memoria específica del usuario
        const { data: memData } = await supabase.from('ai_user_memory').select('memory_key, memory_value').eq('employee_id', user_id);
        if (memData && memData.length > 0) {
          userMemoryStr = 'Memoria del Usuario:\n' + memData.map(m => `- ${m.memory_key}: ${m.memory_value}`).join('\n');
        }
      }

      // 4. Prompt del sistema combinando personalidad, memoria y contexto RAG
      const stableSystemText = `${rolePrompt}
Tu rol es asistir a los líderes y empleados de la empresa respondiendo de forma inteligente, analítica y fluida a sus consultas.

REGLAS DE ORO:
1. Responde de forma natural, inteligente y fluida. No suenes robótico.
2. NUNCA digas qué proveedor de IA te desarrolló. Tú eres NOVA WORK.
3. Basa tus respuestas principalmente en el contexto proporcionado. Si no sabes algo, sugieres consultar con el área encargada.
4. Puedes formatear tu respuesta con negritas y listas para hacerla fácil de leer.

${userMemoryStr}`;

      const volatileContextText = contextText
        ? `Información recuperada de la Memoria Vectorial Corporativa relacionada con la consulta:\n${contextText}`
        : 'No se encontraron datos corporativos específicos en la memoria para esta consulta.';

      // 5. Construir el historial de conversación
      const pastMessages = history.filter((m) => !m.text.includes('Soy el Oráculo de NOVA WORK'));
      const messages = pastMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      messages.push({ role: 'user', content: query });

      // 6. Generar respuesta con Claude
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: [
          { type: 'text', text: stableSystemText, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: volatileContextText },
        ],
        messages,
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      return res.status(200).json({
        response: textBlock?.text ?? ''
      });
    }

    return res.status(400).json({ error: 'Invalid action specified.' });
  } catch (error) {
    console.error('Error in memory API:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
