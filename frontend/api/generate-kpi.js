import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

// Instrucciones fijas del Motor Analítico: idénticas para los ~70 roles de la empresa,
// así que se marcan como cacheables (cache_control) para que Anthropic reutilice este
// bloque entre evaluaciones de distintos roles/periodos en vez de cobrarlo cada vez.
const SYSTEM_INSTRUCTIONS = `Eres el Motor Analítico de PROMETHEUS OS, encargado de generar evaluaciones de desempeño (Balanced Scorecard) objetivas para el Gemelo Digital Corporativo de Elite Nutrition.

Vas a recibir en el mensaje del usuario los datos reales de un cargo específico y el periodo a evaluar. Con base ÚNICAMENTE en esa información, genera la evaluación.

REGLAS DE ORO:
1. Si hay poca o ninguna información real (manual de cargo vacío, sin metas de KPI, sin tareas registradas), los puntajes deben ser conservadores (cercanos a 0-40) y "ai_evaluation_notes" debe decirlo explícitamente, indicando qué datos faltan para una evaluación confiable. NUNCA inventes logros que no estén respaldados por los datos proporcionados.
2. score_process debe reflejar el cumplimiento real de tareas (completadas vs total) y los cuellos de botella detectados.
3. score_financial, score_customer y score_growth deben inferirse de las metas de KPI y el manual de cargo cuando existan; si no hay evidencia, usa un puntaje bajo y explica por qué en las notas.
4. okr_details debe listar objetivos derivados de las metas de KPI o del manual de cargo (no inventados), con key_results concretos y su progreso estimado (0-100) según los datos.
5. Responde EXCLUSIVAMENTE en JSON válido, sin texto adicional ni bloques de código, con este esquema exacto:
{
  "score_financial": number (0-100),
  "score_customer": number (0-100),
  "score_process": number (0-100),
  "score_growth": number (0-100),
  "ai_evaluation_notes": string,
  "okr_details": [ { "objective": string, "key_results": [ { "text": string, "progress": number } ] } ]
}`;

// Vercel Serverless Function: genera una evaluación de KPIs (Balanced Scorecard)
// real para un rol, basada en su manual de cargo (role_workflows), sus metas
// (kpi_templates) y el cumplimiento real de tareas, y la persiste en role_kpis.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { roleId, period } = req.body || {};

  if (!roleId) {
    return res.status(400).json({ error: 'roleId es requerido' });
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'La conexión a Supabase no está configurada en el servidor.' });
  }
  if (!anthropicApiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no está configurada en el servidor.' });
  }

  const evaluationPeriod = period || new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  try {
    // 1. Datos del rol
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*, areas(name)')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // 2. Manual de cargo / flujo de trabajo mapeado
    const { data: workflow } = await supabase
      .from('role_workflows')
      .select('*')
      .eq('role_id', roleId)
      .limit(1)
      .maybeSingle();

    // 3. Metas de KPI definidas para el rol
    const { data: kpiTemplates } = await supabase
      .from('kpi_templates')
      .select('name, target_value, unit')
      .eq('role_id', roleId);

    // 4. Cumplimiento real de tareas de las personas que ocupan este rol
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role_id', roleId);

    let taskStats = { total: 0, completed: 0, in_progress: 0, pending: 0 };
    if (profiles && profiles.length > 0) {
      const profileIds = profiles.map((p) => p.id);
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .in('assigned_to', profileIds);

      if (tasks) {
        taskStats.total = tasks.length;
        taskStats.completed = tasks.filter((t) => t.status === 'completed').length;
        taskStats.in_progress = tasks.filter((t) => t.status === 'in_progress').length;
        taskStats.pending = tasks.filter((t) => t.status === 'pending').length;
      }
    }

    const hasGroundingData = !!workflow || (kpiTemplates && kpiTemplates.length > 0) || taskStats.total > 0;

    // 5. Construir contexto real para el modelo
    const contextParts = [
      `Cargo: ${role.name}`,
      `Área: ${role.areas?.name || 'General'}`,
      role.objective ? `Objetivo del cargo: ${role.objective}` : null,
      workflow
        ? `Tareas principales del manual de cargo: ${JSON.stringify(workflow.tasks || [])}
Inputs requeridos: ${JSON.stringify(workflow.inputs || [])}
Outputs entregables: ${JSON.stringify(workflow.outputs || [])}
Herramientas usadas: ${JSON.stringify(workflow.tools_used || [])}
Cuellos de botella detectados: ${JSON.stringify(workflow.bottlenecks || [])}
KPIs mencionados en el manual: ${JSON.stringify(workflow.kpis || [])}`
        : 'No hay manual de cargo mapeado todavía para este rol.',
      kpiTemplates && kpiTemplates.length > 0
        ? `Metas de KPI definidas: ${JSON.stringify(kpiTemplates)}`
        : 'No hay metas de KPI (kpi_templates) definidas para este rol.',
      `Cumplimiento real de tareas asignadas en el sistema: ${taskStats.completed} completadas, ${taskStats.in_progress} en progreso, ${taskStats.pending} pendientes, de ${taskStats.total} totales.`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const userPrompt = `Genera la evaluación de desempeño para el periodo "${evaluationPeriod}" del cargo "${role.name}".

DATOS REALES DEL ROL:
${contextParts}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
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

    let evaluation;
    try {
      evaluation = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Respuesta del Motor Analítico no es JSON válido:', textBlock?.text);
      return res.status(502).json({ error: 'El Motor Analítico devolvió una respuesta no válida.' });
    }

    const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));

    const record = {
      role_id: roleId,
      evaluation_period: evaluationPeriod,
      score_financial: clamp(evaluation.score_financial),
      score_customer: clamp(evaluation.score_customer),
      score_process: clamp(evaluation.score_process),
      score_growth: clamp(evaluation.score_growth),
      ai_evaluation_notes: evaluation.ai_evaluation_notes || (hasGroundingData ? '' : 'Sin datos suficientes para una evaluación confiable.'),
      okr_details: Array.isArray(evaluation.okr_details) ? evaluation.okr_details : [],
      manager_approved: false,
      updated_at: new Date().toISOString(),
    };

    // 6. Persistir: actualizar si ya existe una evaluación para este rol+periodo, si no, crear
    const { data: existing } = await supabase
      .from('role_kpis')
      .select('id')
      .eq('role_id', roleId)
      .eq('evaluation_period', evaluationPeriod)
      .maybeSingle();

    let saved;
    if (existing) {
      const { data, error } = await supabase
        .from('role_kpis')
        .update(record)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      saved = data;
    } else {
      const { data, error } = await supabase
        .from('role_kpis')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      saved = data;
    }

    return res.status(200).json({ evaluation: saved });
  } catch (error) {
    console.error('Error in generate-kpi:', error);
    return res.status(500).json({ error: error.message || 'Error generando la evaluación de KPIs' });
  }
}
