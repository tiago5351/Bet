const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

const { user_id, email } = req.body;
if (!user_id || !email) return res.status(400).json({ error: ‘Faltan datos’ });

try {
const response = await fetch(‘https://api.mercadopago.com/preapproval’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘Authorization’: `Bearer ${MP_ACCESS_TOKEN}`
},
body: JSON.stringify({
preapproval_plan_id: process.env.MP_PLAN_ID,
payer_email: email,
back_url: ‘https://tiago5351.github.io/Bet’,
external_reference: user_id,
auto_recurring: {
frequency: 1,
frequency_type: ‘months’,
transaction_amount: 3500,
currency_id: ‘ARS’
},
status: ‘pending’
})
});

```
const data = await response.json();
if (data.init_point) {
  return res.status(200).json({ init_point: data.init_point, id: data.id });
} else {
  console.error('MP error:', data);
  return res.status(500).json({ error: 'Error creando suscripción', detail: data });
}
```

} catch (err) {
console.error(err);
return res.status(500).json({ error: err.message });
}
}
