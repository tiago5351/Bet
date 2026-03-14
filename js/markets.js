// ─────────────────────────────────────────
//  MERCADO ESTRUCTURADO
// ─────────────────────────────────────────
const COUNTRIES_DIVISIONS = {
  "Argentina": ["Primera División", "Primera Nacional", "Primera B Metropolitana", "Federal A"],
  "España": ["La Liga", "Segunda División", "Primera Federación"],
  "Inglaterra": ["Premier League", "Championship", "League One", "League Two"],
  "Alemania": ["Bundesliga", "2. Bundesliga", "3. Liga"],
  "Italia": ["Serie A", "Serie B", "Serie C"],
  "Francia": ["Ligue 1", "Ligue 2", "National"],
  "Portugal": ["Primeira Liga", "Liga Portugal 2"],
  "Brasil": ["Série A", "Série B", "Série C"],
  "Países Bajos": ["Eredivisie", "Eerste Divisie"],
  "Bélgica": ["Pro League", "Challenger Pro League"],
  "Turquía": ["Süper Lig", "1. Lig"],
  "México": ["Liga MX", "Liga de Expansión MX"],
  "Colombia": ["Liga BetPlay", "Primera B"],
  "Chile": ["Primera División", "Primera B"],
  "Uruguay": ["Primera División", "Segunda División"],
  "Paraguay": ["División Profesional", "División Intermedia"],
  "Bolivia": ["División Profesional"],
  "Perú": ["Liga 1"],
  "Ecuador": ["Liga Pro", "Serie B"],
  "Venezuela": ["Liga FUTVE"],
  "Estados Unidos": ["MLS", "USL Championship", "USL League One"],
  "Champions League": ["Champions League"],
  "Europa League": ["Europa League"],
  "Conference League": ["Conference League"],
  "Copa Libertadores": ["Copa Libertadores"],
  "Copa Sudamericana": ["Copa Sudamericana"],
  "Mundial": ["Mundial", "Clasificatorias"],
  "Eurocopa": ["Eurocopa"],
  "Copa América": ["Copa América"],
  "Rusia": ["Premier League Rusa"],
  "Ucrania": ["Premier League Ucraniana"],
  "Grecia": ["Super League"],
  "Escocia": ["Premiership", "Championship"],
  "Arabia Saudita": ["Saudi Pro League"],
  "Japón": ["J1 League", "J2 League"],
  "China": ["Chinese Super League"],
  "Australia": ["A-League"],
  "Sudáfrica": ["Premier Soccer League"],
};

const MARKET_LABELS = {
  "1x2": "Resultado final (1X2)",
  "doble": "Doble oportunidad",
  "ambos": "Ambos anotan",
  "ou_goles": "Over/Under goles",
  "handicap": "Hándicap",
  "corners": "Corners",
  "tarjetas": "Tarjetas",
  "remates_arco": "Remates al arco",
  "remates_totales": "Remates totales",
  "faltas": "Faltas",
  "prop": "Prop jugador",
  "otro": "Otro"
};

// ─────────────────────────────────────────
//  DATOS TENIS Y BASQUET
// ─────────────────────────────────────────
const TENNIS_COUNTRIES_DIVISIONS = {
  "Internacional": ["ATP Tour", "WTA Tour", "ATP Challengers", "ITF"],
  "Grand Slams": ["Australian Open", "Roland Garros", "Wimbledon", "US Open"],
  "Masters 1000": ["Indian Wells", "Miami", "Monte Carlo", "Madrid", "Roma", "Canadian Open", "Cincinnati", "Shanghai", "Paris"],
  "ATP Finals": ["ATP Finals", "WTA Finals"],
  "Copa Davis": ["Copa Davis"],
  "Billie Jean King Cup": ["Billie Jean King Cup"],
};

const BASKETBALL_COUNTRIES_DIVISIONS = {
  "Estados Unidos": ["NBA", "NBA G League", "NCAA"],
  "Europa": ["Euroliga", "EuroCup"],
  "España": ["ACB Liga Endesa", "LEB Oro"],
  "Italia": ["Lega Basket Serie A", "Serie A2"],
  "Alemania": ["Bundesliga Basketball"],
  "Francia": ["Pro A (Betclic Élite)", "Pro B"],
  "Grecia": ["A1 Ethniki"],
  "Turquía": ["BSL"],
  "Argentina": ["Liga Nacional de Básquet", "TNA"],
  "Australia": ["NBL"],
  "China": ["CBA"],
  "Internacional": ["FIBA World Cup", "Juegos Olímpicos", "AmeriCup", "EuroBasket"],
};

