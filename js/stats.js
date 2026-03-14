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
function renderROI(container) {
  const closed = filteredBets().filter(b => b.status !== 'pending' && b.status !== 'cancelled');

  if (closed.length === 0) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">🎯</div><div class="empty-title">Sin datos</div><div class="empty-sub">Agrega apuestas cerradas para ver el ROI por mercado</div></div>`;
    return;
  }

  const byMarket = {};
  const byCountry = {};
  const byDivision = {};

  closed.forEach(b => {
    const profit = getBetProfit(b);
    const amount = parseFloat(b.amount) || 0;
    let mtype = 'Sin especificar';
    let country = null;
    let division = null;
    try {
      const m = JSON.parse(b.market);
      mtype = MARKET_LABELS[m.type] || m.type || 'Sin especificar';
      country = m.country;
      division = m.division;
    } catch(e) {
      if (b.market) mtype = b.market;
    }
    if (!byMarket[mtype]) byMarket[mtype] = { won: 0, total: 0, profit: 0, amount: 0 };
    byMarket[mtype].total++;
    byMarket[mtype].profit += profit;
    byMarket[mtype].amount += amount;
    if (b.status === 'won') byMarket[mtype].won++;
    if (country) {
      if (!byCountry[country]) byCountry[country] = { won: 0, total: 0, profit: 0, amount: 0 };
      byCountry[country].total++;
      byCountry[country].profit += profit;
      byCountry[country].amount += amount;
      if (b.status === 'won') byCountry[country].won++;
    }
    if (division) {
      const key = division + (country ? ` (${country})` : '');
      if (!byDivision[key]) byDivision[key] = { won: 0, total: 0, profit: 0, amount: 0 };
      byDivision[key].total++;
      byDivision[key].profit += profit;
      byDivision[key].amount += amount;
      if (b.status === 'won') byDivision[key].won++;
    }
  });

  function roiCard(label, data) {
    const roi = data.amount > 0 ? ((data.profit / data.amount) * 100).toFixed(1) : '0.0';
    const wr = ((data.won / data.total) * 100).toFixed(0);
    const profitColor = data.profit >= 0 ? '#c8f542' : '#ff4d6d';
    const roiColor = parseFloat(roi) >= 0 ? '#c8f542' : '#ff4d6d';
    const profitSign = data.profit >= 0 ? '+' : '';
    return `
      <div style="background:#10101c;border:1px solid #2a2a40;border-radius:14px;padding:16px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div style="font-size:14px;font-weight:700;color:#f0f0ff;flex:1;padding-right:8px">${label}</div>
          <div style="font-size:11px;color:#6b6b8a;white-space:nowrap">${data.total} apuesta${data.total!==1?'s':''}</div>
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
    const entries = Object.entries(data).sort((a,b) => b[1].profit - a[1].profit);
    if (entries.length === 0) return '';
    return `
      <div style="font-size:11px;color:#c8f542;letter-spacing:0.1em;margin:20px 0 10px">// ${title.toUpperCase()}</div>
      ${entries.map(([k, v]) => roiCard(k, v)).join('')}
    `;
  }

  container.innerHTML = `
    <div style="padding:4px 0 20px">
      <div style="font-size:11px;color:#c8f542;letter-spacing:0.1em;margin-bottom:4px">// ANÁLISIS</div>
      <h2 style="font-family:'Outfit',sans-serif;font-size:24px;font-weight:800;margin-bottom:4px">ROI por segmento</h2>
      <p style="color:#6b6b8a;font-size:13px">${closed.length} apuestas analizadas</p>
    </div>
    ${section('Por tipo de mercado', byMarket)}
    ${Object.keys(byCountry).length ? section('Por país', byCountry) : ''}
    ${Object.keys(byDivision).length ? section('Por división', byDivision) : ''}
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

  :root {
    --font-head: 'Outfit', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  }

  :root {
    --bg: #080810;
    --surface: #10101c;
    --surface2: #181828;
    --border: #2a2a40;
    --accent: #c8f542;
    --accent2: #7b61ff;
    --danger: #ff4d6d;
    --warn: #ffb703;
    --text: #f0f0ff;
    --muted: #6b6b8a;
    --font-head: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
    --font-mono: 'SF Mono', 'Menlo', 'Courier New', monospace;
    --radius: 16px;
    --radius-sm: 8px;
  }

* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  html, body { background: #080810 !important; color: #f0f0ff !important; color-scheme: dark !important; }

body {
background: var(--bg);
color: var(--text);
font-family: var(--font-head);
min-height: 100dvh;
overflow-x: hidden;
user-select: none;
}

/* ── SPLASH ── */
#splash {
position: fixed; inset: 0; background: var(--bg);
display: flex; flex-direction: column; align-items: center; justify-content: center;
z-index: 999; transition: opacity .4s;
}
#splash .logo-mark {
width: 72px; height: 72px; border-radius: 20px;
background: #c8f542; display: flex; align-items: center; justify-content: center;
font-family: var(--font-head); font-size: 36px; font-weight: 800; color: #080810;
animation: pulse 1.2s infinite alternate;
}
#splash h1 { font-family: var(--font-head); font-size: 28px; font-weight: 800; margin-top: 16px; letter-spacing: -0.5px; }
#splash p { color: var(--muted); font-size: 12px; margin-top: 4px; }
@keyframes pulse { from { box-shadow: 0 0 0 0 #c8f54240; } to { box-shadow: 0 0 0 20px transparent; } }

/* ── APP SHELL ── */
#app { display: none; flex-direction: column; height: 100dvh; }
#app.visible { display: flex; }

/* ── HEADER ── */
.app-header {
padding: 16px 20px 12px;
background: var(--bg);
border-bottom: 1px solid var(--border);
position: sticky; top: 0; z-index: 100;
}
.header-row { display: flex; align-items: center; justify-content: space-between; }
.app-logo { font-family: var(--font-head); font-weight: 800; font-size: 20px; letter-spacing: -0.5px; }
.app-logo span { color: #c8f542; }

/* ── NAV TABS ── */
.nav-pills {
display: flex; gap: 6px; margin-top: 12px; overflow-x: auto;
scrollbar-width: none; -ms-overflow-style: none;
}
.nav-pills::-webkit-scrollbar { display: none; }
.pill {
flex-shrink: 0; padding: 6px 14px; border-radius: 100px;
border: 1px solid var(--border); background: transparent;
color: var(--muted); font-family: var(--font-mono); font-size: 11px; font-weight: 500;
cursor: pointer; transition: all .2s; white-space: nowrap;
}
.pill.active { background: #c8f542; color: #080810; border-color: #c8f542; font-weight: 700; }

/* ── MAIN CONTENT ── */
.main { flex: 1; overflow-y: auto; padding: 20px; padding-bottom: 100px; }

/* ── BOTTOM BAR ── */
.bottom-bar {
position: fixed; bottom: 0; left: 0; right: 0;
background: rgba(14,14,26,0.92);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-top: 1px solid rgba(42,42,64,0.8);
display: flex; align-items: center; justify-content: space-around;
padding: 10px 0 max(10px, env(safe-area-inset-bottom));
z-index: 100;
}
.tab-btn {
display: flex; flex-direction: column; align-items: center; gap: 3px;
background: none; border: none; color: var(--muted); cursor: pointer;
font-family: var(--font-mono); font-size: 10px; padding: 6px 16px;
transition: color .2s; border-radius: 12px;
}
.tab-btn svg { width: 22px; height: 22px; }
.tab-btn.active { color: #c8f542; }
.tab-btn .dot { width: 4px; height: 4px; border-radius: 50%; background: #c8f542; margin-top: 1px; opacity: 0; transition: opacity .2s; }
.tab-btn.active .dot { opacity: 1; }

/* ── FAB ── */
.fab {
position: fixed; bottom: 80px; right: 20px;
width: 54px; height: 54px; border-radius: 50%;
background: #c8f542; color: #080810; border: none;
font-size: 26px; font-weight: 300; cursor: pointer;
box-shadow: 0 8px 24px rgba(200,245,66,0.25);
display: flex; align-items: center; justify-content: center;
transition: transform .15s, box-shadow .15s;
z-index: 99;
}
.fab:active { transform: scale(0.93); box-shadow: 0 4px 12px #c8f54230; }

/* ── SECTION TITLE ── */
.section-title {
font-family: var(--font-head); font-size: 22px; font-weight: 800;
margin-bottom: 6px; letter-spacing: -0.5px;
}
.section-sub { color: var(--muted); font-size: 11px; margin-bottom: 20px; }

/* ── CARDS ── */
.card {
background: var(--surface); border: 1px solid var(--border);
border-radius: var(--radius); padding: 16px; margin-bottom: 12px;
transition: border-color .2s;
}
.card:active { border-color: var(--accent2); }

/* ── ACCOUNT CARD ── */
.account-card {
background: var(--surface2); border: 1px solid var(--border);
border-radius: var(--radius); padding: 16px; margin-bottom: 10px;
display: flex; align-items: center; gap: 14px; cursor: pointer;
transition: all .2s;
}
.account-card:active { transform: scale(0.98); }
.account-avatar {
width: 46px; height: 46px; border-radius: 14px;
display: flex; align-items: center; justify-content: center;
font-family: var(--font-head); font-size: 18px; font-weight: 800;
flex-shrink: 0;
}
.account-info { flex: 1; min-width: 0; }
.account-name { font-family: var(--font-head); font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.account-meta { color: var(--muted); font-size: 11px; margin-top: 2px; }
.account-badge {
font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 100px;
background: #c8f54215; color: #c8f542; flex-shrink: 0;
}

/* ── BET CARD ── */
.bet-card {
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--radius);
margin-bottom: 12px;
overflow: hidden;
transition: border-color .2s, box-shadow .2s;
box-shadow: 0 2px 12px rgba(0,0,0,0.3);
}
.bet-card:active { border-color: #c8f54240; box-shadow: 0 4px 20px rgba(200,245,66,0.08); }
.bet-card-header {
padding: 14px 16px; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
}
.bet-title { font-family: var(--font-head); font-weight: 700; font-size: 15px; line-height: 1.3; flex: 1; }
.bet-status {
font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 100px;
flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.5px;
}
.status-pending { background: #ffb70320; color: var(--warn); }
.status-won { background: #c8f54220; color: #c8f542; }
.status-lost { background: #ff4d6d20; color: var(--danger); }
.status-cancelled { background: #6b6b8a20; color: var(--muted); }

.bet-meta {
padding: 0 16px 14px; display: flex; gap: 16px; flex-wrap: wrap;
}
.bet-meta-item { display: flex; flex-direction: column; gap: 2px; }
.bet-meta-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
.bet-meta-val { font-size: 13px; font-weight: 500; }
.bet-meta-val.green { color: #c8f542; }
.bet-meta-val.red { color: var(--danger); }

.bet-photos {
display: flex; gap: 6px; padding: 0 16px 14px; overflow-x: auto;
scrollbar-width: none;
}
.bet-photos::-webkit-scrollbar { display: none; }
.bet-photo {
width: 70px; height: 70px; border-radius: 10px; object-fit: cover; flex-shrink: 0;
border: 1px solid var(--border); cursor: pointer;
}
.bet-photo-add {
width: 70px; height: 70px; border-radius: 10px; flex-shrink: 0;
border: 1.5px dashed var(--border); display: flex; align-items: center; justify-content: center;
cursor: pointer; color: var(--muted); font-size: 22px; transition: border-color .2s, color .2s;
}
.bet-photo-add:active { border-color: #c8f542; color: #c8f542; }

.bet-notes { padding: 0 16px 14px; color: var(--muted); font-size: 12px; line-height: 1.5; }
.bet-reminder {
margin: 0 16px 14px; padding: 10px 12px; background: #7b61ff15; border: 1px solid #7b61ff30;
border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px;
}
.bet-reminder svg { width: 14px; height: 14px; color: var(--accent2); flex-shrink: 0; }
.bet-reminder span { font-size: 11px; color: #a89cff; }

.bet-actions {
border-top: 1px solid var(--border); display: flex;
}
.bet-action-btn {
flex: 1; padding: 12px; background: none; border: none; color: var(--muted);
font-family: var(--font-mono); font-size: 11px; cursor: pointer; transition: color .2s, background .2s;
display: flex; align-items: center; justify-content: center; gap: 5px;
}
.bet-action-btn:not(:last-child) { border-right: 1px solid var(--border); }
.bet-action-btn:active { background: var(--surface2); color: var(--text); }
.bet-action-btn svg { width: 14px; height: 14px; }

/* ── CALENDAR ── */
.calendar-grid {
display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 20px;
}
.cal-day-name { text-align: center; font-size: 10px; color: var(--muted); padding: 4px 0; }
.cal-day {
aspect-ratio: 1; border-radius: 10px; display: flex; flex-direction: column;
align-items: center; justify-content: center; cursor: pointer;
border: 1px solid transparent; transition: all .15s; position: relative;
font-size: 13px;
}
.cal-day:active { transform: scale(0.9); }
.cal-day.today { border-color: #c8f542; color: #c8f542; font-weight: 700; }
.cal-day.selected { background: #c8f542; color: #080810; font-weight: 800; }
.cal-day.has-bets::after {
content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
width: 4px; height: 4px; border-radius: 50%; background: var(--accent2);
}
.cal-day.selected::after { background: #080810; }
.cal-day.other-month { opacity: 0.3; }
.cal-month-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.cal-month-label { font-family: var(--font-head); font-weight: 700; font-size: 18px; }
.cal-nav { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; color: var(--text); cursor: pointer; font-size: 16px; }

/* ── MODAL ── */
.modal-overlay {
position: fixed; inset: 0; background: #00000099; z-index: 200;
display: none; align-items: flex-end; justify-content: center;
backdrop-filter: blur(4px);
}
.modal-overlay.open { display: flex; }
.modal {
background: var(--surface); border: 1px solid var(--border);
border-radius: 24px 24px 0 0; width: 100%; max-height: 90dvh;
overflow-y: auto; padding: 20px 20px max(20px, env(safe-area-inset-bottom));
animation: slideUp .3s ease-out;
}
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.modal-handle {
width: 36px; height: 4px; border-radius: 2px; background: var(--border);
margin: 0 auto 20px;
}
.modal-title { font-family: var(--font-head); font-size: 20px; font-weight: 800; margin-bottom: 20px; }

/* ── FORM ── */
.form-group { margin-bottom: 16px; }
.form-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }
.form-input {
width: 100%; background: var(--surface2); border: 1px solid var(--border);
border-radius: var(--radius-sm); color: var(--text); font-family: var(--font-mono);
font-size: 14px; padding: 12px 14px; outline: none; transition: border-color .2s;
}
.form-input:focus { border-color: var(--accent2); }
.form-select {
width: 100%; background: var(--surface2); border: 1px solid var(--border);
border-radius: var(--radius-sm); color: var(--text); font-family: var(--font-mono);
font-size: 14px; padding: 12px 14px; outline: none; appearance: none;
background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b6b8a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
background-repeat: no-repeat; background-position: right 12px center; background-size: 16px;
}
.form-select option { background: var(--surface2); }

.btn-primary {
width: 100%; padding: 14px; background: #c8f542; color: #080810;
border: none; border-radius: var(--radius-sm); font-family: var(--font-head);
font-weight: 700; font-size: 16px; cursor: pointer; transition: opacity .15s;
}
.btn-primary:active { opacity: 0.85; }
.btn-secondary {
width: 100%; padding: 14px; background: transparent; color: var(--text);
border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: var(--font-mono);
font-size: 14px; cursor: pointer; margin-top: 8px;
}

/* ── STATUS SELECTOR ── */
.status-row { display: flex; gap: 6px; }
.status-opt {
flex: 1; padding: 10px 4px; border-radius: var(--radius-sm); border: 1px solid var(--border);
background: transparent; color: var(--muted); font-family: var(--font-mono);
font-size: 11px; cursor: pointer; text-align: center; transition: all .15s;
font-weight: 500;
}
.status-opt.sel-pending { border-color: var(--warn); color: var(--warn); background: #ffb70310; }
.status-opt.sel-won { border-color: #c8f542; color: #c8f542; background: #c8f54210; }
.status-opt.sel-lost { border-color: var(--danger); color: var(--danger); background: #ff4d6d10; }
.status-opt.sel-cancelled { border-color: var(--muted); color: var(--muted); background: #6b6b8a10; }

/* ── PHOTO UPLOAD ── */
.photo-upload-area {
border: 1.5px dashed var(--border); border-radius: var(--radius-sm);
padding: 20px; text-align: center; cursor: pointer; transition: border-color .2s;
}
.photo-upload-area:active { border-color: #c8f542; }
.photo-preview-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.photo-preview-wrap { position: relative; }
.photo-preview-img { width: 72px; height: 72px; object-fit: cover; border-radius: 10px; border: 1px solid var(--border); }
.photo-preview-del {
position: absolute; top: -4px; right: -4px; width: 20px; height: 20px;
border-radius: 50%; background: var(--danger); border: none; color: #fff;
font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}

/* ── IMAGE VIEWER ── */
.img-viewer-overlay {
position: fixed; inset: 0; background: #000000ee; z-index: 300;
display: none; align-items: center; justify-content: center;
}
.img-viewer-overlay.open { display: flex; }
.img-viewer-overlay img { max-width: 95vw; max-height: 90dvh; border-radius: 12px; }
.img-viewer-close {
position: absolute; top: 20px; right: 20px; background: #ffffff20;
border: none; color: #fff; font-size: 24px; width: 40px; height: 40px;
border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
}

/* ── EMPTY STATE ── */
.empty {
text-align: center; padding: 60px 20px;
display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.empty-icon { font-size: 48px; margin-bottom: 6px; }
.empty-title { font-family: var(--font-head); font-size: 18px; font-weight: 700; }
.empty-sub { color: var(--muted); font-size: 12px; max-width: 200px; line-height: 1.5; }

/* ── STATS STRIP ── */
.stats-strip {
display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px;
}
.stat-box {
background: var(--surface2); border: 1px solid var(--border); border-radius: 12px;
padding: 12px; text-align: center;
}
.stat-val { font-family: var(--font-head); font-size: 20px; font-weight: 800; }
.stat-val.green { color: #c8f542; }
.stat-val.red { color: var(--danger); }
.stat-label { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }

/* ── COLOR PICKER ── */
.color-row { display: flex; gap: 10px; flex-wrap: wrap; }
.color-dot {
width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
border: 2.5px solid transparent; transition: border-color .15s, transform .15s;
}
.color-dot.selected { border-color: #fff; transform: scale(1.15); }

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.hidden { display: none !important; }

/* ── INSTALL BANNER ── */
.install-banner {
background: linear-gradient(135deg, #7b61ff20, #c8f54210);
border: 1px solid #7b61ff40; border-radius: var(--radius); padding: 14px 16px;
margin-bottom: 16px; display: flex; align-items: center; gap: 12px;
}
.install-banner .ib-icon { font-size: 28px; }
.install-banner .ib-text { flex: 1; }
.install-banner .ib-title { font-family: var(--font-head); font-weight: 700; font-size: 13px; }
.install-banner .ib-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
.install-btn {
background: #c8f542; color: #080810; border: none; border-radius: 8px;
padding: 7px 12px; font-family: var(--font-head); font-weight: 700; font-size: 11px; cursor: pointer;
}
