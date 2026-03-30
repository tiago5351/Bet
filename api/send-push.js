import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

webpush.setVapidDetails(
  'mailto:tiagoblatter@gmail.com',
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') {
  return res.status(200).end();
}
  try {
    const { data, error } = await sb
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;

    const payload = JSON.stringify({
      title: 'Test push 🚀',
      body: 'Funciona!'
    });

    for (const row of data) {
      const sub = JSON.parse(row.subscription);

      await webpush.sendNotification(sub, payload);
    }

    res.status(200).json({ ok: true });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