const TENNIS_MARKET_OPTIONS = [
  {value: "ganador_partido", label: "Ganador del partido (1X2)"},
  {value: "handicap_sets", label: "Hándicap sets"},
  {value: "ou_sets", label: "Over/Under sets"},
  {value: "ou_games", label: "Over/Under games"},
  {value: "ganador_set", label: "Ganador de set"},
  {value: "resultado_exacto_sets", label: "Resultado exacto en sets"},
  {value: "primer_set", label: "Ganador primer set"},
  {value: "prop_jugador_tenis", label: "Prop jugador (+/-)"},
  {value: "otro", label: "Otro"},
];

const BASKETBALL_MARKET_OPTIONS = [
  {value: "moneyline", label: "Moneyline (ganador)"},
  {value: "handicap_puntos", label: "Hándicap puntos"},
  {value: "ou_puntos", label: "Over/Under puntos"},
  {value: "ganador_cuarto", label: "Ganador de cuarto"},
  {value: "ganador_mitad", label: "Ganador de primera mitad"},
  {value: "ou_mitad", label: "Over/Under primera mitad"},
  {value: "prop_jugador_basket", label: "Prop jugador (+/-)"},
  {value: "triple_doble", label: "Triple doble / doble doble"},
  {value: "otro", label: "Otro"},
];

const ALL_MARKET_LABELS_EXTRA = {
  "ganador_partido": "Ganador del partido",
  "handicap_sets": "Hándicap sets",
  "ou_sets": "Over/Under sets",
  "ou_games": "Over/Under games",
  "ganador_set": "Ganador de set",
  "resultado_exacto_sets": "Resultado exacto en sets",
  "primer_set": "Ganador primer set",
  "prop_jugador_tenis": "Prop jugador (tenis)",
  "moneyline": "Moneyline (ganador)",
  "handicap_puntos": "Hándicap puntos",
  "ou_puntos": "Over/Under puntos",
  "ganador_cuarto": "Ganador de cuarto",
  "ganador_mitad": "Ganador primera mitad",
  "ou_mitad": "Over/Under primera mitad",
  "prop_jugador_basket": "Prop jugador (básquet)",
  "triple_doble": "Triple doble / doble doble",
};

let currentSport = 'football';

function selectSport(sport) {
  currentSport = sport;
  const sports = ['football', 'tennis', 'basketball'];
  const labels = {football: '⚽ Fútbol', tennis: '🎾 Tenis', basketball: '🏀 Básquet'};
  sports.forEach(s => {
    const btn = document.getElementById('sport-btn-' + s);
    if (!btn) return;
    if (s === sport) {
      btn.style.borderColor = '#c8f542';
      btn.style.background = '#c8f54215';
      btn.style.color = '#c8f542';
    } else {
      btn.style.borderColor = '#2a2a40';
      btn.style.background = 'transparent';
      btn.style.color = '#6b6b8a';
    }
  });

  // Update market options
  const sel = document.getElementById('f-market-type');
  sel.innerHTML = '<option value="">Seleccioná un mercado...</option>';
  let options = [];
  if (sport === 'football') {
    options = [
      {value:'1x2', label:'Resultado final (1X2)'}, {value:'doble', label:'Doble oportunidad'},
      {value:'ambos', label:'Ambos anotan'}, {value:'ou_goles', label:'Over/Under goles'},
      {value:'handicap', label:'Hándicap'}, {value:'corners', label:'Corners'},
      {value:'tarjetas', label:'Tarjetas'}, {value:'remates_arco', label:'Remates al arco'},
      {value:'remates_totales', label:'Remates totales'}, {value:'faltas', label:'Faltas'},
      {value:'prop', label:'Prop jugador (+/-)'}, {value:'otro', label:'Otro'},
    ];
  } else if (sport === 'tennis') {
    options = TENNIS_MARKET_OPTIONS;
  } else if (sport === 'basketball') {
    options = BASKETBALL_MARKET_OPTIONS;
  }
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.value; opt.textContent = o.label;
    sel.appendChild(opt);
  });

  // Reset market selection and prop section
  sel.value = '';
  document.getElementById('f-prop-section').style.display = 'none';
  document.getElementById('f-market-other').style.display = 'none';

  // Reset country/division for new sport
  document.getElementById('f-country').value = '';
  document.getElementById('f-country-suggestions').style.display = 'none';
  document.getElementById('f-division').style.display = 'none';
  document.getElementById('f-division-placeholder').style.display = 'block';
  document.getElementById('f-division-placeholder').placeholder = sport === 'football' ? 'Primero elegí país' : 'Primero elegí categoría';
  document.getElementById('f-country').placeholder = sport === 'football' ? 'Ej: España' : sport === 'tennis' ? 'Ej: Grand Slams' : 'Ej: Estados Unidos';
}

