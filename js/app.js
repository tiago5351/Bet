// ─────────────────────────────────────────
//  SUPABASE
// ─────────────────────────────────────────
const SUPABASE_URL = 'https://zbboirdvymhpkamsnhov.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HPulhY2EIuMdj6yqCHL71w_goj6UGQT';
let sb;
try {
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch(e) {
  console.error('Supabase init error:', e);
}
let currentUser = null;

// ─────────────────────────────────────────
//  AUTH UI
// ─────────────────────────────────────────
let authMode = 'login';
function showAuthTab(mode) {
  authMode = mode;
  document.getElementById('tab-login').style.background = mode==='login' ? '#c8f542' : 'transparent';
  document.getElementById('tab-login').style.color = mode==='login' ? '#080810' : '#6b6b8a';
  document.getElementById('tab-register').style.background = mode==='register' ? '#c8f542' : 'transparent';
  document.getElementById('tab-register').style.color = mode==='register' ? '#080810' : '#6b6b8a';
  document.getElementById('auth-btn').textContent = mode==='login' ? 'Entrar' : 'Crear cuenta';
  document.getElementById('auth-forgot').style.display = mode==='login' ? 'block' : 'none';
  document.getElementById('auth-verify-msg').style.display = 'none';
  document.getElementById('auth-error').style.display = 'none';
}

async function handleAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const btn = document.getElementById('auth-btn');
  const errEl = document.getElementById('auth-error');
  errEl.style.display = 'none';
  if (!email || !password) { showAuthError('Completá email y contraseña'); return; }
  btn.textContent = '...';
  btn.disabled = true;
  try {
    if (authMode === 'register') {
      const {error} = await sb.auth.signUp({email, password});
      if (error) throw error;
      document.getElementById('auth-verify-msg').style.display = 'block';
      btn.textContent = 'Crear cuenta';
    } else {
      const {error} = await sb.auth.signInWithPassword({email, password});
      if (error) throw error;

      location.reload();
    }
  } catch(e) {
    showAuthError(e.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : e.message);
  }
  btn.disabled = false;
  btn.textContent = authMode==='login' ? 'Entrar' : 'Crear cuenta';
}

async function handleForgot() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email) { showAuthError('Ingresá tu email primero'); return; }
  await sb.auth.resetPasswordForEmail(email);
  showAuthError('✅ Te mandamos un email para resetear tu contraseña', true);
}

function showAuthError(msg, isOk=false) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.background = isOk ? '#c8f54215' : '#ff4d6d20';
  el.style.borderColor = isOk ? '#c8f54230' : '#ff4d6d40';
  el.style.color = isOk ? '#c8f542' : '#ff4d6d';
  el.style.display = 'block';
}

async function handleLogout() {
  await sb.auth.signOut();
  accounts = []; bets = [];
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

// allow Enter key on auth inputs
document.getElementById('auth-password').addEventListener('keydown', e => { if(e.key==='Enter') handleAuth(); });
document.getElementById('auth-email').addEventListener('keydown', e => { if(e.key==='Enter') handleAuth(); });

// ─────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────
const COLORS = ['#c8f542','#7b61ff','#ff4d6d','#ffb703','#00d2ff','#ff6b35','#e040fb','#00e676'];
let accounts = [];
let bets = [];
let currentTab = 'calendar';
let currentAccountFilter = 'all';
let currentStatusFilter = 'all';
let selectedStatus = 'pending';
let editingBetId = null;
let newBetPhotos = [];
let selectedColor = COLORS[0];
let calYear, calMonth, selectedCalDay;

// ─────────────────────────────────────────
//  CLOUD SAVE/LOAD
// ─────────────────────────────────────────
async function saveData() {
  if (!currentUser) return;
  await sb.from('userdata').upsert({
    user_id: currentUser.id,
    accounts: JSON.stringify(accounts),
    bets: JSON.stringify(bets),
    updated_at: new Date().toISOString()
  }, {onConflict: 'user_id'});
}

async function loadData() {
  if (!currentUser) return;
  const {data} = await sb.from('userdata').select('*').eq('user_id', currentUser.id).single();
  if (data) {
    try { accounts = JSON.parse(data.accounts || '[]'); } catch(e) { accounts = []; }
    try { bets = JSON.parse(data.bets || '[]'); } catch(e) { bets = []; }
  }
}

// ─────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────
function initApp() {
  const now = new Date();
  calYear = now.getFullYear(); calMonth = now.getMonth();
  selectedCalDay = now.toISOString().slice(0,10);
  document.getElementById('header-right').textContent = now.toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'});
  buildColorPicker();
  updateAccountPills();
  populateAccountSelect();
  renderTab();
  checkDailyPending();
  setTimeout(scheduleAllNotifications, 2000);
}

// ── CAMBIO 1: nuevo bloque window.addEventListener('load') ──
window.addEventListener('load', async () => {

  document.getElementById('auth-screen').style.display = 'none';

  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
  } else {

    currentUser = session.user;

    await loadData();

    let canAccess = true;

    try {
      const paywallPromise = checkPaywall();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      canAccess = await Promise.race([paywallPromise, timeoutPromise]);

    } catch(e) {

      const isAdmin = currentUser?.email === 'tiagoblatter@gmail.com';
      const createdAt = new Date(currentUser.created_at);
      const days = (Date.now() - createdAt) / (1000*60*60*24);

      canAccess = isAdmin || days <= 7;
    }

    if (!canAccess) {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('paywall-screen').style.display = 'flex';
      return;
    }

    document.getElementById('splash').style.opacity = 0;

    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').classList.add('visible');
      initApp();
    }, 400);
  }

  // escuchar cambios de sesión después
  sb.auth.onAuthStateChange((event, session) => {

    if (!session) {

      currentUser = null;
      accounts = [];
      bets = [];

      document.getElementById('app').classList.remove('visible');
      document.getElementById('auth-screen').style.display = 'flex';
    }

  });

});

