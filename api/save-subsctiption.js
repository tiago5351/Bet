module.exports = async (req, res) => {
  try {
    // solo permitir POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const sub = req.body;

    if (!sub) {
      return res.status(400).json({ error: 'No subscription received' });
    }

    // 👇 log para verificar que funciona
    console.log('📩 SUB GUARDADA');

    // ⚠️ por ahora no guardamos en DB (solo test)
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('ERROR save-subscription:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
