import { createClient } from '@supabase/supabase-js';
import { embedText } from './_lib/voyage.js';

// Vercel Serverless Function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text, source, metadata } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided' });
    }

    if (!process.env.VOYAGE_API_KEY) {
      return res.status(500).json({ error: 'VOYAGE_API_KEY is not configured in Vercel.' });
    }

    // Initialize Supabase Client using server env vars
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    // La clave de servicio va primero: escribir en corporate_memory requiere saltar RLS
    // (no hay política que permita INSERT con la clave pública).
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials are not configured on server.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const embedding = await embedText(text, 'document');
    const vectorString = `[${embedding.join(',')}]`;

    // 2. Insert into Supabase corporate_memory
    const { data, error } = await supabase
      .from('corporate_memory')
      .insert([
        {
          content: text,
          metadata: { ...metadata, source: source || 'manual_upload' },
          embedding: vectorString,
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save memory to database' });
    }

    return res.status(200).json({
      success: true,
      message: 'Knowledge successfully ingested.',
      recordId: data[0].id
    });

  } catch (error) {
    console.error('Error in ingest API:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