async function checkPaywall() {
  if (!currentUser) return false;
  const isAdmin = currentUser.email === "tiagoblatter@gmail.com";
  if (isAdmin) return true;
  const createdAt = new Date(currentUser.created_at);
  const days = (Date.now() - createdAt) / (1000*60*60*24);
  if (days <= 7) return true;
  try {
    const r = await fetch("https://bet-beryl.vercel.app/api/check-subscription", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({user_id: currentUser.id})
    });
    const {active} = await r.json();
    return active;
  } catch(e) { return true; }
}

async function handleSubscribe() {
  try {
    const r = await fetch("https://bet-beryl.vercel.app/api/create-subscription", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({user_id: currentUser.id, email: currentUser.email})
    });
    const {init_point} = await r.json();
    if (init_point) window.location.href = init_point;
  } catch(e) { alert("Error al iniciar pago. Intentá de nuevo."); }
}


// ─────────────────────────────────────────
//  KELLY TAB
// ─────────────────────────────────────────
function renderKelly(main) {
  const bankroll = parseFloat(localStorage.getItem('bt_bankroll') || '0');
  const closedBets = bets.filter(b=>b.status!=='pending'&&b.status!=='cancelled');
  const winRate = closedBets.filter(b=>b.status==='won').length / Math.max(closedBets.length, 1);
  const avgOdds = bets.length ? bets.reduce((s,b)=>s+(parseFloat(b.odds)||1.8),0)/bets.length : 1.8;

  main.innerHTML = `
    <div style="padding:4px 0 20px">
      <div style="font-size:11px;color:#c8f542;letter-spacing:0.1em;margin-bottom:4px">// GESTIÓN DE BANKROLL</div>
      <h2 style="font-family:'Outfit',sans-serif;font-size:24px;font-weight:800;margin-bottom:4px">Quarter Kelly</h2>
      <p style="color:#6b6b8a;font-size:13px;line-height:1.5">Sistema conservador para calcular tu stake óptimo por apuesta y proteger tu bankroll.</p>
    </div>

    <!-- Bankroll input -->
    <div style="background:#10101c;border:1px solid #2a2a40;border-radius:16px;padding:20px;margin-bottom:16px">
      <div style="font-size:11px;color:#6b6b8a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Tu bankroll actual</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="color:#6b6b8a;font-size:18px">$</span>
        <input id="bankroll-input" type="number" value="${bankroll||''}" placeholder="Ej: 50000"
          style="flex:1;background:transparent;border:none;outline:none;color:#f0f0ff;font-size:24px;font-weight:700;font-family:'Outfit',sans-serif"
          oninput="saveBankroll(this.value)">
        <span style="color:#6b6b8a;font-size:13px">ARS</span>
      </div>
    </div>

    <!-- Stats from history -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:#10101c;border:1px solid #2a2a40;border-radius:14px;padding:16px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#c8f542">${(winRate*100).toFixed(0)}%</div>
        <div style="font-size:11px;color:#6b6b8a;margin-top:2px">Win rate histórico</div>
      </div>
      <div style="background:#10101c;border:1px solid #2a2a40;border-radius:14px;padding:16px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#7b61ff">${avgOdds.toFixed(2)}</div>
        <div style="font-size:11px;color:#6b6b8a;margin-top:2px">Cuota promedio</div>
      </div>
    </div>

    <!-- Calculator -->
    <div style="background:#10101c;border:1px solid #2a2a40;border-radius:16px;padding:20px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:16px">Calculá tu stake</div>
      
      <div style="margin-bottom:16px">
        <div style="font-size:11px;color:#6b6b8a;margin-bottom:6px">CUOTA DE LA APUESTA</div>
        <input id="k-odds" type="number" step="0.01" placeholder="Ej: 2.10" value=""
          style="width:100%;background:#181828;border:1px solid #2a2a40;border-radius:10px;padding:12px;color:#f0f0ff;font-size:16px;outline:none;font-family:'Outfit',sans-serif"
          oninput="updateKellyResult()">
        <div id="implied-prob" style="font-size:12px;color:#6b6b8a;margin-top:6px;padding:6px 10px;background:#181828;border-radius:8px;display:none"></div>
      </div>

      <div id="kelly-result" style="background:#c8f54210;border:1px solid #c8f54230;border-radius:12px;padding:16px;text-align:center">
        <div style="font-size:11px;color:#c8f542;margin-bottom:4px">STAKE SUGERIDO (QUARTER KELLY)</div>
        <div id="kelly-amount" style="font-size:32px;font-weight:800;font-family:'Outfit',sans-serif;color:#c8f542">-</div>
        <div id="kelly-pct" style="font-size:12px;color:#6b6b8a;margin-top:2px">del bankroll</div>
      </div>
    </div>

    <!-- Explanation -->
    <div style="background:#7b61ff10;border:1px solid #7b61ff30;border-radius:14px;padding:16px;margin-bottom:20px">
      <div style="font-size:13px;font-weight:700;color:#a89cff;margin-bottom:8px">¿Qué es Quarter Kelly?</div>
      <div style="font-size:13px;color:#6b6b8a;line-height:1.6">
        Kelly completo maximiza el crecimiento pero es agresivo. Quarter Kelly usa el 25% del stake calculado — más conservador, reduce el riesgo de ruina bancaria manteniendo crecimiento sostenido.
        <br><br>
        <span style="color:#f0f0ff">Fórmula: stake = ((p × cuota − 1) ÷ (cuota − 1)) × 0.25 × bankroll</span>
      </div>
    </div>
  `;
  updateKellyResult();
}

