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
    console.log('RAW BODY:', req.body);

    const sub = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    console.log('PARSED SUB:', sub);

    if (!sub || !sub.user_id) {
      return res.status(400).json({ error: 'Missing subscription or user_id' });
    }

    const { error } = await sb
      .from('push_subscriptions')
      .upsert({
        user_id: sub.user_id,
        subscription: JSON.stringify(sub)
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('SUPABASE ERROR:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('SERVER ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
}
