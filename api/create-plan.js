// Ejecutar UNA SOLA VEZ para crear el plan de suscripción en MercadoPago
// Después de ejecutar, copiar el plan_id y agregarlo como variable de entorno MP_PLAN_ID

module.exports = async function handler(req, res) {
if (req.method !== ‘POST’) return res.status(405).end();

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

try {
const response = await fetch(‘https://api.mercadopago.com/preapproval_plan’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘Authorization’: `Bearer ${MP_ACCESS_TOKEN}`
},
body: JSON.stringify({
reason: ‘BetTrack — Suscripción mensual’,
auto_recurring: {
frequency: 1,
frequency_type: ‘months’,
transaction_amount: 3500,
currency_id: ‘ARS’
},
payment_methods_allowed: {
payment_types: [{ id: ‘credit_card’ }, { id: ‘debit_card’ }]
},
back_url: ‘https://tiago5351.github.io/Bet’,
status: ‘active’
})
});

```
const data = await response.json();
return res.status(200).json(data);
```

} catch (err) {
return res.status(500).json({ error: err.message });
}
}
