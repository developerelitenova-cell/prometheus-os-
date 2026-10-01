import Anthropic from '@anthropic-ai/sdk';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

const SYSTEM_INSTRUCTIONS = `Eres el Auditor de Rendimiento y Evaluación de KPIs de Elite Nutrition.
Tu tarea es analizar el reporte de desempeño o resumen provisto por el líder y contrastarlo contra las métricas esperadas para calcular el cumplimiento de forma justa, matemática y constructiva.

Para cada métrica en la lista:
1. Extrae el valor realizado del texto (realizado_raw), por ejemplo: "$18.500.000", "125 chats", "2.8 min", "0 errores". Si no se menciona explícitamente, infiérelo del tono general o usa el valor esperado.
2. Calcula el porcentaje matemático de cumplimiento (percentage: número entero entre 0 y 150) respecto a meta_label.
3. Asigna estado: "cumpliendo" si percentage >= 90, o "revisar" si percentage < 90.
4. Escribe una nota breve, objetiva y útil (notes) que sirva de retroalimentación para el colaborador.

Responde EXCLUSIVAMENTE en JSON válido con este formato:
{
  "results": [
    {
      "metric_id": "id_de_la_metrica",
      "realizado_raw": "valor_encontrado",
      "percentage": 95,
      "estado": "cumpliendo",
      "notes": "explicación objetiva"
    }
  ],
  "average": 95,
  "summary": "Resumen ejecutivo del corte y recomendación gerencial para el 1 a 1."
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { role_name, area_name, period_label, metrics, performance_text } = req.body || {};

  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
    return res.status(400).json({ error: 'Lista de métricas requerida' });
  }

  if (!performance_text || !performance_text.trim()) {
    return res.status(400).json({ error: 'Texto de desempeño requerido' });
  }

  if (!anthropicApiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada' });
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });
    const userPrompt = `Cargo: ${role_name || 'Desconocido'} (${area_name || 'General'})
Periodo / Corte: ${period_label || 'Semana'}
Métricas a evaluar:
${JSON.stringify(metrics, null, 2)}

Reporte semanal / Notas del líder:
"""
${performance_text}
"""`;

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: SYSTEM_INSTRUCTIONS,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock) throw new Error('No se recibió texto del modelo');

    let rawJson = textBlock.text.trim();
    if (rawJson.startsWith('```')) {
      const lines = rawJson.split('\n');
      if (lines[0].startsWith('```')) lines.shift();
      if (lines[lines.length - 1].startsWith('```')) lines.pop();
      rawJson = lines.join('\n').trim();
    }

    const data = JSON.parse(rawJson);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error evaluando KPIs con IA:', error);
    return res.status(500).json({ error: error.message || 'Error evaluando métricas' });
  }
}
