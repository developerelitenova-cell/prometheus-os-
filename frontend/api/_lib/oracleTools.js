// Herramientas de Auditoría e Inspección Empresarial en Tiempo Real para NOVA WORK
// Permiten al Oráculo consultar la base de datos de Supabase antes de responder al usuario.

export const ORACLE_TOOLS_DECLARATIONS = [
  {
    name: 'audit_corporate_knowledge',
    description: 'Ejecuta una auditoría integral en tiempo real sobre la base de datos de NOVA WORK. Devuelve estadísticas reales: total de roles, áreas, roles con flujos mapeados, manuales operativos, KPIs asignados, memorias indexadas y el porcentaje de cobertura global y por área.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_area_audit',
    description: 'Obtiene la auditoría detallada de un área específica de la empresa: lista de cargos pertenecientes al área y el estado de sus 4 dimensiones (mapeo de flujo, manual de funciones, KPIs y memoria IA).',
    input_schema: {
      type: 'object',
      properties: {
        area_name: {
          type: 'string',
          description: 'Nombre o parte del nombre del área (ej: Comercial, Contabilidad, Pentágono, Gestión Humana, Cadena de Abastecimiento, Tecnología, etc.)'
        }
      },
      required: ['area_name']
    }
  },
  {
    name: 'get_role_details',
    description: 'Consulta los datos reales de un cargo o rol específico: área a la que pertenece, nivel de acceso, objetivos, tareas mapeadas y KPIs configurados.',
    input_schema: {
      type: 'object',
      properties: {
        role_name: {
          type: 'string',
          description: 'Nombre del cargo o rol a consultar (ej: Gerente de Auditoria, Analista de Selección, Asesor Comercial, Líder de Seguridad, etc.)'
        }
      },
      required: ['role_name']
    }
  }
];

export async function executeOracleTool(toolName, toolInput, supabase) {
  if (!supabase) {
    return { error: 'Conexión a Supabase no disponible' };
  }

  try {
    if (toolName === 'audit_corporate_knowledge') {
      return await runAuditCorporateKnowledge(supabase);
    }
    if (toolName === 'get_area_audit') {
      return await runGetAreaAudit(toolInput.area_name, supabase);
    }
    if (toolName === 'get_role_details') {
      return await runGetRoleDetails(toolInput.role_name, supabase);
    }
    return { error: `Herramienta desconocida: ${toolName}` };
  } catch (err) {
    console.error(`Error ejecutando herramienta ${toolName}:`, err);
    return { error: err.message };
  }
}

async function runAuditCorporateKnowledge(supabase) {
  const [
    rolesRes,
    areasRes,
    workflowsRes,
    manualsRes,
    kpiTemplatesRes,
    kpiAssignmentsRes,
    memoryRes,
    taskTemplatesRes
  ] = await Promise.all([
    supabase.from('roles').select('id, name, area_id, access_level'),
    supabase.from('areas').select('id, name'),
    supabase.from('role_workflows').select('role_id, kpis'),
    supabase.from('manuals').select('role_id'),
    supabase.from('kpi_role_templates').select('role_id'),
    supabase.from('kpi_assignments').select('role_id'),
    supabase.from('corporate_memory').select('metadata'),
    supabase.from('role_task_templates').select('role_id').eq('active', true)
  ]);

  const mappedRoleIds = new Set((workflowsRes.data || []).map(w => w.role_id));
  const manualRoleIds = new Set((manualsRes.data || []).map(m => m.role_id));
  const kpiLinkedRoleIds = new Set([
    ...(kpiTemplatesRes.data || []).map(t => t.role_id),
    ...(kpiAssignmentsRes.data || []).map(t => t.role_id)
  ]);
  (workflowsRes.data || []).forEach(w => {
    if (w.kpis && Array.isArray(w.kpis) && w.kpis.length > 0) kpiLinkedRoleIds.add(w.role_id);
  });

  const memoryCountByRole = {};
  (memoryRes.data || []).forEach(m => {
    const rId = m.metadata?.role_id;
    if (rId) memoryCountByRole[rId] = (memoryCountByRole[rId] || 0) + 1;
  });
  (taskTemplatesRes.data || []).forEach(t => {
    if (t.role_id) memoryCountByRole[t.role_id] = (memoryCountByRole[t.role_id] || 0) + 1;
  });

  const roles = rolesRes.data || [];
  const areas = (areasRes.data || []).map(area => {
    const areaRoles = roles.filter(r => r.area_id === area.id);
    const dimensions = areaRoles.length * 4;
    const covered = areaRoles.reduce((sum, r) =>
      sum + (mappedRoleIds.has(r.id) ? 1 : 0) + (manualRoleIds.has(r.id) ? 1 : 0) + (kpiLinkedRoleIds.has(r.id) ? 1 : 0) + ((memoryCountByRole[r.id] || 0) > 0 ? 1 : 0), 0);
    return {
      name: area.name,
      total_roles: areaRoles.length,
      covered_dimensions: covered,
      coverage_pct: dimensions > 0 ? Math.round((covered / dimensions) * 100) : 0
    };
  }).filter(a => a.total_roles > 0).sort((a, b) => b.coverage_pct - a.coverage_pct);

  const totalRoles = roles.length;
  const totalMapped = mappedRoleIds.size;
  const totalManuals = manualRoleIds.size;
  const totalKpis = kpiLinkedRoleIds.size;
  const totalMemory = Object.keys(memoryCountByRole).length;
  const globalDimensions = totalRoles * 4;
  const globalCovered = totalMapped + totalManuals + totalKpis + totalMemory;
  const globalPct = globalDimensions > 0 ? Math.round((globalCovered / globalDimensions) * 100) : 0;

  // Roles prioritarios sin documentación alguna
  const unmappedRoles = roles.filter(r => 
    !mappedRoleIds.has(r.id) && !manualRoleIds.has(r.id) && !kpiLinkedRoleIds.has(r.id)
  ).slice(0, 8).map(r => r.name);

  return {
    total_roles: totalRoles,
    total_areas: areas.length,
    roles_with_mapped_workflows: totalMapped,
    roles_with_manuals: totalManuals,
    roles_with_kpis: totalKpis,
    roles_with_ai_memory: totalMemory,
    global_coverage_percentage: globalPct,
    coverage_by_area: areas,
    sample_roles_needing_documentation: unmappedRoles
  };
}

