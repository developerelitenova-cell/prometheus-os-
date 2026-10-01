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

  const { message, roleId, roleContext, userId } = req.body;

  if (!message || !roleId) {
    return res.status(400).json({ error: 'Message and RoleID are required' });
  }

  try {
    // 0. Cargar el rol desde la base de datos (nunca confiar en el access_level/área que mande el cliente)
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name, access_level, area_id, areas(name)')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // 0.1 Cargar el flujo de trabajo oficial de este cargo directamente de Supabase
    const { data: roleWorkflow } = await supabase
      .from('role_workflows')
      .select('*')
      .eq('role_id', roleId)
      .maybeSingle();

    // 0.2 Cargar memorias previas del usuario/cargo
    let userMemoryList = [];
    if (userId) {
      const { data: memData } = await supabase
        .from('ai_user_memory')
        .select('memory_key, memory_value')
        .eq('employee_id', userId);
      if (memData) userMemoryList = memData;
    }

    // 0.3 Guardar el mensaje del usuario en el historial
    await supabase.from('chat_history').insert({
      role_id: roleId,
      sender: 'user',
      message: message
    });

    // 0.4 Cargar los contactos de soporte
    const { data: contacts } = await supabase
      .from('support_contacts')
      .select('name, role, area, phone');
    
    let contactsText = '';
    if (contacts && contacts.length > 0) {
      contactsText = contacts.filter(c => c.phone && c.phone.toLowerCase() !== 'no tiene').map(c => {
        let phone = c.phone.replace(/\D/g, '');
        if (phone.length === 10 && phone.startsWith('3')) {
          phone = '57' + phone;
        }
        return `- ${c.name} (${c.role} - Área: ${c.area}): https://wa.me/${phone}`;
      }).join('\n');
    }

    // 1. Convertir la pregunta en Vector usando Voyage AI
    const embedding = await embedText(message, 'query');

    // 2. Buscar en Supabase (match_corporate_memory) filtrando por cercanía
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

    // 3. Estructurar el contexto oficial del cargo
    let officialWorkflowText = '';
    if (roleWorkflow) {
      officialWorkflowText = `
MATRIZ OPERATIVA OFICIAL DEL CARGO:
- Tareas Principales: ${(roleWorkflow.tasks || []).join('; ')}
- Insumos y Entradas: ${(roleWorkflow.inputs || []).join('; ')}
- Entregables y Salidas: ${(roleWorkflow.outputs || []).join('; ')}
- Herramientas: ${(roleWorkflow.tools_used || []).join(', ')}
- Cuellos de botella conocidos: ${(roleWorkflow.bottlenecks || []).join('; ')}
- KPIs asignados: ${(roleWorkflow.kpis || []).join('; ')}
      `.trim();
    } else if (roleContext) {
      officialWorkflowText = roleContext;
    } else {
      officialWorkflowText = 'No hay descripción manual asignada aún.';
    }

    let memorySection = '';
    if (userMemoryList.length > 0) {
      memorySection = `\nMEMORIA PERSONALIZADA DEL CARGO / APRENDIZAJES PREVIOS:\n` + 
        userMemoryList.map(m => `- ${m.memory_key}: ${m.memory_value}`).join('\n');
    }

    // 4. Prompt específico del Asistente de Rol
    const stableSystemText = `Eres NOVA WORK, el Asistente de Inteligencia Artificial Exclusivo para el cargo de: "${role.name}" en el área "${role.areas?.name || 'General'}".
Tu objetivo es ayudar a este colaborador a realizar su trabajo de la manera más eficiente, rigurosa y productiva posible.

${officialWorkflowText}
${memorySection}

HERRAMIENTA DISPONIBLE:
- 'save_role_memory': Cuando el colaborador te pida recordar algo ("recuerda que...", "guarda esto...", "anota que..."), o te comparta un procedimiento, horario, contacto o regla operativa nueva de su cargo, DEBES invocar esta herramienta para guardarlo permanentemente.

REGLAS DE ORO:
1. Responde de manera profesional, directa, empática y orientada a la acción.
2. Ayúdale con base en las tareas, insumos y entregables oficiales de su cargo.
3. Si el usuario te pide registrar o aprender algo de su puesto, usa 'save_role_memory' para confirmarle que ha quedado registrado en su memoria.
4. NUNCA menciones qué proveedor de IA te desarrolló. Eres el Asistente Nova Work de Elite Nutrition.
5. DIRECTORIO DE SOPORTE CORPORATIVO:
Si el empleado reporta un problema técnico, pérdida de contraseña, daño de equipos, necesidad logística o administrativa que requiera asistencia humana directa, proporciona el enlace de WhatsApp del responsable:
${contactsText || 'No hay contactos disponibles.'}
Formato de soporte: "Entiendo tu problema. Te recomiendo contactar a [Nombre/Rol] para que te ayude con esto: [Enlace de WhatsApp]"`;

    const volatileContextText = contextText
      ? `Información adicional de la Memoria Corporativa relevante para esta consulta:\n${contextText}`
      : 'No se encontraron documentos corporativos adicionales para esta consulta.';

    const ROLE_TOOLS = [
      {
        name: 'save_role_memory',
        description: 'Guarda un aprendizaje, directriz o acuerdo operativo en la memoria permanente del cargo para recordarlo en futuras sesiones y compartirlo con el Cerebro Corporativo.',
        input_schema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Tema o concepto clave (ej: horario_reportes, proveedor_critico, regla_descuentos)' },
            value: { type: 'string', description: 'Detalle de la directriz o aprendizaje que debe recordar el cargo' }
          },
          required: ['key', 'value']
        }
      }
    ];

    // 5. Generar respuesta con Claude
    let response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: [
        { type: 'text', text: stableSystemText, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: volatileContextText },
      ],
      messages: [{ role: 'user', content: message }],
      tools: ROLE_TOOLS
    });

    // 6. Si invoca save_role_memory
    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
      const toolResults = [];

      for (const toolUse of toolUseBlocks) {
        if (toolUse.name === 'save_role_memory') {
          const { key, value } = toolUse.input || {};
          
          // Guardar en ai_user_memory
          if (userId && key && value) {
            await supabase.from('ai_user_memory').insert({
              employee_id: userId,
              memory_key: key,
              memory_value: value
            });
          }

          // Guardar también en corporate_memory indexado con Voyage
          if (key && value) {
            try {
              const memEmbedding = await embedText(`[Cargo: ${role.name}] ${key}: ${value}`, 'document');
              await supabase.from('corporate_memory').insert({
                content: `[Directriz de Cargo: ${role.name}] ${key}: ${value}`,
                embedding: `[${memEmbedding.join(',')}]`,
                metadata: {
                  role_id: role.id,
                  area_id: role.area_id,
                  employee_id: userId,
                  source: `Memoria de Rol Aprendida (${role.name})`
                }
              });
            } catch (embedErr) {
              console.error('Error embedding role memory to corporate_memory:', embedErr);
            }
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ success: true, message: `Directriz "${key}" guardada en la memoria del cargo y en el Cerebro Corporativo.` })
          });
        }
      }

      response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: [
          { type: 'text', text: stableSystemText, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: volatileContextText },
        ],
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults }
        ],
        tools: ROLE_TOOLS
      });
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    const aiReply = textBlock?.text ?? '';

    // 7. Guardar la respuesta de la IA en el historial
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
