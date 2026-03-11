const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

const { user_id } = req.body;
if (!user_id) return res.status(400).json({ error: ‘Falta user_id’ });

try {
const response = await fetch(
`https://api.mercadopago.com/preapproval/search?external_reference=${user_id}&status=authorized`,
{
headers: { ‘Authorization’: `Bearer ${MP_ACCESS_TOKEN}` }
}
);

```
const data = await response.json();
const active = data.results && data.results.length > 0;
return res.status(200).json({ active });
```

} catch (err) {
console.error(err);
return res.status(500).json({ error: err.message });
}
}
