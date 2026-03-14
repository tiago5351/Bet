const ODDS_API_KEY = 'af75e12d290e57478c6b237f21f16a7e';
const ODDS_BASE = 'https://api.the-odds-api.com/v4';
let selectedOddsEvent = null;

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
    const res = await fetch(`${ODDS_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&bookmakers=bet365&oddsFormat=decimal`);
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
}
