// ─────────────────────────────────────────
//  ANÁLISIS TAB — Coach Inteligente
// ─────────────────────────────────────────

function getBetProfit(b) {
  if (b.realProfit !== undefined && b.realProfit !== '' && b.realProfit !== null)
    return parseFloat(b.realProfit);

  if (b.status === 'won')
    return ((parseFloat(b.odds) || 1) - 1) * (parseFloat(b.amount) || 0);

  if (b.status === 'lost')
    return -(parseFloat(b.amount) || 0);

  return 0;
}

function renderAnalisis(main) {
  const closed = bets.filter(b => b.status !== 'pending' && b.status !== 'cancelled');
  const won    = closed.filter(b => b.status === 'won');
  const lost   = closed.filter(b => b.status === 'lost');

  const totalStake  = closed.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const totalProfit = closed.reduce((s, b) => s + getBetProfit(b), 0);
  const roi         = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
  const winRate     = closed.length > 0 ? (won.length / closed.length) * 100 : 0;

  const now   = Date.now();
  const week  = 7 * 24 * 60 * 60 * 1000;
  const last7 = closed.filter(b => b.date && (now - new Date(b.date).getTime()) <= week);
  const profit7 = last7.reduce((s, b) => s + getBetProfit(b), 0);

  const roiScore = Math.min(Math.max(roi * 2.5 + 50, 0), 100);
  const wrScore  = Math.min(winRate * 1.2, 100);
  const volScore = Math.min(closed.length * 2, 100);
  const score    = Math.round((roiScore * 0.5 + wrScore * 0.3 + volScore * 0.2));

  const scoreColor = score >= 65 ? '#c8f542' : score >= 40 ? '#ffb703' : '#ff4d6d';
  const scoreLbl   = score >= 65 ? 'Buen rendimiento' : score >= 40 ? 'En desarrollo' : 'Necesita ajustes';

  const sorted = [...closed].sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1);
  let streak = [], streakDir = null;

  for (const b of sorted) {
    if (!streakDir) {
      streakDir = b.status;
      streak.push(b);
    } else if (b.status === streakDir) {
      streak.push(b);
    } else break;
  }

  const streakLabel = streakDir === 'won'
    ? `🔥 ${streak.length} victorias seguidas`
    : streakDir === 'lost'
    ? `❄️ ${streak.length} derrotas seguidas`
    : '—';

  const insights = buildInsights(closed, won, lost, totalStake, totalProfit, roi);
  const alerts   = buildAlerts(closed, won, lost, roi, profit7);
  const monthlyData = buildMonthly(closed);

  main.innerHTML = `
  <div style="padding-bottom:32px">

    <div style="background:#10101c;border:1px solid #2a2a40;border-radius:20px;padding:24px;margin-bottom:16px">
      <div style="font-size:11px;color:#6b6b8a;margin-bottom:12px">// TU RENDIMIENTO</div>

      <div style="display:flex;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="font-size:48px;font-weight:800;color:${scoreColor}">${score}</div>
          <div style="font-size:12px;color:${scoreColor}">${scoreLbl}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;color:#6b6b8a">Racha</div>
          <div style="font-size:14px;color:#f0f0ff">${streakLabel}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div style="text-align:center">
          <div style="font-weight:800;color:${roi>=0?'#c8f542':'#ff4d6d'}">${roi.toFixed(1)}%</div>
          <div style="font-size:10px;color:#6b6b8a">ROI</div>
        </div>
        <div style="text-align:center">
          <div style="font-weight:800;color:#fff">${winRate.toFixed(0)}%</div>
          <div style="font-size:10px;color:#6b6b8a">WR</div>
        </div>
        <div style="text-align:center">
          <div style="font-weight:800;color:${totalProfit>=0?'#c8f542':'#ff4d6d'}">
            ${totalProfit >= 0 ? '+$' : '-$'}${Math.abs(totalProfit).toFixed(0)}
          </div>
          <div style="font-size:10px;color:#6b6b8a">Profit</div>
        </div>
      </div>
    </div>

    ${(insights || []).map(i => `
      <div style="background:#10101c;border:1px solid #2a2a40;border-radius:12px;padding:12px;margin-bottom:8px">
        <div style="font-weight:700">${i.icon} ${i.title}</div>
        <div style="font-size:12px;color:#6b6b8a">${i.desc}</div>
        ${i.action ? `<div style="color:#c8f542;font-size:12px">→ ${i.action}</div>` : ''}
      </div>
    `).join('')}

    ${alerts.map(a => `
      <div style="color:#ff8fa3;font-size:12px">🚨 ${a}</div>
    `).join('')}

  </div>
  `;
}

// ───────── HELPERS ─────────

function buildInsights(closed) {
  if (closed.length < 3) return [];

  return [{
    icon: '📊',
    title: 'Análisis activo',
    desc: 'El sistema ya está procesando tus apuestas',
    action: null
  }];
}

function buildAlerts() {
  return [];
}

function buildMonthly() {
  return [];
}