async function runGetAreaAudit(areaName, supabase) {
  const { data: areas } = await supabase
    .from('areas')
    .select('id, name')
    .ilike('name', `%${areaName}%`);

  if (!areas || areas.length === 0) {
    return { message: `No se encontró ningún área que coincida con "${areaName}".` };
  }

  const area = areas[0];
  const { data: roles } = await supabase
    .from('roles')
    .select('id, name, access_level')
    .eq('area_id', area.id);

  if (!roles || roles.length === 0) {
    return { area: area.name, roles: [], message: 'No hay roles registrados en esta área.' };
  }

  const roleIds = roles.map(r => r.id);
  const [workflowsRes, manualsRes, kpisRes] = await Promise.all([
    supabase.from('role_workflows').select('role_id').in('role_id', roleIds),
    supabase.from('manuals').select('role_id').in('role_id', roleIds),
    supabase.from('kpi_role_templates').select('role_id').in('role_id', roleIds)
  ]);

  const mappedSet = new Set((workflowsRes.data || []).map(w => w.role_id));
  const manualSet = new Set((manualsRes.data || []).map(m => m.role_id));
  const kpiSet = new Set((kpisRes.data || []).map(k => k.role_id));

  const detailedRoles = roles.map(r => ({
    name: r.name,
    nivel_acceso: r.access_level === 1 ? 'Nivel 1 (Directivo)' : r.access_level === 2 ? 'Nivel 2 (Liderazgo)' : 'Nivel 3 (Operativo)',
    tiene_flujo_mapeado: mappedSet.has(r.id),
    tiene_manual: manualSet.has(r.id),
    tiene_kpi: kpiSet.has(r.id)
  }));

  return {
    area: area.name,
    total_roles: roles.length,
    roles: detailedRoles
  };
}

async function runGetRoleDetails(roleName, supabase) {
  const { data: roles } = await supabase
    .from('roles')
    .select('id, name, area_id, access_level, objective, areas(name)')
    .ilike('name', `%${roleName}%`)
    .limit(1);

  if (!roles || roles.length === 0) {
    return { message: `No se encontró ningún cargo que coincida con "${roleName}".` };
  }

  const role = roles[0];
  const [workflowRes, kpiRes, usersRes] = await Promise.all([
    supabase.from('role_workflows').select('*').eq('role_id', role.id).maybeSingle(),
    supabase.from('kpi_role_templates').select('*').eq('role_id', role.id),
    supabase.from('profiles').select('full_name, approval_status').eq('role_id', role.id)
  ]);

  return {
    nombre: role.name,
    area: role.areas?.name || 'No asignada',
    nivel_acceso: role.access_level,
    objetivo: role.objective || 'Sin objetivo definido',
    flujo_mapeado: workflowRes.data ? {
      tareas: workflowRes.data.tasks || [],
      herramientas: workflowRes.data.tools || [],
      kpis: workflowRes.data.kpis || []
    } : 'No mapeado',
    indicadores_kpi: kpiRes.data || [],
    colaboradores_asignados: usersRes.data || []
  };
}
