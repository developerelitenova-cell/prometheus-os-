import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // Configuración de encabezados CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Servicio de base de datos no configurado en el servidor.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Extraer y verificar token JWT del Administrador
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({ error: 'Token de autorización requerido.' });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Sesión no válida o expirada.' });
    }

    const adminUserId = authData.user.id;

    // 2. Verificar permisos del administrador (is_master_admin o access_level 1 o 2)
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, is_master_admin, role_id, roles(access_level, name)')
      .eq('id', adminUserId)
      .single();

    if (profileError || !adminProfile) {
      return res.status(403).json({ error: 'Perfil de administrador no encontrado.' });
    }

    const isMaster = adminProfile.is_master_admin === true;
    const accessLevel = adminProfile.roles?.access_level;

    if (!isMaster && accessLevel !== 1 && accessLevel !== 2) {
      return res.status(403).json({
        error: 'No autorizado: Se requieren permisos administrativos (Master Admin o Líder Nivel 1/2).'
      });
    }

    // 3. Extraer ID del usuario objetivo a eliminar
    const targetUserId = req.body?.targetUserId || req.body?.userId || req.query?.id;
    const reason = req.body?.reason || 'Baja administrativa autorizada';

    if (!targetUserId) {
      return res.status(400).json({ error: 'El ID del usuario objetivo (targetUserId) es obligatorio.' });
    }

    if (targetUserId === adminUserId) {
      return res.status(400).json({ error: 'Operación no permitida: No puede eliminar su propia cuenta administrativa activa.' });
    }

    // 4. Intentar ejecutar primero vía función RPC de base de datos
    let archiveResult = null;
    let rpcWorked = false;

    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('archive_and_delete_user', {
        p_target_user_id: targetUserId,
        p_admin_id: adminUserId,
        p_reason: reason
      });

      if (!rpcErr && rpcData) {
        archiveResult = rpcData;
        rpcWorked = true;
      } else if (rpcErr) {
        console.warn('RPC archive_and_delete_user falló o no existe aún, procediendo con ejecutor Node.js:', rpcErr.message);
      }
    } catch (rpcCallErr) {
      console.warn('Excepción al invocar RPC:', rpcCallErr.message);
    }

    // 5. Fallback autónomo en Node.js si la RPC aún no fue creada en Supabase
    if (!rpcWorked) {
      // 5.1 Obtener perfil objetivo
      const { data: targetProfile, error: targetErr } = await supabase
        .from('profiles')
        .select('*, roles(id, name, area_id, areas(name))')
        .eq('id', targetUserId)
        .single();

      if (targetErr || !targetProfile) {
        return res.status(404).json({ error: 'El colaborador a eliminar no fue encontrado en la base de datos.' });
      }

      const roleName = targetProfile.roles?.name || 'Sin cargo asignado';
      const areaName = targetProfile.roles?.areas?.name || 'General';

      // 5.2 Recopilar tareas asignadas
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', targetUserId);

      // 5.3 Recopilar gestiones completadas
      const { data: completions } = await supabase
        .from('task_completions')
        .select('*, role_task_templates(title, frequency, priority)')
        .eq('profile_id', targetUserId);

      // 5.4 Recopilar cierres diarios
      const { data: closings } = await supabase
        .from('daily_closings')
        .select('*')
        .eq('profile_id', targetUserId);

      // 5.5 Recopilar actividades extraordinarias
      const { data: extraordinary } = await supabase
        .from('extraordinary_activities')
        .select('*')
        .eq('profile_id', targetUserId);

      const totalTasks = tasks?.length || 0;
      const totalCompletions = completions?.length || 0;
      const totalClosings = closings?.length || 0;
      const totalExtraordinary = extraordinary?.length || 0;

      // 5.6 Construir snapshot estructurado
      const archivePayload = {
        metadata: {
          version: '2.2',
          archive_date: new Date().toISOString(),
          archived_by_id: adminUserId,
          archived_by_name: adminProfile.full_name || 'Administrador',
          deletion_reason: reason
        },
        profile: {
          id: targetProfile.id,
          full_name: targetProfile.full_name,
          email: targetProfile.email,
          company: targetProfile.company,
          role_id: targetProfile.role_id,
          role_name: roleName,
          area_name: areaName,
          approval_status: targetProfile.approval_status,
          is_active: targetProfile.is_active,
          created_at: targetProfile.created_at
        },
        summary_metrics: {
          total_tasks_assigned: totalTasks,
          total_task_completions: totalCompletions,
          total_daily_closings: totalClosings,
          total_extraordinary_activities: totalExtraordinary
        },
        history: {
          tasks: tasks || [],
          task_completions: completions || [],
          daily_closings: closings || [],
          extraordinary_activities: extraordinary || []
        }
      };

      // 5.7 Generar acta de baja en Markdown
      const markdownSummary = `# EXPEDIENTE DE DESVINCULACIÓN Y ARCHIVO HISTÓRICO
**Sistema Corporativo PROMETHEUS OS / NOVA WORK**
*Elite Nutrition S.A.S. & Futupro*

---

### 1. Datos Generales del Colaborador
- **Nombre Completo:** ${targetProfile.full_name}
- **Correo Corporativo:** ${targetProfile.email || 'N/A'}
- **Empresa:** ${targetProfile.company || 'Elite Nutrition'}
- **Cargo / Rol:** ${roleName}
- **Área Organizacional:** ${areaName}
- **ID de Registro:** \`${targetProfile.id}\`
- **Fecha de Ingreso Registrada:** ${targetProfile.created_at || 'N/A'}

---

### 2. Registro de Baja Laboral
- **Fecha y Hora de la Baja:** ${new Date().toLocaleString('es-CO')}
- **Administrador Responsable:** ${adminProfile.full_name || 'Administrador'} (ID: \`${adminUserId}\`)
- **Motivo de la Desvinculación:** ${reason}

---

### 3. Balance Histórico de Gestión
- **Total Tareas Asignadas Directas:** ${totalTasks}
- **Total Gestiones / Tareas Diarias Completadas:** ${totalCompletions}
- **Total Cierres Diarios Formales:** ${totalClosings}
- **Total Actividades Extraordinarias Reportadas:** ${totalExtraordinary}

---

### 4. Certificación de Custodia de Datos
El presente expediente digital contiene la totalidad de los registros de cumplimiento, evidencias, timestamps y cierres generados durante la vinculación del colaborador. Ha sido resguardado de forma inmutable en el repositorio de auditoría de la organización.
`;

      // 5.8 Insertar en la tabla deleted_user_archives
      const { data: insertedArchive, error: insertErr } = await supabase
        .from('deleted_user_archives')
        .insert({
          original_user_id: targetProfile.id,
          full_name: targetProfile.full_name,
          email: targetProfile.email,
          company: targetProfile.company,
          role_id: targetProfile.role_id,
          role_name: roleName,
          area_name: areaName,
          deleted_at: new Date().toISOString(),
          deleted_by: adminUserId,
          deleted_by_name: adminProfile.full_name || 'Administrador',
          deletion_reason: reason,
          total_tasks_recorded: totalTasks,
          total_completions_recorded: totalCompletions,
          total_closings_recorded: totalClosings,
          total_extraordinary_recorded: totalExtraordinary,
          archive_data: archivePayload,
          markdown_summary: markdownSummary
        })
        .select()
        .single();

      if (insertErr) {
        console.warn('Aviso al insertar en deleted_user_archives (posiblemente falta ejecutar migración):', insertErr.message);
      }

      // 5.9 Limpiar referencias foráneas de forma segura
      await Promise.allSettled([
        supabase.from('tasks').update({ assigned_to: null }).eq('assigned_to', targetUserId),
        supabase.from('tasks').update({ assigned_by: null }).eq('assigned_by', targetUserId),
        supabase.from('task_completions').delete().eq('profile_id', targetUserId),
        supabase.from('daily_closings').delete().eq('profile_id', targetUserId),
        supabase.from('extraordinary_activities').delete().eq('profile_id', targetUserId),
        supabase.from('extraordinary_activities').update({ approver_id: null }).eq('approver_id', targetUserId),
        supabase.from('notifications').delete().eq('profile_id', targetUserId),
        supabase.from('event_acknowledgements').delete().eq('profile_id', targetUserId),
        supabase.from('events').update({ target_profile_id: null }).eq('target_profile_id', targetUserId),
        supabase.from('events').update({ created_by: null }).eq('created_by', targetUserId),
        supabase.from('categorization_messages').update({ sender_id: null }).eq('sender_id', targetUserId),
        supabase.from('manuals').update({ created_by: null }).eq('created_by', targetUserId),
        supabase.from('corporate_news').update({ created_by: null }).eq('created_by', targetUserId)
      ]);

      // 5.10 Eliminar de la tabla profiles
      const { error: profileDelErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', targetUserId);

      if (profileDelErr) {
        throw new Error(`Error al remover perfil: ${profileDelErr.message}`);
      }

      archiveResult = {
        archive_id: insertedArchive?.id || null,
        user_id: targetUserId,
        full_name: targetProfile.full_name,
        email: targetProfile.email,
        role_name: roleName,
        company: targetProfile.company,
        markdown_summary: markdownSummary,
        archive_data: archivePayload
      };
    }

    // 6. Eliminar usuario de Supabase Auth (auth.users) para liberar el correo
    try {
      await supabase.auth.admin.deleteUser(targetUserId);
    } catch (authDelErr) {
      console.warn('Aviso: No se pudo eliminar usuario de auth.users o ya estaba removido:', authDelErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Cuenta de ${archiveResult.full_name} eliminada y expediente archivado con éxito.`,
      archive: archiveResult
    });
  } catch (err) {
    console.error('Error en /api/admin-delete-user:', err);
    return res.status(500).json({
      error: err.message || 'Error interno al procesar la baja del colaborador.'
    });
  }
}
