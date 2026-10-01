import { supabase } from './supabase.js';

/**
 * Normaliza y extrae número flotante de strings con $, %, puntos y comas.
 */
function parseNumericValue(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = String(val)
    .replace(/[^\d.,]/g, '')
    .replace(/\.(?=\d{3}(?:[.,]|$))/g, '') // quita separadores de miles
    .replace(',', '.');
  const num = parseFloat(clean);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Motor heurístico inteligente de extracción y cálculo de KPIs cuando
 * el LLM externo no está disponible o para validación offline instantánea.
 */
export function evaluateKpiWithHeuristics(metrics, text) {
  const lowerText = text.toLowerCase();
  const results = [];

  for (const m of metrics) {
    const mName = m.name.toLowerCase();
    const metaNum = parseNumericValue(m.meta_label);
    let realizadoRaw = '';
    let percentage = null;
    let note = '';

    // Palabras clave asociadas a la métrica
    const keywords = mName.split(/\s+/).filter(w => w.length > 3);
    
    // Buscar si alguna palabra clave está en el texto
    const isMentioned = keywords.some(k => lowerText.includes(k));

    if (m.meta_type === 'currency' || m.meta_label.includes('$')) {
      // Buscar patrones de moneda: $XX.XXX.XXX o XX millones / XX mil
      const moneyMatch = text.match(/\$\s?[\d.,]+(?:\s*(?:millones|millón|mil))?/i) ||
                         text.match(/(\d+(?:[.,]\d+)?)\s*(?:millones|millón)/i);
      if (moneyMatch) {
        realizadoRaw = moneyMatch[0];
        let val = parseNumericValue(moneyMatch[1] || moneyMatch[0]);
        if (/mill[oó]n/i.test(moneyMatch[0])) val = val * 1000000;
        else if (/mil/i.test(moneyMatch[0]) && val < 1000) val = val * 1000;
        
        if (metaNum > 0) {
          percentage = Math.min(150, Math.round((val / metaNum) * 100));
        }
      }
    } else if (m.meta_type === 'percentage' || m.meta_label.includes('%')) {
      const pctMatch = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
      if (pctMatch) {
        realizadoRaw = pctMatch[0];
        const val = parseFloat(pctMatch[1]);
        if (metaNum > 0) {
          percentage = Math.min(150, Math.round((val / metaNum) * 100));
        } else {
          percentage = Math.round(val);
        }
      }
    } else if (m.meta_label.includes('min') || m.meta_label.includes('seg') || m.meta_label.includes('hora')) {
      const timeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:min|minuto|seg|segundo|h|hora)/i);
      if (timeMatch) {
        realizadoRaw = timeMatch[0];
        const val = parseFloat(timeMatch[1]);
        // Menos tiempo es mejor si es tiempo de respuesta
        if (metaNum > 0) {
          percentage = val <= metaNum ? 100 : Math.max(30, Math.round((metaNum / val) * 100));
        }
      }
    }

    // Si la meta es 0 (ej: cero reclamos, cero errores)
    if (metaNum === 0 && (mName.includes('error') || mName.includes('reclamo') || mName.includes('diferencia') || mName.includes('novedad'))) {
      if (lowerText.includes('cero') || lowerText.includes('ningún') || lowerText.includes('ningun') || lowerText.includes('0 queja') || lowerText.includes('0 reclamo') || lowerText.includes('sin reclamos') || lowerText.includes('sin errores')) {
        realizadoRaw = '0';
        percentage = 100;
        note = 'Excelente: Cero incidencias reportadas en el periodo.';
      } else {
        const errorMatch = text.match(/(\d+)\s*(?:reclamo|error|queja|diferencia|novedad)/i);
        if (errorMatch) {
          const count = parseInt(errorMatch[1], 10);
          realizadoRaw = `${count}`;
          percentage = Math.max(0, 100 - (count * 20));
          note = `Se registraron ${count} incidencia(s), impactando el resultado.`;
        }
      }
    }

    // Default si no se extrajo directamente
    if (percentage === null) {
      if (isMentioned) {
        realizadoRaw = 'Reportado en corte';
        percentage = 95;
        note = 'Mencionado en reporte con desempeño positivo.';
      } else {
        realizadoRaw = m.meta_label; // asumimos cumplimiento estándar si no hay novedad
        percentage = 100;
        note = 'Cumplimiento según estándar regular del área.';
      }
    } else if (!note) {
      note = percentage >= 90 ? 'Meta alcanzada satisfactoriamente.' : 'Por debajo de la meta esperada. Revisar plan de acción.';
    }

    const estado = percentage >= 90 ? 'cumpliendo' : 'revisar';

    results.push({
      metric_id: m.id,
      name: m.name,
      meta_label: m.meta_label,
      realizado_raw: realizadoRaw,
      percentage: Math.max(0, percentage),
      estado: estado,
      notes: note
    });
  }

  const avg = Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / (results.length || 1));
  const summary = avg >= 90
    ? `Desempeño sobresaliente (${avg}%). El colaborador superó o alcanzó las metas operativas prioritarias del periodo.`
    : `Desempeño en observación (${avg}%). Se identifican desviaciones puntuales que requieren retroalimentación en el 1 a 1.`;

  return {
    results,
    average: avg,
    summary
  };
}

