import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    const { user_id, title, reminder_at } = body;

    if (!user_id || !reminder_at) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const { error } = await sb.from('bets').insert({
      user_id,
      title,
      reminder_at
    }, {
      onConflict: 'user_id, reminder_at'
    });

    if (error) throw error;

    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