function saveBankroll(val) {
  localStorage.setItem('bt_bankroll', val);
  updateKellyResult();
}

function updateKellyResult() {
  const bankroll = parseFloat(document.getElementById('bankroll-input')?.value || localStorage.getItem('bt_bankroll') || 0);
  const odds = parseFloat(document.getElementById('k-odds')?.value || 0);
  // Probability derived automatically from odds (implied probability)
  const prob = odds > 1 ? (1 / odds) : 0;
  const amountEl = document.getElementById('kelly-amount');
  const pctEl = document.getElementById('kelly-pct');
  if (!amountEl) return;

  // Show implied probability
  const impliedEl = document.getElementById('implied-prob');
  if (impliedEl && odds > 1) {
    impliedEl.style.display = 'block';
    impliedEl.textContent = `Probabilidad implícita: ${(prob*100).toFixed(1)}% — calculada automáticamente desde la cuota`;
  } else if (impliedEl) {
    impliedEl.style.display = 'none';
  }

  if (!bankroll || !odds || !prob || odds <= 1) {
    amountEl.textContent = '-';
    pctEl.textContent = 'del bankroll';
    return;
  }

  const b = odds - 1;
  const f = ((prob * (b + 1) - 1) / b) * 0.25;
  if (f <= 0) {
    amountEl.textContent = '$0';
    amountEl.style.color = '#ff4d6d';
    pctEl.textContent = 'No apostes — edge negativo';
    document.getElementById('kelly-result').style.background = '#ff4d6d10';
    document.getElementById('kelly-result').style.borderColor = '#ff4d6d30';
    return;
  }

  const stake = f * bankroll;
  const pct = (f * 100).toFixed(1);
  amountEl.textContent = '$' + Math.round(stake).toLocaleString('es-AR');
  amountEl.style.color = '#c8f542';
  pctEl.textContent = pct + '% del bankroll';
  document.getElementById('kelly-result').style.background = '#c8f54210';
  document.getElementById('kelly-result').style.borderColor = '#c8f54230';
}



