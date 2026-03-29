let subscriptions = [];

export default function handler(req, res) {
  const sub = req.body;

  subscriptions.push(sub);

  console.log('SUB GUARDADA', subscriptions.length);

  res.status(200).json({ok:true});
}
