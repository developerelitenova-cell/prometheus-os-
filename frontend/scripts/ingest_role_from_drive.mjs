// Formaliza el proceso manual usado para cargar los roles de Gestión Humana:
// toma texto ya extraído de documentos (Drive, manuales, etc.), lo envía al
// motor real de extracción (/api/extract-workflow, el mismo que usa MapperView.vue)
// y guarda el resultado estructurado en role_workflows.
//
// Uso:
//   node scripts/ingest_role_from_drive.mjs <roleId> <archivo-de-texto>
//   node scripts/ingest_role_from_drive.mjs <roleId> -   (lee el texto de stdin)
//
// Requiere las variables VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno
// (ejecutar con --env-file=.env.local desde la carpeta frontend/).

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const API_BASE = process.env.PROMETHEUS_API_BASE || 'https://prometheus-os-inky.vercel.app';

const [, , roleId, filePathArg] = process.argv;

if (!roleId || !filePathArg) {
  console.error('Uso: node ingest_role_from_drive.mjs <roleId> <archivo-de-texto|->');
  process.exit(1);
}

const sourceText = filePathArg === '-'
  ? fs.readFileSync(0, 'utf-8')
  : fs.readFileSync(filePathArg, 'utf-8');

if (!sourceText.trim()) {
  console.error('El texto fuente está vacío.');
  process.exit(1);
}

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log(`Extrayendo flujo de trabajo para el rol ${roleId}...`);

  const response = await fetch(`${API_BASE}/api/extract-workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roleId, sourceText }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status} al extraer el flujo`);
  }

  const { workflow } = data;
  console.log('Extraído:', {
    tasks: workflow.tasks.length,
    inputs: workflow.inputs.length,
    outputs: workflow.outputs.length,
    tools_used: workflow.tools_used.length,
    bottlenecks: workflow.bottlenecks.length,
    kpis: workflow.kpis.length,
  });

  const { data: existing } = await supabase
    .from('role_workflows')
    .select('id')
    .eq('role_id', roleId)
    .maybeSingle();

  const record = {
    role_id: roleId,
    ...workflow,
    raw_transcript: sourceText,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase.from('role_workflows').update(record).eq('id', existing.id);
    if (error) throw error;
    console.log('role_workflows actualizado.');
  } else {
    const { error } = await supabase.from('role_workflows').insert([record]);
    if (error) throw error;
    console.log('role_workflows creado.');
  }
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
