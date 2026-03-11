const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

module.exports = async function handler(req, res) {
if (req.method !== ‘POST’) return res.status(405).end();

const { type, data } = req.body;

if (type === ‘subscription_preapproval’) {
try {
const response = await fetch(
`https://api.mercadopago.com/preapproval/${data.id}`,
{ headers: { ‘Authorization’: `Bearer ${MP_ACCESS_TOKEN}` } }
);
const sub = await response.json();
console.log(`Suscripción ${sub.id} - estado: ${sub.status} - usuario: ${sub.external_reference}`);
// Aquí se puede actualizar Supabase si se necesita
} catch (err) {
console.error(‘Webhook error:’, err);
}
}

return res.status(200).json({ received: true });
}