function onMarketTypeChange() {
  const val = document.getElementById('f-market-type').value;
  const isProp = val === 'prop' || val === 'prop_jugador_tenis' || val === 'prop_jugador_basket';
  document.getElementById('f-prop-section').style.display = isProp ? 'block' : 'none';
  document.getElementById('f-market-other').style.display = val === 'otro' ? 'block' : 'none';

  // Update prop stats options based on sport/market
  const propTypeSelect = document.getElementById('f-prop-type');
  if (val === 'prop_jugador_tenis') {
    propTypeSelect.innerHTML = `
      <option value="aces">Aces</option>
      <option value="dobles_faltas">Dobles faltas</option>
      <option value="games_ganados">Games ganados</option>
      <option value="sets_ganados">Sets ganados</option>
      <option value="break_points">Break points convertidos</option>
      <option value="winners">Winners</option>
      <option value="errores_no_forzados">Errores no forzados</option>
    `;
  } else if (val === 'prop_jugador_basket') {
    propTypeSelect.innerHTML = `
      <option value="puntos">Puntos</option>
      <option value="rebotes">Rebotes</option>
      <option value="asistencias">Asistencias</option>
      <option value="puntos_rebotes">Puntos + Rebotes</option>
      <option value="puntos_asistencias">Puntos + Asistencias</option>
      <option value="puntos_rebotes_asistencias">Pts + Reb + Ast</option>
      <option value="robos">Robos</option>
      <option value="bloqueos">Bloqueos</option>
      <option value="triples">Triples convertidos</option>
      <option value="doble_doble">Doble doble</option>
      <option value="triple_doble_prop">Triple doble</option>
    `;
  } else {
    propTypeSelect.innerHTML = `
      <option value="goles">Goles</option>
      <option value="asistencias">Asistencias</option>
      <option value="remates_totales">Remates totales</option>
      <option value="remates_arco">Remates al arco</option>
      <option value="pases">Pases</option>
      <option value="faltas_recibidas">Faltas recibidas</option>
      <option value="faltas_cometidas">Faltas cometidas</option>
      <option value="tarjetas">Tarjetas</option>
    `;
  }
}

function onCountryInput() {
  const input = document.getElementById('f-country').value.trim().toLowerCase();
  const suggestionsEl = document.getElementById('f-country-suggestions');

  if (!input) {
    suggestionsEl.style.display = 'none';
    return;
  }

  const dict = currentSport === 'tennis' ? TENNIS_COUNTRIES_DIVISIONS
             : currentSport === 'basketball' ? BASKETBALL_COUNTRIES_DIVISIONS
             : COUNTRIES_DIVISIONS;

  const matches = Object.keys(dict).filter(c =>
    c.toLowerCase().includes(input)
  ).slice(0, 6);

  if (matches.length === 0) {
    suggestionsEl.style.display = 'none';
    return;
  }

  suggestionsEl.innerHTML = matches.map(c =>
    `<div onclick="selectCountry('${c}')" style="padding:10px 14px;cursor:pointer;font-size:14px;border-bottom:1px solid #2a2a40;transition:background 0.1s" onmouseover="this.style.background='#2a2a40'" onmouseout="this.style.background=''">${c}</div>`
  ).join('');
  suggestionsEl.style.display = 'block';
}

