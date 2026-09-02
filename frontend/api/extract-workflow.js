import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

// Instrucciones fijas del extractor: idénticas para cualquier rol, así que se cachean
// (cache_control) para reutilizarse entre mapeos de distintos roles.
const SYSTEM_INSTRUCTIONS = `Eres el Motor de Mapeo de Flujos de PROMETHEUS OS. Tu tarea es leer la transcripción de una entrevista o los documentos operativos de un cargo, y extraer de ahí una estructura de flujo de trabajo (workflow) real y precisa.

Vas a recibir en el mensaje del usuario el texto fuente (transcripción de entrevista, manuales de cargo, procesos documentados, etc.) para un cargo específico.

REGLAS DE ORO:
1. Extrae ÚNICAMENTE información que esté explícita o claramente implícita en el texto fuente. NUNCA inventes tareas, herramientas o KPIs que no estén respaldados por el texto.
2. Si el texto no menciona nada para una categoría (por ejemplo, no hay KPIs mencionados), devuelve un arreglo vacío para esa categoría en vez de inventar contenido.
3. Cada elemento de cada lista debe ser una frase corta, concreta y accionable (no párrafos largos).
4. "tasks" son las responsabilidades y actividades que ejecuta la persona en el cargo.
5. "inputs" son la información, documentos o insumos que la persona necesita recibir de otras áreas para trabajar.
6. "outputs" son los entregables, reportes o resultados que la persona produce para otros.
7. "tools_used" son software, plataformas, aplicaciones o equipos mencionados explícitamente.
8. "bottlenecks" son cuellos de botella, ineficiencias, riesgos u oportunidades de mejora mencionados.
9. "kpis" son indicadores de desempeño o metas mencionados explícitamente, con su meta si se menciona.
10. "unmet_needs" son carencias operativas, herramientas que faltan o procesos manuales que el empleado reporta como ausentes (ej. "no tengo una herramienta que me avise"). Extrae estas ausencias operativas aquí.
11. Responde EXCLUSIVAMENTE en JSON válido, sin texto adicional ni bloques de código, con este esquema exacto:
{
  "tasks": [string],
  "inputs": [string],
  "outputs": [string],
  "tools_used": [string],
  "bottlenecks": [string],
  "kpis": [string],
  "unmet_needs": [string]
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { roleId, sourceText } = req.body || {};

  if (!roleId || !sourceText || !sourceText.trim()) {
    return res.status(400).json({ error: 'roleId y sourceText son requeridos' });
  }
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'La conexión a Supabase no está configurada en el servidor.' });
  }
  if (!anthropicApiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no está configurada en el servidor.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  try {
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name, areas(name)')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    const userPrompt = `Cargo: ${role.name}
Área: ${role.areas?.name || 'General'}

TEXTO FUENTE:
${sourceText}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: [
        { type: 'text', text: SYSTEM_INSTRUCTIONS, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');

    // Claude a veces envuelve el JSON en un bloque de código markdown pese a la
    // instrucción de no hacerlo; se le quita esa envoltura antes de parsear.
    let rawText = (textBlock?.text ?? '').trim();
    const fenceMatch = rawText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fenceMatch) {
      rawText = fenceMatch[1];
    }

    let extracted;
    try {
      extracted = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Respuesta del Motor de Mapeo no es JSON válido:', textBlock?.text);
      return res.status(502).json({ error: 'El Motor de Mapeo devolvió una respuesta no válida.' });
    }

    const asStringArray = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

    const workflow = {
      tasks: asStringArray(extracted.tasks),
      inputs: asStringArray(extracted.inputs),
      outputs: asStringArray(extracted.outputs),
      tools_used: asStringArray(extracted.tools_used),
      bottlenecks: asStringArray(extracted.bottlenecks),
      kpis: asStringArray(extracted.kpis),
      unmet_needs: asStringArray(extracted.unmet_needs),
    };

    return res.status(200).json({ workflow });
  } catch (error) {
    console.error('Error in extract-workflow:', error);
    return res.status(500).json({ error: error.message || 'Error extrayendo el flujo de trabajo' });
  }
}