//  TABS
// ─────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  ['calendar','bets','stats','accounts','kelly'].forEach(t => {
    const el = document.getElementById('tab-'+t);
    if (el) el.classList.toggle('active', t===tab);
  });
  document.getElementById('fab-btn').style.display = (tab==='stats' || tab==='kelly') ? 'none' : 'flex';
  renderTab();
}

function renderTab() {
  const main = document.getElementById('main-content');
  if (currentTab === 'calendar') renderCalendar(main);
  else if (currentTab === 'bets') renderBets(main);
  else if (currentTab === 'stats') renderStatsTab(main);
  else if (currentTab === 'kelly') renderKelly(main);
  else renderAccounts(main);
}

// ─────────────────────────────────────────
//  ACCOUNT FILTER
// ─────────────────────────────────────────
function filterAccount(id, el) {
  currentAccountFilter = id;
  document.querySelectorAll('#account-pills .pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  renderTab();
}

function updateAccountPills() {
  const pills = document.getElementById('account-pills');
  pills.innerHTML = `<button class="pill ${currentAccountFilter==='all'?'active':''}" data-acc="all" onclick="filterAccount('all',this)">Todas</button>`;
  accounts.forEach(a => {
    pills.innerHTML += `<button class="pill ${currentAccountFilter===a.id?'active':''}" data-acc="${a.id}" onclick="filterAccount('${a.id}',this)" style="${currentAccountFilter===a.id?`background:${a.color};border-color:${a.color};color:#080810`:''}">${a.name}</button>`;
  });
}

// ─────────────────────────────────────────
//  CALENDAR TAB
// ─────────────────────────────────────────
function renderCalendar(container) {
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const today = new Date().toISOString().slice(0,10);
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth+1, 0);
  let startDow = firstDay.getDay(); // 0=sun
  // shift to mon-based
  startDow = (startDow + 6) % 7;

  // days with bets
  const betsThisMonth = filteredBets().filter(b => b.date && b.date.startsWith(`${calYear}-${String(calMonth+1).padStart(2,'0')}`));
  const daysWithBets = new Set(betsThisMonth.map(b=>b.date));

  let grid = '';
  ['L','M','X','J','V','S','D'].forEach(d => { grid += `<div class="cal-day-name">${d}</div>`; });
  // prev month padding
  const prevLast = new Date(calYear, calMonth, 0).getDate();
  for (let i=startDow-1; i>=0; i--) {
    grid += `<div class="cal-day other-month">${prevLast-i}</div>`;
  }
  for (let d=1; d<=lastDay.getDate(); d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayBets = filteredBets().filter(b=>b.date===dateStr);
    const isToday = dateStr===today;
    const isSel = dateStr===selectedCalDay;
    const cls = ['cal-day', isToday?'today':'', isSel?'selected':''].join(' ');

    // dots per bet
    let dotsHtml = '';
    if (dayBets.length) {
      const dotColors = {pending:'#ffb703', won:'#c8f542', lost:'#ff4d6d', cancelled:'#6b6b8a'};
      const dots = dayBets.slice(0,5).map(b =>
        `<div style="width:5px;height:5px;border-radius:50%;background:${isSel?'#080810':dotColors[b.status]||'#6b6b8a'};flex-shrink:0"></div>`
      ).join('');
      dotsHtml = `<div style="display:flex;gap:2px;justify-content:center;flex-wrap:wrap;margin-top:2px;max-width:30px">${dots}${dayBets.length>5?'<div style="font-size:7px;color:'+(isSel?'#080810':'#6b6b8a')+'">+</div>':''}</div>`;
    }

    grid += `<div class="${cls}" onclick="selectDay('${dateStr}')" style="flex-direction:column;gap:1px">
      <span>${d}</span>
      ${dotsHtml}
    </div>`;
  }
  // next month fill
  const total = startDow + lastDay.getDate();
  const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d=1; d<=rem; d++) { grid += `<div class="cal-day other-month">${d}</div>`; }

  // day bets
  const dayBets = filteredBets().filter(b=>b.date===selectedCalDay);
  const selLabel = new Date(selectedCalDay+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});

  let dayBetsHtml = '';
  if (dayBets.length === 0) {
    dayBetsHtml = `<div class="empty" style="padding:30px 0"><div class="empty-icon">🎯</div><div class="empty-title">Sin apuestas</div><div class="empty-sub">No hay apuestas para este día</div></div>`;
  } else {
    dayBets.forEach(b => { dayBetsHtml += buildBetCard(b); });
  }

  container.innerHTML = `
    <div class="cal-month-header">
      <button class="cal-nav" onclick="calNav(-1)">‹</button>
      <div class="cal-month-label">${monthNames[calMonth]} ${calYear}</div>
      <button class="cal-nav" onclick="calNav(1)">›</button>
    </div>
    <div class="calendar-grid">${grid}</div>
    <div style="font-family:var(--font-head);font-weight:700;font-size:14px;margin-bottom:12px;text-transform:capitalize">${selLabel}</div>
    ${dayBetsHtml}
  `;
}