function selectCountry(country) {
  document.getElementById('f-country').value = country;
  document.getElementById('f-country-suggestions').style.display = 'none';

  const dict = currentSport === 'tennis' ? TENNIS_COUNTRIES_DIVISIONS
             : currentSport === 'basketball' ? BASKETBALL_COUNTRIES_DIVISIONS
             : COUNTRIES_DIVISIONS;

  const divisions = dict[country] || [];
  const divisionSelect = document.getElementById('f-division');
  const divisionPlaceholder = document.getElementById('f-division-placeholder');

  divisionSelect.innerHTML = '<option value="">Seleccioná división...</option>' + 
    divisions.map(d => `<option value="${d}">${d}</option>`).join('');
  divisionSelect.style.display = 'block';
  divisionPlaceholder.style.display = 'none';
}

function buildMarketString() {
  const type = document.getElementById('f-market-type').value;
  if (!type) return '';
  
  let market = MARKET_LABELS[type] || type;
  
  if (type === 'prop') {
    const propType = document.getElementById('f-prop-type').value;
    const propLine = document.getElementById('f-prop-line').value;
    const player = document.getElementById('f-prop-player').value.trim();
    const propLabels = {
      goles: 'goles', asistencias: 'asistencias', remates_totales: 'remates totales',
      remates_arco: 'remates al arco', pases: 'pases',
      faltas_recibidas: 'faltas recibidas', faltas_cometidas: 'faltas cometidas', tarjetas: 'tarjetas'
    };
    if (player) market = player;
    if (propLine) market += ` +${propLine}`;
    if (propType) market += ` ${propLabels[propType] || propType}`;
  } else if (type === 'otro') {
    market = document.getElementById('f-market-text').value.trim() || 'Otro';
  }
  
  const country = document.getElementById('f-country').value.trim();
  const division = document.getElementById('f-division').value;
  
  return JSON.stringify({ type, market, sport: currentSport || 'football', country: country || null, division: division || null });
}

function resetMarketForm() {
  selectSport('football');
  document.getElementById('f-market-type').value = '';
  document.getElementById('f-prop-section').style.display = 'none';
  document.getElementById('f-market-other').style.display = 'none';
  document.getElementById('f-prop-player').value = '';
  document.getElementById('f-prop-line').value = '';
  document.getElementById('f-country').value = '';
  document.getElementById('f-country-suggestions').style.display = 'none';
  document.getElementById('f-division').style.display = 'none';
  document.getElementById('f-division-placeholder').style.display = 'block';
  document.getElementById('f-market-text').value = '';
}

function loadMarketForm(marketStr) {
  if (!marketStr) return;
  try {
    const m = JSON.parse(marketStr);
    if (m.sport && m.sport !== 'football') {
      selectSport(m.sport);
    } else {
      selectSport('football');
    }
    document.getElementById('f-market-type').value = m.type || '';
    onMarketTypeChange();
    if (m.type === 'prop' && m.market) {
      // parse player/line back - best effort
    }
    if (m.type === 'otro') {
      document.getElementById('f-market-text').value = m.market || '';
    }
    if (m.country) {
      document.getElementById('f-country').value = m.country;
      selectCountry(m.country);
      if (m.division) document.getElementById('f-division').value = m.division;
    }
  } catch(e) {
    // legacy string market - just ignore
  }
}


function getMarketDisplay(marketStr) {
  if (!marketStr) return null;
  try {
    const m = JSON.parse(marketStr);
    let label = m.market || MARKET_LABELS[m.type] || ALL_MARKET_LABELS_EXTRA[m.type] || marketStr;
    if (m.division) label += ' · ' + m.division;
    else if (m.country) label += ' · ' + m.country;
    return label;
  } catch(e) {
    return marketStr; // legacy string
  }
}

function getMarketType(marketStr) {
  if (!marketStr) return null;
  try { return JSON.parse(marketStr).type; } catch(e) { return null; }
}

function getMarketCountry(marketStr) {
  if (!marketStr) return null;
  try { return JSON.parse(marketStr).country; } catch(e) { return null; }
}

function getMarketDivision(marketStr) {
  if (!marketStr) return null;
  try { return JSON.parse(marketStr).division; } catch(e) { return null; }
}


