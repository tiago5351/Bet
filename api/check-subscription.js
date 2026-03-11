const https = require(‘https’);

function mpGet(path, token) {
return new Promise((resolve, reject) => {
const req = https.request({
hostname: ‘api.mercadopago.com’,
path,
method: ‘GET’,
headers: { ‘Authorization’: `Bearer ${token}` }
}, (res) => {
let data = ‘’;
res.on(‘data’, chunk => data += chunk);
res.on(‘end’, () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
});
req.on(‘error’, reject);
req.end();
});
}

module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

const { user_id } = req.body;
if (!user_id) return res.status(400).json({ error: ‘Falta user_id’ });

try {
const data = await mpGet(
`/preapproval/search?external_reference=${user_id}&status=authorized`,
process.env.MP_ACCESS_TOKEN
);
const active = data.results && data.results.length > 0;
return res.status(200).json({ active });
} catch (err) {
return res.status(500).json({ error: err.message });
}
};
