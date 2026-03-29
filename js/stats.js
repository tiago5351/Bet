// ─────────────────────────────────────────
//  STATS TAB (Gráfico + ROI)
// ─────────────────────────────────────────
let statsSubTab = 'graph';

function renderStatsTab(container) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div style="display:flex;background:#10101c;border-radius:12px;padding:4px;margin-bottom:20px;gap:4px">
      <button id="subtab-graph" onclick="switchStatsSubTab('graph')"
        style="flex:1;padding:10px;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;background:${statsSubTab==='graph'?'#c8f542':'transparent'};color:${statsSubTab==='graph'?'#080810':'#6b6b8a'}">
        📈 Gráfico
      </button>
      <button id="subtab-roi" onclick="switchStatsSubTab('roi')"
        style="flex:1;padding:10px;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;background:${statsSubTab==='roi'?'#c8f542':'transparent'};color:${statsSubTab==='roi'?'#080810':'#6b6b8a'}">
        🎯 ROI
      </button>
    </div>
    <div id="stats-subcontent"></div>
  `;
  container.innerHTML = '';
  container.appendChild(wrapper);
  const sub = document.getElementById('stats-subcontent');
  if (statsSubTab === 'graph') renderGraph(sub);
  else renderROI(sub);
}

function switchStatsSubTab(tab) {
  statsSubTab = tab;
  const main = document.getElementById('main-content');
  renderStatsTab(main);
}

// ─────────────────────────────────────────
//  ROI POR MERCADO
// ─────────────────────────────────────────
let roiFilters = {
  sport: null, 
  marketType: null, 
  country: null
};
function buildRoiSegments(bets, filters) {
  function getProfit(bet) {
    if (bet.realProfit !== undefined && bet.realProfit !== '' && bet.realProfit !== null)
      return parseFloat(bet.realProfit);
    if (bet.status === 'won') return ((parseFloat(bet.odds) || 1) - 1) * (parseFloat(bet.amount) || 0);
    if (bet.status === 'lost') return -(parseFloat(bet.amount) || 0);
    return 0;
  }

  function parseMarket(bet) {
    try {
      const m = JSON.parse(bet.market);
      return { type: m.type || bet.market, country: m.country || null, sport: m.sport || null };
    } catch(e) {
      return { type: bet.market || null, country: null, sport: null };
    }
  }

  function buildSegment(group) {
    const amount = group.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
    const profit = group.reduce((s, b) => s + getProfit(b), 0);
    return {
      bets: group.length,
      amount,
      profit,
      roi: amount > 0 ? (profit / amount) * 100 : 0
    };
  }

  const filtered = bets.filter(bet => {
    
    if (bet.isParlay) return false;
    
    const m = parseMarket(bet);
    if (filters.sport && m.sport !== filters.sport) return false;
    if (filters.marketType && m.type !== filters.marketType) return false;
    if (filters.country && m.country !== filters.country) return false;
    return true;
  });

  const totalSegment = buildSegment(filtered);

  const byMarket = {};
  const byCountry = {};

  filtered.forEach(bet => {
    const m = parseMarket(bet);
    if (m.type) {
      if (!byMarket[m.type]) byMarket[m.type] = [];
      byMarket[m.type].push(bet);
    }
    if (m.country) {
      if (!byCountry[m.country]) byCountry[m.country] = [];
      byCountry[m.country].push(bet);
    }
  });

  const markets = Object.entries(byMarket)
    .filter(([, group]) => group.length >= 5)
    .map(([label, group]) => ({ label, ...buildSegment(group) }))
    .sort((a, b) => b.profit - a.profit);

  const countries = Object.entries(byCountry)
    .filter(([, group]) => group.length >= 5)
    .map(([label, group]) => ({ label, ...buildSegment(group) }))
    .sort((a, b) => b.profit - a.profit);

  return {
    total: { bets: filtered.length, ...totalSegment },
    markets,
    countries
  };
}

function renderROI(container) {
  const closed = filteredBets().filter(b => b.status !== 'pending' && b.status !== 'cancelled');
  const segments = buildRoiSegments(closed, roiFilters);
  
  if (closed.length === 0) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">🎯</div><div class="empty-title">Sin datos</div><div class="empty-sub">Agrega apuestas cerradas para ver el ROI por mercado</div></div>`;
    return;
  }


  function roiCard(label, data) {
    const roi = data.roi.toFixed(1);
    const wr = '-';
    const profitColor = data.profit >= 0 ? '#c8f542' : '#ff4d6d';
    const roiColor = parseFloat(roi) >= 0 ? '#c8f542' : '#ff4d6d';
    const profitSign = data.profit >= 0 ? '+' : '';
    return `
      <div style="background:#10101c;border:1px solid #2a2a40;border-radius:14px;padding:16px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div style="font-size:14px;font-weight:700;color:#f0f0ff;flex:1;padding-right:8px">${label}</div>
          <div style="font-size:11px;color:#6b6b8a;white-space:nowrap">${data.bets} apuesta${data.bets!==1?'s':''}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <div style="text-align:center">
            <div style="font-size:18px;font-weight:800;color:${roiColor}">${roi}%</div>
            <div style="font-size:10px;color:#6b6b8a;margin-top:2px">ROI</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:18px;font-weight:800;color:${profitColor}">${profitSign}$${Math.abs(data.profit).toLocaleString('es-AR',{maximumFractionDigits:0})}</div>
            <div style="font-size:10px;color:#6b6b8a;margin-top:2px">P&L</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:18px;font-weight:800;color:#7b61ff">${wr}%</div>
            <div style="font-size:10px;color:#6b6b8a;margin-top:2px">Win rate</div>
          </div>
        </div>
      </div>`;
  }

  function section(title, data) {
  if (!data || data.length === 0) return '';
  return `
    <div style="font-size:11px;color:#c8f542;letter-spacing:0.1em;margin:20px 0 10px">// ${title.toUpperCase()}</div>
    ${data.map(seg => roiCard(seg.label, seg)).join('')}
  `;
}

  container.innerHTML = `
    <div style="padding:4px 0 20px">
      <div style="font-size:11px;color:#c8f542;letter-spacing:0.1em;margin-bottom:4px">// ANÁLISIS</div>
      <h2 style="font-family:'Outfit',sans-serif;font-size:24px;font-weight:800;margin-bottom:4px">ROI por segmento</h2>
      <p style="color:#6b6b8a;font-size:13px">${closed.length} apuestas analizadas</p>
    </div>
    <div style="display:flex;gap:6px;margin:10px 0 20px;flex-wrap:wrap">

<select onchange="roiFilters.sport=this.value||null;renderStatsTab(document.getElementById('main-content'))">
<option value="">Todos los deportes</option>
<option value="football">Fútbol</option>
<option value="basketball">Basket</option>
<option value="tennis">Tenis</option>
</select>

<select onchange="roiFilters.marketType=this.value||null;renderStatsTab(document.getElementById('main-content'))">
<option value="">Todos los mercados</option>
<option value="winner">Ganador</option>
<option value="overunder">Over/Under</option>
<option value="spread">Spread</option>
</select>

<select onchange="roiFilters.country=this.value||null;renderStatsTab(document.getElementById('main-content'))">
<option value="">Todos los países</option>
<option value="España">España</option>
<option value="Inglaterra">Inglaterra</option>
<option value="Argentina">Argentina</option>
</select>

</div>
    ${section('Por tipo de mercado', segments.markets)}
    ${section('Por país', segments.countries)}
  `;
}

