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

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const now = new Date().toISOString();

    // 🔍 buscar bets que hay que notificar
    const { data: bets, error } = await sb
      .from('bets')
      .select('*')
      .lte('reminder_at', now)
      .eq('notified', false);

    if (error) throw error;

    for (const bet of bets) {
      // 🔍 buscar subscription del usuario
      const { data: subs } = await sb
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', bet.user_id);

      for (const row of subs || []) {
        const sub = JSON.parse(row.subscription);

        const payload = JSON.stringify({
          title: 'Recordatorio 📊',
          body: bet.title || 'Tenés una apuesta ahora'
        });

        try {
          await webpush.sendNotification(sub, payload);
        } catch (e) {
          console.error('Push error:', e);
        }
      }

      // ✅ marcar como enviada
      await sb
        .from('bets')
        .update({ notified: true })
        .eq('id', bet.id);
    }

    return res.status(200).json({ ok: true, sent: bets.length });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
