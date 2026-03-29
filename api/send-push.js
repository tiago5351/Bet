import webpush from 'web-push';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;

webpush.setVapidDetails(
  'mailto:tu@email.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

// ⚠️ esto en prod debería venir de DB
let subscriptions = [];

export default async function handler(req, res) {
  const {title, body} = req.body;

  const payload = JSON.stringify({title, body});

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
    } catch(e) {
      console.error('Push error:', e);
    }
  }

  res.status(200).json({ok:true});
}