function calNav(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth=0; calYear++; }
  if (calMonth < 0) { calMonth=11; calYear--; }
  renderTab();
}
function selectDay(d) { selectedCalDay=d; renderTab(); }

// ─────────────────────────────────────────
//  BETS TAB
// ─────────────────────────────────────────
function filteredBets() {
  if (currentAccountFilter === 'all') return bets;
  return bets.filter(b=>b.accountId===currentAccountFilter);
}

function setStatusFilter(k) {
  currentStatusFilter = k;
  renderTab();
}


//  ACCOUNTS TAB
// ─────────────────────────────────────────
function renderAccounts(container) {
  if (accounts.length === 0) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">🏦</div><div class="empty-title">Sin cuentas</div><div class="empty-sub">Crea tu primera cuenta de apuestas</div></div>`;
    return;
  }
  let html = `<div class="section-title">Mis Cuentas</div><div class="section-sub">${accounts.length} cuenta${accounts.length!==1?'s':''} registrada${accounts.length!==1?'s':''}</div>`;
  accounts.forEach(a => {
    const ab = bets.filter(b=>b.accountId===a.id);
    const won = ab.filter(b=>b.status==='won').length;
    const pnl = ab.reduce((s,b)=>s+getBetProfit(b),0);
    html += `
      <div class="account-card" onclick="filterAccount('${a.id}', document.querySelector('[data-acc=\\'${a.id}\\']') || document.querySelector('[data-acc]'));switchTab('bets')">
        <div class="account-avatar" style="background:${a.color}20;color:${a.color}">${a.name.slice(0,2).toUpperCase()}</div>
        <div class="account-info">
          <div class="account-name">${a.name}</div>
          <div class="account-meta">${a.user ? `<span style="color:${a.color}">${a.user}</span> · ` : ''}${ab.length} apuesta${ab.length!==1?'s':''} · P&L: <span style="color:${pnl>=0?'#c8f542':'#ff4d6d'}">${pnl>=0?'+':''}$${Math.abs(pnl).toFixed(0)}</span></div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <div class="account-badge">${won}✓</div>
          <button onclick="event.stopPropagation();deleteAccount('${a.id}')" style="background:none;border:none;color:#6b6b8a;font-size:11px;cursor:pointer">Eliminar</button>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

// ─────────────────────────────────────────
//  ADD / EDIT BET
// ─────────────────────────────────────────
function openAddModal() {
  if (accounts.length === 0) {
    alert('Primero crea una cuenta de apuestas en la pestaña Cuentas');
    switchTab('accounts');
    return;
  }
  if (currentTab === 'accounts') { openAccountModal(); return; }
  editingBetId = null;
  newBetPhotos = [];
  selectedOddsEvent = null;
  selectedStatus = 'pending';
  document.getElementById('modal-add-title').textContent = 'Nueva Apuesta';
  document.getElementById('f-title').value = '';
  resetMarketForm();
  document.getElementById('f-date').value = selectedCalDay || new Date().toISOString().slice(0,10);
  document.getElementById('f-time').value = '';
  document.getElementById('f-amount').value = '';
  document.getElementById('f-odds').value = '';
  document.getElementById('f-real-profit').value = '';
  document.getElementById('f-notes').value = '';
  document.getElementById('photo-previews').innerHTML = '';
  document.getElementById('odds-results').innerHTML = '';
  document.getElementById('odds-monitor-info').style.display = 'none';
  populateAccountSelect();
  updateStatusBtns();
  document.getElementById('modal-add').classList.add('open');
}

function editBet(id) {
  const b = bets.find(x=>x.id===id);
  if (!b) return;
  editingBetId = id;
  newBetPhotos = [...(b.photos||[])];
  selectedStatus = b.status || 'pending';
  document.getElementById('modal-add-title').textContent = 'Editar Apuesta';
  document.getElementById('f-title').value = b.title||'';
  loadMarketForm(b.market||'');
  document.getElementById('f-date').value = b.date||'';
  document.getElementById('f-time').value = b.time||'';
  document.getElementById('f-amount').value = b.amount||'';
  document.getElementById('f-odds').value = b.odds||'';
  document.getElementById('f-real-profit').value = b.realProfit||'';
  document.getElementById('f-notes').value = b.notes||'';
  document.getElementById('odds-results').innerHTML = '';
  document.getElementById('odds-monitor-info').style.display = b.oddsEventId ? 'block' : 'none';
  populateAccountSelect(b.accountId);
  updateStatusBtns();
  renderPhotoPreviews();
  document.getElementById('modal-add').classList.add('open');
}

function saveBet() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { document.getElementById('f-title').focus(); return; }
  const bet = {
    id: editingBetId || uid(),
    title,
    market: buildMarketString(),
    accountId: document.getElementById('f-account').value,
    date: document.getElementById('f-date').value,
    time: document.getElementById('f-time').value,
    amount: document.getElementById('f-amount').value,
    odds: document.getElementById('f-odds').value,
    realProfit: document.getElementById('f-real-profit').value,
    oddsEventId: selectedOddsEvent ? selectedOddsEvent.id : (editingBetId ? (bets.find(b=>b.id===editingBetId)||{}).oddsEventId : null),
    oddsSport: selectedOddsEvent ? selectedOddsEvent.sport : (editingBetId ? (bets.find(b=>b.id===editingBetId)||{}).oddsSport : null),
    status: selectedStatus,
    notes: document.getElementById('f-notes').value.trim(),
    photos: [...newBetPhotos],
    created: editingBetId ? (bets.find(b=>b.id===editingBetId)||{}).created||Date.now() : Date.now(),
    updated: Date.now()
  };
  if (editingBetId) { const idx=bets.findIndex(b=>b.id===editingBetId); if(idx>-1) bets[idx]=bet; }
  else bets.unshift(bet);
  saveData();
  scheduleAllNotifications();
  closeModal('modal-add');
  if (bet.date) { selectedCalDay=bet.date; calMonth=parseInt(bet.date.split('-')[1])-1; calYear=parseInt(bet.date.split('-')[0]); }
  renderTab();
  // Add to iPhone Calendar if date and time provided
  if (bet.date && bet.time && !editingBetId) {
    addToCalendar(bet);
  }
}

function addToCalendar(bet) {
  if (!bet.date) { alert('Esta apuesta no tiene fecha asignada.'); return; }
  const acc = accounts.find(a=>a.id===bet.accountId);
  const accName = acc ? acc.name : '';
  const market = bet.market ? ` — ${getMarketDisplay(bet.market)}` : '';
  const title = encodeURIComponent(`🎯 ${bet.title}${market}`);
  const notes = encodeURIComponent(`Cuenta: ${accName}\nMercado: ${getMarketDisplay(bet.market)||'-'}\nMonto: $${bet.amount||0}\nCuota: ${bet.odds||'-'}\nPotencial: $${((parseFloat(bet.amount)||0)*(parseFloat(bet.odds)||1)).toFixed(2)}\n\n${bet.notes||''}`);

  if (bet.time) {
    // Use calshow: URL scheme — opens Apple Calendar directly from PWA
    const dt = new Date(`${bet.date}T${bet.time}:00`);
    const timestamp = Math.floor(dt.getTime() / 1000);
    window.location.href = `calshow:${timestamp}`;
    // Also show reminder with Web Notifications as fallback
    setTimeout(() => {
      alert(`Recordatorio guardado ✅\n\n📅 ${bet.date} a las ${bet.time}\n🎯 ${bet.title}\n${bet.market ? '📊 '+getMarketDisplay(bet.market) : ''}\n\nSi no se abrió el Calendario, agrega el evento manualmente.`);
    }, 500);
  } else {
    // No time — just open Calendar app
    window.location.href = 'calshow:';
    setTimeout(() => {
      alert(`Abre el Calendario y agrega manualmente:\n\n📅 Fecha: ${bet.date}\n🎯 ${bet.title}\n${bet.market ? '📊 '+getMarketDisplay(bet.market) : ''}`);
    }, 500);
  }
}

function deleteBet(id) {
  if (!confirm('¿Eliminar esta apuesta?')) return;
  bets = bets.filter(b=>b.id!==id);
  saveData();
  renderTab();
}

function quickStatus(id) {
  const b = bets.find(x=>x.id===id);
  if (!b) return;
  const opts = ['pending','won','lost','cancelled'];
  const labels = ['⏳ Pendiente','✅ Ganada','❌ Perdida','🚫 Nula'];
  const cur = opts.indexOf(b.status);
  b.status = opts[(cur+1)%opts.length];
  saveData();
  renderTab();
}

// ─────────────────────────────────────────
//  STATUS
// ─────────────────────────────────────────
function selectStatus(s) {
  selectedStatus = s;
  updateStatusBtns();
}
function updateStatusBtns() {
  document.querySelectorAll('.status-opt').forEach(btn => {
    const s = btn.dataset.s;
    btn.className = 'status-opt' + (s===selectedStatus ? ` sel-${s}` : '');
  });
}

// ─────────────────────────────────────────
//  PHOTOS
// ─────────────────────────────────────────
function handlePhotoUpload(e) {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => { newBetPhotos.push(ev.target.result); renderPhotoPreviews(); };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function renderPhotoPreviews() {
  const grid = document.getElementById('photo-previews');
  grid.innerHTML = newBetPhotos.map((p,i) =>
    `<div class="photo-preview-wrap">
      <img class="photo-preview-img" src="${p}" onclick="viewImg('${p}')">
      <button class="photo-preview-del" onclick="removePhoto(${i})">✕</button>
    </div>`
  ).join('');
}

function removePhoto(i) { newBetPhotos.splice(i,1); renderPhotoPreviews(); }

function addPhotoToBet(id) {
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='image/*'; inp.multiple=true;
  inp.onchange = e => {
    const b = bets.find(x=>x.id===id);
    if (!b) return;
    if (!b.photos) b.photos=[];
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => { b.photos.push(ev.target.result); saveData(); renderTab(); };
      reader.readAsDataURL(file);
    });
  };
  inp.click();
}

function viewImg(src) {
  document.getElementById('img-viewer-src').src = src;
  document.getElementById('img-viewer').classList.add('open');
}
function closeImgViewer() { document.getElementById('img-viewer').classList.remove('open'); }

// ─────────────────────────────────────────
//  ACCOUNTS
// ─────────────────────────────────────────
function openAccountModal() {
  document.getElementById('acc-name').value='';
  document.getElementById('acc-user').value='';
  selectedColor = COLORS[0];
  document.querySelectorAll('.color-dot').forEach(d => d.classList.toggle('selected', d.dataset.c===selectedColor));
  document.getElementById('modal-account').classList.add('open');
}

function saveAccount() {
  const name = document.getElementById('acc-name').value.trim();
  if (!name) { document.getElementById('acc-name').focus(); return; }
  accounts.push({ id:uid(), name, user:document.getElementById('acc-user').value.trim(), color:selectedColor, created:Date.now() });
  saveData();
  updateAccountPills();
  populateAccountSelect();
  closeModal('modal-account');
  renderTab();
}

function deleteAccount(id) {
  if (!confirm('¿Eliminar esta cuenta y todas sus apuestas?')) return;
  accounts = accounts.filter(a=>a.id!==id);
  bets = bets.filter(b=>b.accountId!==id);
  saveData();
  if (currentAccountFilter===id) currentAccountFilter='all';
  updateAccountPills();
  renderTab();
}

function populateAccountSelect(selId) {
  const sel = document.getElementById('f-account');
  sel.innerHTML = accounts.map(a => `<option value="${a.id}" ${a.id===selId?'selected':''}>${a.name}</option>`).join('');
}

function buildColorPicker() {
  const cp = document.getElementById('color-picker');
  cp.innerHTML = COLORS.map(c =>
    `<div class="color-dot ${c===selectedColor?'selected':''}" data-c="${c}" style="background:${c}" onclick="pickColor('${c}')"></div>`
  ).join('');
}

function pickColor(c) {
  selectedColor = c;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.toggle('selected', d.dataset.c===c));
}

// ─────────────────────────────────────────
//  MODAL
// ─────────────────────────────────────────
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
document.querySelectorAll('.modal-overlay').forEach(mo => {
  mo.addEventListener('click', e => { if (e.target===mo) mo.classList.remove('open'); });
});

// FAB behavior per tab
document.getElementById('fab-btn').addEventListener('click', () => {
  if (currentTab==='accounts') openAccountModal();
  else openAddModal();
});

// ─────────────────────────────────────────
//  SERVICE WORKER
// ─────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

// ─────────────────────────────────────────
//  NOTIFICATIONS
// ─────────────────────────────────────────
async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') showToast('🔔 Notificaciones activadas. Recibirás alertas 15 min antes de cada apuesta.');
  }
}

function scheduleAllNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  navigator.serviceWorker.ready.then(reg => {
    if (reg.active) {
      reg.active.postMessage({ type: 'SCHEDULE_NOTIFICATIONS', bets });
    }
  });
}

function showToast(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:90px;left:16px;right:16px;background:#1e1e2e;border:1px solid #7b61ff60;color:#fff;padding:12px 16px;border-radius:12px;z-index:9999;font-size:13px;box-shadow:0 8px 24px #0008;animation:slideUp .3s ease-out';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ─────────────────────────────────────────
//  WHATSAPP SHARE
// ─────────────────────────────────────────
function shareWhatsApp(id) {
  const b = bets.find(x=>x.id===id);
  if (!b) return;
  const acc = accounts.find(a=>a.id===b.accountId);
  const statusEmoji = {pending:'⏳',won:'✅',lost:'❌',cancelled:'🚫'};
  const profit = getBetProfit(b);
  const hasPnl = b.realProfit !== undefined && b.realProfit !== '' && b.realProfit !== null;
  const pnlLine = (b.status==='won'||b.status==='lost'||hasPnl)
    ? `\n💰 ${hasPnl?'Profit real':'P&L'}: ${profit>=0?'+':''}$${Math.abs(profit).toFixed(2)}`
    : '';

  const msg = [
    `${statusEmoji[b.status]||'⏳'} *${b.title}*`,
    b.market ? `🎯 ${getMarketDisplay(b.market)}` : '',
    ``,
    `📅 Fecha: ${b.date||'-'}`,
    `🏦 Cuenta: ${acc?.name||'-'}`,
    b.amount ? `💵 Monto: $${parseFloat(b.amount).toFixed(2)}` : '',
    b.odds ? `📊 Cuota: ${parseFloat(b.odds).toFixed(2)}` : '',
    b.amount && b.odds ? `🎯 Potencial: $${((parseFloat(b.amount)||0)*(parseFloat(b.odds)||1)).toFixed(2)}` : '',
    pnlLine,
    b.notes ? `\n📝 ${b.notes}` : '',
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ─────────────────────────────────────────
//  DAILY PENDING ALERTS
// ─────────────────────────────────────────
function checkDailyPending() {
  const today = new Date().toISOString().slice(0,10);
  const todayPending = bets.filter(b => b.date === today && b.status === 'pending');
  if (todayPending.length === 0) return;

  const lastCheck = localStorage.getItem('bt_last_alert');
  if (lastCheck === today) return; // already shown today
  localStorage.setItem('bt_last_alert', today);

  setTimeout(() => {
    const names = todayPending.map(b => `• ${b.title}${b.market?' — '+getMarketDisplay(b.market):''}`).join('\n');
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:linear-gradient(135deg,#7b61ff,#c8f54220);border-bottom:1px solid #7b61ff60;color:#fff;padding:16px 20px;z-index:9999;animation:slideDown .4s ease-out';
    banner.innerHTML = `
      <div style="font-weight:700;font-size:14px;margin-bottom:6px">⏳ ${todayPending.length} apuesta${todayPending.length>1?'s':''} pendiente${todayPending.length>1?'s':''} hoy</div>
      <div style="font-size:12px;color:#e0e0ff;line-height:1.6">${names}</div>
      <button onclick="this.parentElement.remove()" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer">✕</button>
    `;
    document.body.appendChild(banner);
    setTimeout(() => { if (banner.parentElement) banner.remove(); }, 10000);
  }, 1500);
}

// add slideDown animation
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }';
document.head.appendChild(styleEl);
