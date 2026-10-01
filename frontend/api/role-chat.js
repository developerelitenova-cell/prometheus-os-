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

    // 0.1 Guardar el mensaje del usuario en el historial
    await supabase.from('chat_history').insert({
      role_id: roleId,
      sender: 'user',
      message: message
    });

    // 0.2 Cargar los contactos de soporte
    const { data: contacts } = await supabase
      .from('support_contacts')
      .select('name, role, area, phone');
    
    let contactsText = '';
    if (contacts && contacts.length > 0) {
      contactsText = contacts.filter(c => c.phone && c.phone.toLowerCase() !== 'no tiene').map(c => {
        let phone = c.phone.replace(/\D/g, '');
        // Si tiene 10 digitos y empieza por 3, asume Colombia (+57)
        if (phone.length === 10 && phone.startsWith('3')) {
          phone = '57' + phone;
        }
        return `- ${c.name} (${c.role} - Área: ${c.area}): https://wa.me/${phone}`;
      }).join('\n');
    }

    // 1. Convertir la pregunta en Vector usando Voyage AI
    const embedding = await embedText(message, 'query');

    // 2. Buscar en Supabase (match_corporate_memory) filtrando por cercanía.
    const { data: candidates, error: searchError } = await supabase.rpc('match_corporate_memory', {
      query_embedding: embedding,
      match_threshold: 0.30,
      match_count: 20
    });

    if (searchError) {
      throw searchError;
    }

    // 2b. Filtrado RBAC
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
    const stableSystemText = `Eres NOVA WORK, el Asistente de Inteligencia Artificial Exclusivo para el cargo de: "${role.name}".
Tu objetivo es ayudar a este empleado a realizar su trabajo de la manera más eficiente posible.

A continuación, se presenta la descripción de sus responsabilidades o flujos de trabajo principales:
${roleContext ? roleContext : 'No hay descripción manual asignada.'}

REGLAS DE ORO:
1. Responde de manera profesional, directa y orientada a la acción.
2. Si la pregunta del empleado no tiene relación con sus responsabilidades o la información corporativa proporcionada, indícale amablemente que tu función es asistirle específicamente en su rol de "${role.name}".
3. NUNCA menciones qué proveedor de IA te desarrolló. Eres el Asistente Nova Work de Elite Nutrition.
4. DIRECTORIO DE SOPORTE CORPORATIVO:
Si el empleado reporta un problema técnico, pérdida de contraseña, daño de equipos, necesidad logística o administrativa que requiera asistencia humana directa, DEBES proporcionarle el enlace de WhatsApp de la persona o departamento correcto basándote EXCLUSIVAMENTE en este directorio:
${contactsText || 'No hay contactos disponibles.'}
Formato de respuesta cuando requiera soporte: "Entiendo tu problema. Te recomiendo contactar a [Nombre/Rol] para que te ayude con esto: [Enlace de WhatsApp]"`;

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
    const aiReply = textBlock?.text ?? '';

    // 4.1 Guardar la respuesta de la IA en el historial
    if (aiReply) {
      await supabase.from('chat_history').insert({
        role_id: roleId,
        sender: 'ai',
        message: aiReply
      });
    }

    return res.status(200).json({ reply: aiReply });
  } catch (error) {
    console.error('Error in role-chat:', error);
    return res.status(500).json({ error: error.message || 'Error processing role request' });
  }
}
