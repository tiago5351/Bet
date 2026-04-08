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
  const insights = [];
  if (closed.length < 3) return insights;

  function profit(b) {
    if (b.realProfit !== undefined && b.realProfit !== '' && b.realProfit !== null)
      return parseFloat(b.realProfit);

    if (b.status === 'won')
      return ((parseFloat(b.odds) || 1) - 1) * (parseFloat(b.amount) || 0);

    if (b.status === 'lost')
      return -(parseFloat(b.amount) || 0);

    return 0;
  }

  function roiOf(arr) {
    const stake  = arr.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
    const prof   = arr.reduce((s,b)=>s+profit(b),0);
    return stake > 0 ? (prof/stake)*100 : 0;
  }

  // ─────────────────────────
  // 1. PARLAYS vs SIMPLES
  // ─────────────────────────
  const parlays = closed.filter(b => b.isParlay);
  const singles = closed.filter(b => !b.isParlay);

  if (parlays.length >= 2 && singles.length >= 2) {
    const parlayRoi = roiOf(parlays);
    const singleRoi = roiOf(singles);

    if (parlayRoi < singleRoi - 10) {
      insights.push({
        icon: '⚠️',
        title: 'Perdés más en parlays',
        desc: `ROI parlays: ${parlayRoi.toFixed(0)}% vs simples: ${singleRoi.toFixed(0)}%.`,
        action: 'Reducí parlays o bajá cantidad de picks por combo.'
      });
    } else if (parlayRoi > singleRoi + 10) {
      insights.push({
        icon: '✅',
        title: 'Los parlays te funcionan',
        desc: `ROI parlays: +${parlayRoi.toFixed(0)}% vs simples: ${singleRoi.toFixed(0)}%.`,
        action: 'Seguí así pero controlá el stake.'
      });
    }
  }

  // ─────────────────────────
  // 2. MEJOR / PEOR DEPORTE
  // ─────────────────────────
  const bySport = {};

  closed.forEach(b => {
    const key = b.oddsSport || 'Otros';
    if (!bySport[key]) bySport[key] = [];
    bySport[key].push(b);
  });

  const sports = Object.entries(bySport)
    .filter(([,arr]) => arr.length >= 2)
    .map(([name, arr]) => ({
      name,
      roi: roiOf(arr),
      count: arr.length
    }))
    .sort((a,b)=>b.roi-a.roi);

  if (sports.length >= 2) {
    const best  = sports[0];
    const worst = sports[sports.length-1];

    if (best.roi > 5) {
      insights.push({
        icon: '🏆',
        title: `Sos fuerte en ${best.name}`,
        desc: `ROI ${best.roi.toFixed(0)}% en ${best.count} apuestas.`,
        action: 'Apostá más en este mercado.'
      });
    }

    if (worst.roi < -5) {
      insights.push({
        icon: '📉',
        title: `Flojo en ${worst.name}`,
        desc: `ROI ${worst.roi.toFixed(0)}% en ${worst.count} apuestas.`,
        action: 'Reducí exposición en este mercado.'
      });
    }
  }

  // ─────────────────────────
  // 3. STAKE MAL CALIBRADO
  // ─────────────────────────
  const amounts = closed.map(b => parseFloat(b.amount) || 0).filter(x=>x>0);

  if (amounts.length >= 4) {
    const sorted = amounts.slice().sort((a,b)=>a-b);
    const median = sorted[Math.floor(sorted.length/2)];

    const high = closed.filter(b => (parseFloat(b.amount)||0) > median * 1.5);
    const low  = closed.filter(b => (parseFloat(b.amount)||0) <= median * 1.5);

    if (high.length >= 2 && low.length >= 2) {
      const highRoi = roiOf(high);
      const lowRoi  = roiOf(low);

      if (highRoi < lowRoi - 10) {
        insights.push({
          icon: '💸',
          title: 'Apostás más cuando te va peor',
          desc: `ROI alto stake: ${highRoi.toFixed(0)}% vs normal: ${lowRoi.toFixed(0)}%.`,
          action: 'Limitá el tamaño máximo de apuesta.'
        });
      }
    }
  }

  // ─────────────────────────
  // 4. RACHA
  // ─────────────────────────
  const sorted = [...closed].sort((a,b)=>(b.date||'')>(a.date||'')?1:-1);

  let streak = 0;
  let dir = null;

  for (const b of sorted) {
    if (!dir) {
      dir = b.status;
      streak = 1;
    } else if (b.status === dir) {
      streak++;
    } else break;
  }

  if (streak >= 3 && dir === 'won') {
    insights.push({
      icon: '🔥',
      title: `${streak} victorias seguidas`,
      desc: 'Buen momento, pero cuidado con sobreapostar.',
      action: 'Mantené stake estable.'
    });
  }

  if (streak >= 3 && dir === 'lost') {
    insights.push({
      icon: '🛑',
      title: `${streak} derrotas seguidas`,
      desc: 'Racha negativa activa.',
      action: 'Bajá stake o pausá 24h.'
    });
  }

  // ─────────────────────────
  // 5. WIN RATE
  // ─────────────────────────
  const wins = closed.filter(b=>b.status==='won').length;
  const wr = (wins / closed.length) * 100;

  if (wr >= 60 && closed.length >= 5) {
    insights.push({
      icon: '🎯',
      title: `Win rate alto (${wr.toFixed(0)}%)`,
      desc: 'Estás acertando mucho.',
      action: 'Verificá que las cuotas tengan valor.'
    });
  }

  if (wr < 40 && closed.length >= 5) {
    insights.push({
      icon: '🎲',
      title: `Win rate bajo (${wr.toFixed(0)}%)`,
      desc: 'Muchos picks fallidos.',
      action: 'Reducí cantidad de apuestas.'
    });
  }

  return insights;
}

function buildAlerts() {
  return [];
}

function buildMonthly() {
  return [];
}
