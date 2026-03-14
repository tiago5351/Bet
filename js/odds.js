const ODDS_PROXY = 'https://bet-beryl.vercel.app/api/odds';
let selectedOddsEvent = null;
let oddsMonitorInterval = null;

const SPORTS_MAP = {
  'futbol': 'soccer_spain_la_liga', 'soccer': 'soccer_spain_la_liga',
  'laliga': 'soccer_spain_la_liga', 'champions': 'soccer_uefa_champs_league',
  'premier': 'soccer_epl', 'serie a': 'soccer_italy_serie_a',
  'bundesliga': 'soccer_germany_bundesliga', 'ligue': 'soccer_france_ligue_one',
  'nba': 'basketball_nba', 'basketball': 'basketball_nba',
  'tenis': 'tennis_atp_french_open', 'tennis': 'tennis_atp_french_open',
};

async function searchOdds() {
  const input = document.getElementById('f-odds-search').value.trim().toLowerCase();
  if (!input) { alert('Escribe el deporte o liga primero'); return; }
  const resultsDiv = document.getElementById('odds-results');
  resultsDiv.innerHTML = '<div style="color:#6b6b8a;font-size:12px;padding:8px 0">🔍 Buscando en Bet365...</div>';

  let sportKey = 'soccer_spain_la_liga';
  for (const [k,v] of Object.entries(SPORTS_MAP)) {
    if (input.includes(k)) { sportKey = v; break; }
  }

  try {
    const res = await fetch(`${ODDS_PROXY}?sport=${sportKey}&markets=h2h`);
    if (!res.ok) throw new Error(`Error API: ${res.status}`);
    const data = await res.json();

    const titleSearch = document.getElementById('f-title').value.trim().toLowerCase();
    const filtered = titleSearch
      ? data.filter(e => (e.home_team+' '+e.away_team).toLowerCase().includes(titleSearch))
      : data.slice(0,6);

    if (!filtered.length) {
      resultsDiv.innerHTML = '<div style="color:#6b6b8a;font-size:12px;padding:8px 0">Sin eventos. Prueba: futbol, premier, champions, nba...</div>';
      return;
    }

    resultsDiv.innerHTML = filtered.slice(0,5).map(e => {
      const b365 = e.bookmakers?.find(b=>b.key==='bet365');
      const h2h = b365?.markets?.find(m=>m.key==='h2h');
      const odds = h2h?.outcomes || [];
      const oddsStr = odds.map(o=>`<span style="color:#c8f542;font-weight:700">${o.name.split(' ').pop()}: ${o.price}</span>`).join(' · ');
      const safeHome = e.home_team.replace(/'/g,"\\'");
      const safeAway = e.away_team.replace(/'/g,"\\'");
      return `<div onclick="selectOddsEvent('${e.id}','${safeHome} vs ${safeAway}','${sportKey}')"
        style="padding:10px 12px;background:#181828;border:1px solid #2a2a40;border-radius:8px;margin-bottom:6px;cursor:pointer;active:border-color:#c8f542">
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">${e.home_team} vs ${e.away_team}</div>
        <div style="font-size:10px;color:#6b6b8a;margin-bottom:5px">${new Date(e.commence_time).toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
        <div style="font-size:11px">${oddsStr||'<span style="color:#6b6b8a">Sin cuotas Bet365</span>'}</div>
      </div>`;
    }).join('');
  } catch(err) {
    resultsDiv.innerHTML = `<div style="color:#ff4d6d;font-size:12px;padding:8px 0">⚠️ ${err.message}</div>`;
  }
}

function selectOddsEvent(id, name, sport) {
  selectedOddsEvent = {id, name, sport};
  document.getElementById('f-title').value = name;
  document.getElementById('odds-results').innerHTML =
    `<div style="padding:8px 12px;background:#c8f54215;border:1px solid #c8f54230;border-radius:8px;font-size:12px;color:#c8f542">✅ ${name}</div>`;
  document.getElementById('odds-monitor-info').style.display = 'block';
}

async function checkOddsChange(bet) {
  if (!bet.oddsEventId || !bet.oddsSport) return;
  try {
    const res = await fetch(`${ODDS_PROXY}?sport=${bet.oddsSport}&markets=h2h&eventId=${bet.oddsEventId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data.length) return;
    const b365 = data[0].bookmakers?.find(b=>b.key==='bet365');
    const outcomes = b365?.markets?.find(m=>m.key==='h2h')?.outcomes || [];
    const prev = bet.lastOddsSnapshot || [];
    let changes = [];
    outcomes.forEach(cur => {
      const old = prev.find(p=>p.name===cur.name);
      if (old && Math.abs(cur.price - old.price) >= 0.05) {
        changes.push(`${cur.name.split(' ').pop()}: ${old.price} → ${cur.price}`);
      }
    });
    if (changes.length) showOddsAlert(bet.title, changes.join(' | '));
    const idx = bets.findIndex(b=>b.id===bet.id);
    if (idx>-1) { bets[idx].lastOddsSnapshot = outcomes.map(o=>({name:o.name,price:o.price})); saveData(); }
  } catch(e) {}
}

function showOddsAlert(title, msg) {
  if ('Notification' in window && Notification.permission==='granted') {
    new Notification(`📊 Cuota cambiada: ${title}`, {body: msg, icon: './icon-192.png'});
  }
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:16px;left:12px;right:12px;background:#7b61ff;color:#fff;padding:14px 16px;border-radius:14px;z-index:9999;font-size:13px;font-weight:600;box-shadow:0 8px 32px #0009;animation:slideUp .3s ease-out';
  el.innerHTML = `📊 Cambio de cuota<br><span style="font-weight:400;font-size:11px">${title}: ${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 7000);
}

function startOddsMonitor() {
  if ('Notification' in window && Notification.permission==='default') Notification.requestPermission();
  if (oddsMonitorInterval) clearInterval(oddsMonitorInterval);
  oddsMonitorInterval = setInterval(() => {
    bets.filter(b=>b.oddsEventId && b.status==='pending').forEach(checkOddsChange);
  }, 3 * 60 * 1000);
}

// Start on load
window.addEventListener('load', () => {
  setTimeout(startOddsMonitor, 3000);
}, {once: true});