function uid() { return Math.random().toString(36).slice(2,10) + Date.now().toString(36); }

// ─────────────────────────────────────────
// ─────────────────────────────────────────
//  STATS TAB
// ─────────────────────────────────────────
function getBetProfit(b) {
  if (b.realProfit !== undefined && b.realProfit !== '' && b.realProfit !== null) return parseFloat(b.realProfit);
  if (b.status==='won') return ((parseFloat(b.odds)||1)-1)*(parseFloat(b.amount)||0);
  if (b.status==='lost') return -(parseFloat(b.amount)||0);
  return 0;
}

function renderGraph(container) {
  const fb = filteredBets().filter(b=>b.status!=='pending'&&b.status!=='cancelled');
  if (fb.length === 0) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">Sin datos</div><div class="empty-sub">Agrega apuestas cerradas para ver el gráfico</div></div>`;
    return;
  }

  // Group by week
  const byWeek = {};
  fb.forEach(b => {
    if (!b.date) return;
    const d = new Date(b.date+'T12:00:00');
    const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay()+6)%7));
    const key = mon.toISOString().slice(0,10);
    if (!byWeek[key]) byWeek[key] = 0;
    byWeek[key] += getBetProfit(b);
  });

  // Build cumulative P&L by date
  const sorted = [...fb].sort((a,b)=>{
    const da = (a.date||'') + (a.time||'') || String(a.created||0);
    const db = (b.date||'') + (b.time||'') || String(b.created||0);
    if (da !== db) return da.localeCompare(db);
    return (a.created||0) - (b.created||0);
  });
  let cum = 0;
  const points = sorted.map(b => { cum += getBetProfit(b); return {date: b.date, cum: parseFloat(cum.toFixed(2))}; });

  // Chart dimensions
  const W = 320, H = 160, PAD = 30;
  const vals = points.map(p=>p.cum);
  const minV = Math.min(0, ...vals), maxV = Math.max(0, ...vals);
  const range = maxV - minV || 1;
  const scaleY = v => H - PAD - ((v - minV) / range) * (H - PAD*2);
  const scaleX = i => PAD + (i/(points.length-1||1)) * (W - PAD*2);
  const zeroY = scaleY(0);

  let pathD = points.map((p,i) => `${i===0?'M':'L'}${scaleX(i).toFixed(1)},${scaleY(p.cum).toFixed(1)}`).join(' ');
  let areaD = pathD + ` L${scaleX(points.length-1).toFixed(1)},${zeroY.toFixed(1)} L${scaleX(0).toFixed(1)},${zeroY.toFixed(1)} Z`;

  const lastVal = points[points.length-1]?.cum || 0;
  const totalStake = fb.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
  const roi = totalStake > 0 ? ((lastVal/totalStake)*100).toFixed(1) : '0';
  const winRate = fb.length > 0 ? ((fb.filter(b=>b.status==='won').length/fb.length)*100).toFixed(0) : '0';

  // Weekly breakdown
  const weekKeys = Object.keys(byWeek).sort();
  const weekRows = weekKeys.slice(-8).map(k => {
    const v = byWeek[k];
    const d = new Date(k+'T12:00:00');
    const label = d.toLocaleDateString('es-ES',{day:'numeric',month:'short'});
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #2a2a40">
      <div style="font-size:11px;color:#6b6b8a;width:60px;flex-shrink:0">Sem ${label}</div>
      <div style="flex:1;height:6px;background:#181828;border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100,Math.abs(v)/Math.max(...Object.values(byWeek).map(Math.abs))*100)}%;background:${v>=0?'#c8f542':'#ff4d6d'};border-radius:3px"></div>
      </div>
      <div style="font-size:12px;font-weight:700;color:${v>=0?'#c8f542':'#ff4d6d'};width:55px;text-align:right">${v>=0?'+':''}$${Math.abs(v).toFixed(0)}</div>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div class="section-title">Gráfico P&L</div>
    <div class="section-sub">Evolución acumulada de ganancias</div>

    <div class="stats-strip" style="margin-bottom:16px">
      <div class="stat-box"><div class="stat-val ${lastVal>=0?'green':'red'}">${lastVal>=0?'+':''}$${Math.abs(lastVal).toFixed(0)}</div><div class="stat-label">P&L Total</div></div>
      <div class="stat-box"><div class="stat-val">${winRate}%</div><div class="stat-label">Win Rate</div></div>
      <div class="stat-box"><div class="stat-val ${roi>=0?'green':'red'}">${roi}%</div><div class="stat-label">ROI</div></div>
    </div>

    <div style="background:#10101c;border:1px solid #2a2a40;border-radius:16px;padding:16px;margin-bottom:16px;overflow:hidden">
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${lastVal>=0?'#c8f542':'#ff4d6d'}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${lastVal>=0?'#c8f542':'#ff4d6d'}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <line x1="${PAD}" y1="${zeroY.toFixed(1)}" x2="${W-PAD}" y2="${zeroY.toFixed(1)}" stroke="#2a2a40" stroke-width="1" stroke-dasharray="4,4"/>
        <path d="${areaD}" fill="url(#grad)"/>
        <path d="${pathD}" fill="none" stroke="${lastVal>=0?'#c8f542':'#ff4d6d'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${points.map((p,i)=> i===points.length-1 ? `<circle cx="${scaleX(i).toFixed(1)}" cy="${scaleY(p.cum).toFixed(1)}" r="4" fill="${lastVal>=0?'#c8f542':'#ff4d6d'}"/>` : '').join('')}
        <text x="${PAD}" y="14" fill="#6b6b8a" font-size="9">$${maxV.toFixed(0)}</text>
        <text x="${PAD}" y="${H-4}" fill="#6b6b8a" font-size="9">$${minV.toFixed(0)}</text>
      </svg>
    </div>

    <div style="background:#10101c;border:1px solid #2a2a40;border-radius:16px;padding:16px;margin-bottom:16px">
      <div style="font-weight:700;font-size:13px;margin-bottom:12px">Por semana</div>
      ${weekRows || '<div style="color:#6b6b8a;font-size:12px">Sin datos suficientes</div>'}
    </div>

    <button onclick="exportCSV()" style="width:100%;padding:14px;background:#181828;border:1px solid #2a2a40;border-radius:12px;color:#f0f0ff;font-size:14px;cursor:pointer;margin-bottom:8px">
      📊 Exportar a Excel / CSV
    </button>
    <button onclick="exportJSON()" style="width:100%;padding:14px;background:#181828;border:1px solid #2a2a40;border-radius:12px;color:#6b6b8a;font-size:13px;cursor:pointer">
      💾 Exportar respaldo JSON
    </button>
  `;
}

function exportCSV() {
  const fb = filteredBets();
  const headers = ['Fecha','Evento','Cuenta','Estado','Monto','Cuota','Profit Real','P&L','Notas'];
  const rows = fb.map(b => {
    const acc = accounts.find(a=>a.id===b.accountId);
    const pnl = getBetProfit(b);
    return [
      b.date||'',
      `"${(b.title||'').replace(/"/g,'""')}"`,
      `"${(acc?.name||'').replace(/"/g,'""')}"`,
      b.status||'',
      b.amount||'',
      b.odds||'',
      b.realProfit||'',
      pnl.toFixed(2),
      `"${(b.notes||'').replace(/"/g,'""')}"`
    ].join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='bettrack_export.csv'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function exportJSON() {
  const data = {accounts, bets, exported: new Date().toISOString()};
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='bettrack_backup.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function renderBets(container) {
  const fb = filteredBets();
  const won = fb.filter(b=>b.status==='won');
  const lost = fb.filter(b=>b.status==='lost');
  const pending = fb.filter(b=>b.status==='pending');

  const profit = fb.reduce((s,b) => {
    if (b.realProfit !== undefined && b.realProfit !== '' && b.realProfit !== null) return s + parseFloat(b.realProfit);
    if (b.status==='won') return s + (((parseFloat(b.odds)||1)-1)*(parseFloat(b.amount)||0));
    if (b.status==='lost') return s - (parseFloat(b.amount)||0);
    return s;
  }, 0);

  const statusFilters = [
    {k:'all', label:'Todas', count: fb.length},
    {k:'pending', label:'⏳ Pendientes', count: pending.length},
    {k:'won', label:'✅ Ganadas', count: won.length},
    {k:'lost', label:'❌ Perdidas', count: lost.length},
    {k:'cancelled', label:'🚫 Nulas', count: fb.filter(b=>b.status==='cancelled').length},
  ];

  let statsHtml = `
    <div class="stats-strip">
      <div class="stat-box"><div class="stat-val">${fb.length}</div><div class="stat-label">Total</div></div>
      <div class="stat-box"><div class="stat-val" style="color:#ffb703">${pending.length}</div><div class="stat-label">Pendientes</div></div>
      <div class="stat-box"><div class="stat-val ${profit>=0?'green':'red'}">${profit>=0?'+':''}${profit.toFixed(0)}</div><div class="stat-label">P&L</div></div>
    </div>
    <div class="nav-pills" style="margin-bottom:16px">
      ${statusFilters.map(f=>`<button class="pill ${currentStatusFilter===f.k?'active':''}" onclick="setStatusFilter('${f.k}')">${f.label} ${f.count>0?`<span style="opacity:.7">(${f.count})</span>`:''}</button>`).join('')}
    </div>`;

  // apply status filter
  const visibleBets = currentStatusFilter==='all' ? fb : fb.filter(b=>b.status===currentStatusFilter);

  if (visibleBets.length === 0) {
    container.innerHTML = statsHtml + `<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">Sin apuestas</div><div class="empty-sub">No hay apuestas con este filtro</div></div>`;
    return;
  }

  const sorted = [...visibleBets].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  container.innerHTML = statsHtml + sorted.map(buildBetCard).join('');
}

