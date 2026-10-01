import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase no configurado en el servidor' });
  }

  if (req.method === 'GET') {
    const userId = req.query.user_id;
    if (!userId) {
      return res.status(400).json({ error: 'user_id es requerido' });
    }

    // 1. Buscar en profiles
    try {
      const { data: prof } = await supabase.from('profiles').select('verification_photo, avatar_url').eq('id', userId).single();
      if (prof && (prof.verification_photo || prof.avatar_url)) {
        return res.status(200).json({ status: 'success', photo: prof.verification_photo || prof.avatar_url });
      }
    } catch (e) {
      // Ignorar si la columna no existe
    }

    // 2. Buscar en ai_user_memory
    try {
      const { data: mem } = await supabase.from('ai_user_memory').select('memory_value').eq('employee_id', userId).eq('memory_key', 'verification_photo').single();
      if (mem && mem.memory_value) {
        return res.status(200).json({ status: 'success', photo: mem.memory_value });
      }
    } catch (e) {}

    // 3. Buscar en corporate_memory
    try {
      const { data: cm } = await supabase.from('corporate_memory').select('metadata').eq('content', `verification_photo:${userId}`).single();
      if (cm && cm.metadata && cm.metadata.photo) {
        return res.status(200).json({ status: 'success', photo: cm.metadata.photo });
      }
    } catch (e) {}

    return res.status(200).json({ status: 'not_found', photo: null });
  }

  if (req.method === 'POST') {
    const { user_id, photo } = req.body || {};
    if (!user_id || !photo) {
      return res.status(400).json({ error: 'user_id y photo son requeridos' });
    }

    // 1. Guardar en ai_user_memory (SQL asegurado)
    try {
      await supabase.from('ai_user_memory').upsert({
        employee_id: user_id,
        memory_key: 'verification_photo',
        memory_value: photo
      });
    } catch (e) {
      console.warn('Error en ai_user_memory:', e);
    }

    // 2. Guardar en corporate_memory (SQL asegurado)
    try {
      await supabase.from('corporate_memory').upsert({
        content: `verification_photo:${user_id}`,
        metadata: {
          type: 'verification_photo',
          user_id: user_id,
          photo: photo,
          verified_at: new Date().toISOString()
        }
      });
    } catch (e) {
      console.warn('Error en corporate_memory:', e);
    }

    // 3. Guardar en profiles (welcome_seen + verification_photo si existe)
    try {
      const { error: fullErr } = await supabase.from('profiles').update({
        verification_photo: photo,
        avatar_url: photo,
        welcome_seen: true
      }).eq('id', user_id);

      if (fullErr) {
        // Fallback si verification_photo aún no es columna de profiles
        await supabase.from('profiles').update({ welcome_seen: true }).eq('id', user_id);
      }
    } catch (e) {
      try {
        await supabase.from('profiles').update({ welcome_seen: true }).eq('id', user_id);
      } catch (e2) {}
    }

    return res.status(200).json({ status: 'success', user_id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
