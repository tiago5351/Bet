const https = require(‘https’);

function mpRequest(options, body) {
return new Promise((resolve, reject) => {
const req = https.request(options, (res) => {
let data = ‘’;
res.on(‘data’, chunk => data += chunk);
res.on(‘end’, () => {
try { resolve(JSON.parse(data)); }
catch(e) { reject(e); }
});
});
req.on(‘error’, reject);
if (body) req.write(body);
req.end();
});
}

module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).end();

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const body = JSON.stringify({
reason: ‘BetTrack — Suscripción mensual’,
auto_recurring: {
frequency: 1,
frequency_type: ‘months’,
transaction_amount: 5000,
currency_id: ‘ARS’
},
back_url: ‘https://tiago5351.github.io/Bet’,
status: ‘active’
});

const options = {
hostname: ‘api.mercadopago.com’,
path: ‘/preapproval_plan’,
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘Authorization’: `Bearer ${MP_ACCESS_TOKEN}`,
‘Content-Length’: Buffer.byteLength(body)
}
};

try {
const data = await mpRequest(options, body);
return res.status(200).json(data);
} catch (err) {
return res.status(500).json({ error: err.message });
}
};