/**
 * Califica mediciones utilizando el modelo de IA de Anthropic / Backend,
 * con fallback instantáneo al motor heurístico.
 */
export async function evaluateMeasurementsWithAi({ roleName, areaName, periodLabel, metrics, performanceText }) {
  const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

  // 1. Intentar llamar al backend / endpoint de IA
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const res = await fetch(`${apiUrl}/api/v1/evaluate-kpis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        role_name: roleName,
        area_name: areaName,
        period_label: periodLabel,
        metrics: metrics.map(m => ({ id: m.id, name: m.name, meta_label: m.meta_label, meta_type: m.meta_type })),
        performance_text: performanceText
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('API de IA no disponible o con timeout, usando motor analítico local:', err);
  }

  // 2. Fallback resiliente automático
  return evaluateKpiWithHeuristics(metrics, performanceText);
}

/**
 * Genera KPIs a medida para un cargo consultando su workflow de procesos en Supabase
 */
export async function generateRoleSpecificKpis(roleId, roleName, areaName) {
  // 1. Obtener el workflow mapeado del cargo
  const { data: workflow } = await supabase
    .from('role_workflows')
    .select('*')
    .eq('role_id', roleId)
    .maybeSingle();

  // Si el workflow ya tiene KPIs definidos por el analista
  if (workflow?.kpis && Array.isArray(workflow.kpis) && workflow.kpis.length > 0) {
    const parsed = [];
    workflow.kpis.forEach((kpiStr, idx) => {
      // Extrae "Nombre: Meta" si existe
      const parts = kpiStr.split(':');
      const name = parts[0]?.trim() || `KPI ${idx + 1}`;
      const meta = parts[1]?.trim() || '100%';
      let type = 'percentage';
      if (meta.includes('$')) type = 'currency';
      else if (meta.includes('#') || /^\d+$/.test(meta)) type = 'count';
      parsed.push({
        name,
        meta_label: meta,
        meta_type: type
      });
    });
    if (parsed.length > 0) return parsed;
  }

  // Si no hay KPIs en el workflow, inferir de las tareas y cuellos de botella
  const tasks = workflow?.tasks || [];
  const bottlenecks = workflow?.bottlenecks || [];

  const candidates = [
    {
      name: `Cumplimiento de tareas prioritarias de ${roleName}`,
      meta_label: '95%',
      meta_type: 'percentage'
    },
    {
      name: 'Tiempo de ciclo y entrega de reportes operativos',
      meta_label: '100%',
      meta_type: 'percentage'
    },
    {
      name: 'Novedades críticas o reprocesos reportados en el periodo',
      meta_label: '0',
      meta_type: 'count'
    }
  ];

  if (tasks.length > 0) {
    candidates[0].name = `Eficacia en: ${tasks[0].slice(0, 45)}...`;
  }
  if (bottlenecks.length > 0) {
    candidates[2].name = `Control de cuello de botella: ${bottlenecks[0].slice(0, 45)}...`;
  }

  return candidates;
}