function buildBetCard(b) {
  const acc = accounts.find(a=>a.id===b.accountId);
  const accColor = acc ? acc.color : '#6b6b8a';
  const accName = acc ? acc.name : 'Sin cuenta';
  const statusMap = {pending:'⏳ Pendiente',won:'✅ Ganada',lost:'❌ Perdida',cancelled:'🚫 Nula'};
  const statusClass = {pending:'status-pending',won:'status-won',lost:'status-lost',cancelled:'status-cancelled'};
  const potential = (parseFloat(b.amount)||0) * (parseFloat(b.odds)||1);
  const hasRealProfit = b.realProfit !== undefined && b.realProfit !== '' && b.realProfit !== null;
  const realProfitVal = hasRealProfit ? parseFloat(b.realProfit) : null;
  // realProfit ALWAYS wins — only fall back to calculated if not set
  const profit = hasRealProfit ? realProfitVal
    : b.status==='won' ? ((parseFloat(b.odds)||1)-1)*(parseFloat(b.amount)||0)
    : b.status==='lost' ? -(parseFloat(b.amount)||0)
    : null;

  let photosHtml = '';
  if (b.photos && b.photos.length) {
    b.photos.forEach(p => {
      photosHtml += `<img class="bet-photo" src="${p}" onclick="viewImg('${p}')" loading="lazy">`;
    });
  }
  photosHtml += `<div class="bet-photo-add" onclick="addPhotoToBet('${b.id}')">+</div>`;

  const reminderHtml = b.time ? `
    <div class="bet-reminder">
      <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
      <span>Recordatorio: ${b.date} a las ${b.time}</span>
    </div>` : '';

  const dateFormatted = b.date ? new Date(b.date+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'}) : '—';

  return `
    <div class="bet-card" id="bet-${b.id}">
      <div class="bet-card-header">
        <div>
          <div style="font-size:10px;color:${accColor};font-weight:700;margin-bottom:4px">${accName.toUpperCase()}</div>
          <div class="bet-title">${b.title || 'Sin título'}</div>
          ${b.market ? `<div style="margin-top:5px;font-size:12px;color:#c8f542;font-weight:600;background:#c8f54210;padding:3px 8px;border-radius:6px;display:inline-block">🎯 ${getMarketDisplay(b.market)}</div>` : ''}
        </div>
        <div class="bet-status ${statusClass[b.status]||'status-pending'}">${statusMap[b.status]||'⏳'}</div>
      </div>
      <div class="bet-meta">
        <div class="bet-meta-item"><div class="bet-meta-label">Fecha</div><div class="bet-meta-val">${dateFormatted}</div></div>
        ${b.amount ? `<div class="bet-meta-item"><div class="bet-meta-label">Monto</div><div class="bet-meta-val">$${parseFloat(b.amount).toFixed(2)}</div></div>` : ''}
        ${b.odds ? `<div class="bet-meta-item"><div class="bet-meta-label">Cuota</div><div class="bet-meta-val">${parseFloat(b.odds).toFixed(2)}</div></div>` : ''}
        ${b.amount && b.odds ? `<div class="bet-meta-item"><div class="bet-meta-label">Potencial</div><div class="bet-meta-val">$${potential.toFixed(2)}</div></div>` : ''}
        ${profit !== null ? `<div class="bet-meta-item"><div class="bet-meta-label">${hasRealProfit ? '💰 Profit real' : 'P&L'}</div><div class="bet-meta-val ${profit>=0?'green':'red'}">${profit>=0?'+':''}$${Math.abs(profit).toFixed(2)}${hasRealProfit ? '' : ''}</div></div>` : ''}
      </div>
      ${reminderHtml}
      ${b.notes ? `<div class="bet-notes">${b.notes}</div>` : ''}
      <div class="bet-photos">${photosHtml}</div>
      <div class="bet-actions">
        <button class="bet-action-btn" onclick="editBet('${b.id}')">
          <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
          Editar
        </button>
        <button class="bet-action-btn" onclick="shareWhatsApp('${b.id}')" style="color:#25d366">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Compartir
        </button>
        <button class="bet-action-btn" onclick="quickStatus('${b.id}')">
          <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
          Estado
        </button>
        <button class="bet-action-btn" onclick="deleteBet('${b.id}')" style="color:#ff4d6d">
          <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          Borrar
        </button>
      </div>
    </div>`;
}

// ─────────────────────────────────────────

  
