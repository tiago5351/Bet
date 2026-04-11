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
  if (!isPro()) { renderPaywall(main); return; }
  const baseBets = filteredBets();
  
  const closed = baseBets.filter(b => b.status !== 'pending' && b.status !== 'cancelled');
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

function roiOf(arr) {
  const stake  = arr.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
  const profit = arr.reduce((s,b)=>s+getBetProfit(b),0);
  return stake > 0 ? (profit/stake)*100 : 0;
}

function groupBy(arr, fn) {
  return arr.reduce((acc, item) => {
    const key = fn(item) || 'Otros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function buildInsights(closed, won, lost, totalStake, totalProfit, globalRoi) {
  const insights = [];
  if (closed.length < 5) return insights;

  const profit = b => getBetProfit(b);

  // ─────────────────────────
  // 1. PERFIL GENERAL
  // ─────────────────────────
  const wr = (won.length / closed.length) * 100;

  if (wr >= 65 && globalRoi > 0) {
    insights.push({
      icon: '🧠',
      title: 'Estás jugando bien',
      desc: 'Buen win rate + ROI positivo. Tenés edge real.',
      action: 'Podés escalar stake gradualmente sin romper disciplina'
    });
  }

  if (wr < 45 && globalRoi < 0) {
    insights.push({
      icon: '🚨',
      title: 'Estrategia débil',
      desc: 'Muchos errores + ROI negativo',
      action: 'Bajá volumen y revisá cómo elegís picks'
    });
  }

  // ─────────────────────────
  // 2. PARLAYS
  // ─────────────────────────
  const parlays = closed.filter(b => b.isParlay);
  const singles = closed.filter(b => !b.isParlay);

  if (parlays.length >= 2 && singles.length >= 2) {
    const parlayRoi = roiOf(parlays);
    const singleRoi = roiOf(singles);

    if (parlayRoi < singleRoi - 10) {
      insights.push({
        icon: '⚠️',
        title: 'Los parlays te están matando',
        desc: 'Tus combos rinden mucho peor que las apuestas simples',
        action: 'Reducí parlays o bajá eventos por ticket'
      });
    }
  }

  // ─────────────────────────
  // 3. OVERBETTING (clave)
  // ─────────────────────────
  const amounts = closed.map(b => parseFloat(b.amount)||0).filter(x=>x>0);

  if (amounts.length >= 5) {
    const avg = amounts.reduce((a,b)=>a+b,0)/amounts.length;

    const big = closed.filter(b => parseFloat(b.amount) > avg*1.8);
    const normal = closed.filter(b => parseFloat(b.amount) <= avg*1.8);

    if (big.length >= 2 && normal.length >= 2) {
      const bigRoi = roiOf(big);
      const normalRoi = roiOf(normal);

      if (bigRoi < normalRoi - 10) {
        insights.push({
          icon: '💸',
          title: 'Estás sobreapostando',
          desc: 'Cuando subís stake, tu rendimiento cae',
          action: 'No apuestes más de 2x tu stake promedio'
        });
      }
    }
  }

  // ─────────────────────────
  // 4. CUOTAS
  // ─────────────────────────
  const avgOdds = closed.reduce((s,b)=>s+(parseFloat(b.odds)||0),0)/closed.length;

  if (avgOdds > 2.2 && globalRoi < 0) {
    insights.push({
      icon: '🎲',
      title: 'Demasiado riesgo',
      desc: `Cuota promedio ${avgOdds.toFixed(2)} sin retorno`,
      action: 'Estás forzando valor donde no hay edge'
    });
  }

  if (avgOdds < 1.6 && wr < 55) {
    insights.push({
      icon: '📉',
      title: 'Cuotas bajas sin edge',
      desc: 'Ni siquiera las seguras están funcionando',
      action: 'Revisá criterio de selección'
    });
  }

  // ─────────────────────────
  // 5. MEJOR MERCADO
  // ─────────────────────────
  const bySport = groupBy(closed, b => b.oddsSport || 'Otros');

  const stats = Object.entries(bySport)
    .filter(([,arr])=>arr.length>=2)
    .map(([name,arr])=>({
      name,
      roi: roiOf(arr)
    }))
    .sort((a,b)=>b.roi-a.roi);

  if (stats.length >= 2) {
    const best = stats[0];
    const worst = stats[stats.length-1];

    if (best.roi > globalRoi + 8) {
      insights.push({
        icon: '🏆',
        title: `Tu edge está en ${best.name}`,
        desc: 'Ahí estás ganando claramente',
        action: 'Meté más volumen en ese mercado'
      });
    }

    if (worst.roi < globalRoi - 8) {
      insights.push({
        icon: '📉',
        title: `Estás perdiendo en ${worst.name}`,
        desc: 'Ahí estás quemando bankroll',
        action: 'Reducí exposición o evitá ese mercado'
      });
    }
  }

  // ─────────────────────────
  // 6. TILT (MUY IMPORTANTE)
  // ─────────────────────────
  let tilt = 0;

  for (let i=1;i<closed.length;i++){
    const prev = closed[i-1];
    const curr = closed[i];

    if (
      prev.status === 'lost' &&
      parseFloat(curr.amount) > parseFloat(prev.amount)
    ) tilt++;
  }

  if (tilt >= 2) {
    insights.push({
      icon: '🧠',
      title: 'Estás entrando en tilt',
      desc: 'Subís stake después de perder',
      action: 'Eso destruye bankroll a largo plazo'
    });
  }

  // ─────────────────────────
  // 7. TENDENCIA
  // ─────────────────────────
  const sortedByDate = [...closed].sort((a,b) =>
    new Date(a.date||0) - new Date(b.date||0)
  );

  const last10 = sortedByDate.slice(-10);
  const prev10 = sortedByDate.slice(-20, -10);

  if (last10.length >= 5 && prev10.length >= 5) {
    const roiLast = roiOf(last10);
    const roiPrev = roiOf(prev10);

    if (roiLast > roiPrev + 10) {
      insights.push({
        icon: '📈',
        title: 'Estás mejorando',
        desc: 'Tu rendimiento viene en subida',
        action: 'Seguí exactamente con este enfoque'
      });
    }

    if (roiLast < roiPrev - 10) {
      insights.push({
        icon: '📉',
        title: 'Estás empeorando',
        desc: 'Algo cambió y te está afectando',
        action: 'Revisá qué estás haciendo distinto'
      });
    }
  }

  // ─────────────────────────
  // 8. RACHA
  // ─────────────────────────
  const sorted = [...closed].sort((a,b)=> (b.date||'')>(a.date||'')?1:-1);

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
      title: `Racha de ${streak}`,
      desc: 'Estás en un gran momento',
      action: 'No sobreapuestes por confianza'
    });
  }

  if (streak >= 3 && dir === 'lost') {
    insights.push({
      icon: '❄️',
      title: `${streak} derrotas seguidas`,
      desc: 'Momento peligroso',
      action: 'Bajá stake o frená 24h'
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
