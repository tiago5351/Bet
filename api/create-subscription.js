const https = require('https');

function mpPost(path, token, body) {
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.mercadopago.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, email } = req.body;
  if (!user_id || !email) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const data = await mpPost('/preapproval', process.env.MP_ACCESS_TOKEN, {
      preapproval_plan_id: process.env.MP_PLAN_ID,
      payer_email: email,
      back_url: 'https://tiago5351.github.io/Bet',
      external_reference: user_id,
      status: 'pending'
    });

    if (data.init_point) {
      return res.status(200).json({ init_point: data.init_point });
    }

    return res.status(500).json({ error: 'Error creando suscripcion', detail: data });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
