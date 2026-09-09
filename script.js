/* Disable Chart.js animations globally — this dashboard rebuilds many
   chart instances at once (theme switch, date range change), and
   animating all of them together is what causes visible jank. */
if (typeof Chart !== 'undefined') { Chart.defaults.animation = false; }

/* ============ THEME ============ */
const root = document.documentElement;
let theme = 'dark';
function applyTheme(t){
  theme = t;
  root.setAttribute('data-theme', t);
  document.getElementById('themeIcon').className = t==='dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  refreshCharts();
}
document.getElementById('themeToggle').addEventListener('click', ()=> applyTheme(theme==='dark'?'light':'dark'));
document.getElementById('themeToggle2').addEventListener('click', ()=> applyTheme(theme==='dark'?'light':'dark'));
document.getElementById('toggleAuto').addEventListener('click', function(){
  const knob = this.querySelector('.knob');
  const on = knob.style.transform === 'translateX(22px)';
  knob.style.transform = on ? 'translateX(0px)' : 'translateX(22px)';
  knob.style.background = on ? '' : 'linear-gradient(135deg, var(--green), #34d399)';
});

/* ============ SIDEBAR (mobile) ============ */
const sidebar = document.getElementById('sidebar');
const overlayBg = document.getElementById('overlayBg');
function openSidebar(){ sidebar.classList.add('open'); overlayBg.classList.add('show'); }
function closeSidebar(){ sidebar.classList.remove('open'); overlayBg.classList.remove('show'); }
document.getElementById('menuBtn').addEventListener('click', openSidebar);
document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
overlayBg.addEventListener('click', closeSidebar);

/* ============ NAV ============ */
function gotoPage(name){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.page===name));
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active', p.id==='page-'+name));
  closeSidebar();
}
document.querySelectorAll('.nav-item').forEach(item=> item.addEventListener('click', ()=> gotoPage(item.dataset.page)));

/* ============ TOASTS ============ */
function showToast(msg, icon='fa-circle-check'){
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className='toast';
  t.innerHTML = `<i class="fa-solid ${icon}"></i>${msg}`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(30px)'; t.style.transition='all .3s ease'; setTimeout(()=>t.remove(),300); }, 2800);
}

/* ============ MOCK DATA (portfolio demo — no backend) ============
   Regenerated whenever the date range changes, so switching between
   7 / 28 / 90 days visibly reshapes every chart on the page — that's
   the whole point of this demo build.
*/
function rand(min, max){ return Math.random() * (max - min) + min; }
function randInt(min, max){ return Math.round(rand(min, max)); }

function generateMockData(days){
  const today = new Date();
  const series = [];
  // Give each range its own personality so switching actually looks different:
  // 7d = choppy daily noise, 28d = a soft multi-week wave, 90d = a clear
  // long-term growth trend with weekly seasonality on top.
  const trendPerDay = days <= 7 ? 0 : days <= 28 ? 0.6 : 1.1;
  const noiseAmount = days <= 7 ? 60 : days <= 28 ? 45 : 30;
  let base = days <= 7 ? 340 : days <= 28 ? 260 : 180;

  for(let i=days-1; i>=0; i--){
    const d = new Date(today); d.setDate(d.getDate()-i);
    const weekday = d.getDay();
    const weekendDip = (weekday===0 || weekday===6) ? 0.72 : 1;
    const dayIndexFromStart = days - 1 - i;
    const trend = base + dayIndexFromStart * trendPerDay;
    const noise = rand(-noiseAmount, noiseAmount);
    const sessions = Math.max(30, Math.round((trend + noise) * weekendDip));
    const users = Math.round(sessions * rand(0.68, 0.82));
    series.push({ date: d.toISOString().slice(0,10), sessions, users });
  }

  const totalSessions = series.reduce((a,b)=>a+b.sessions,0);
  const totalUsers = series.reduce((a,b)=>a+b.users,0);
  const bounceRate = Math.round(rand(32, 48) * 10) / 10;
  const conversions = Math.round(totalSessions * rand(0.02, 0.05));
  const avgSessionDuration = randInt(95, 210);

  // Deltas vs a synthetic "previous period" — mostly positive, for a
  // dashboard that tells a good growth story, with one metric usually
  // improving in the "down is good" direction (bounce rate).
  const deltas = {
    sessions: Math.round(rand(4, 22) * 10) / 10,
    users: Math.round(rand(3, 18) * 10) / 10,
    bounceRate: Math.round(rand(-6, -1) * 10) / 10,
    conversions: Math.round(rand(6, 28) * 10) / 10,
  };

  const channelPool = [
    { name:'Organic Search', color:'#2e86ff' },
    { name:'Direct',         color:'#ff6a3d' },
    { name:'Social Media',   color:'#9b7bff' },
    { name:'Referral',       color:'#34d399' },
    { name:'Paid Search',    color:'#f4c752' },
    { name:'Email',          color:'#22c1c3' },
  ];
  let remaining = 100;
  const channels = channelPool.map((c,i)=>{
    const isLast = i === channelPool.length - 1;
    const val = isLast ? remaining : Math.min(remaining - (channelPool.length-1-i), randInt(6, 32));
    remaining -= val;
    return { name:c.name, value: Math.max(2,val), color:c.color };
  });

  const sourceNames = ['google / organic','(direct)','instagram.com / social','facebook / cpc','newsletter / email','bing / organic'];
  const sources = sourceNames.map(name=>{
    const sessions = randInt(Math.round(totalSessions*0.04), Math.round(totalSessions*0.22));
    const conv = randInt(Math.round(sessions*0.01), Math.round(sessions*0.06));
    return { name, sessions, conv };
  }).sort((a,b)=>b.sessions-a.sessions);

  const pagePaths = ['/', '/pricing', '/features', '/blog/growth-tips', '/about', '/contact'];
  const pages = pagePaths.map(path=>{
    const views = randInt(Math.round(totalSessions*0.08), Math.round(totalSessions*0.4));
    return {
      path, views,
      avgTime: `${randInt(0,3)}:${String(randInt(10,59)).padStart(2,'0')}`,
      bounce: Math.round(rand(22,55)*10)/10,
    };
  }).sort((a,b)=>b.views-a.views);

  const countryPool = [
    { name:'United States', code:'US' }, { name:'United Kingdom', code:'GB' },
    { name:'Germany', code:'DE' }, { name:'Canada', code:'CA' },
    { name:'Australia', code:'AU' }, { name:'France', code:'FR' },
  ];
  let cRemaining = 100;
  const countries = countryPool.map((c,i)=>{
    const isLast = i === countryPool.length - 1;
    const val = isLast ? cRemaining : Math.min(cRemaining - (countryPool.length-1-i), randInt(5, 34));
    cRemaining -= val;
    return { name:c.name, code:c.code, value: Math.max(2,val), sessions: Math.round(totalSessions*val/100) };
  });

  const mobilePct = randInt(48, 64);
  const desktopPct = randInt(28, 42);
  const tabletPct = Math.max(2, 100 - mobilePct - desktopPct);
  const devices = [
    { name:'Mobile',  pct: mobilePct,  icon:'fa-mobile-screen',        color:'#2e86ff' },
    { name:'Desktop', pct: desktopPct, icon:'fa-desktop',              color:'#ff6a3d' },
    { name:'Tablet',  pct: tabletPct,  icon:'fa-tablet-screen-button', color:'#9b7bff' },
  ];

  const hourly = Array.from({length:24}, (_,h)=>{
    // Rough daytime activity curve peaking in the evening.
    const curve = Math.max(0, Math.sin(((h-6)/24) * Math.PI * 2) * 0.5 + 0.5);
    return Math.round(curve * randInt(20,40) + randInt(0,6));
  });

  return {
    property: 'Acme Store — acmestore.com (demo)',
    totals: { sessions: totalSessions, users: totalUsers, bounceRate, conversions, avgSessionDuration },
    deltas, series, channels, sources, pages, countries, devices, hourly,
    realtimeNow: randInt(4, 18),
  };
}

let currentDays = 28;
let DATA = generateMockData(currentDays);

function loadData(showSpinner){
  const btn = document.getElementById('refreshBtn');
  if(showSpinner) btn.classList.add('loading');
  DATA = generateMockData(currentDays);
  renderAll();
  if(showSpinner){ setTimeout(()=> btn.classList.remove('loading'), 500); }
}

/* ============ RENDER: METRIC CARDS ============ */
function fmtNum(n){ return new Intl.NumberFormat('en-US').format(Math.round(n)); }

const EMPTY_NOTE = '<p style="padding:12px 2px; font-size:12.5px; color:var(--text-3);">No data for this period.</p>';

function statCardHTML(s,i){
  return `<div class="stat-card">
    <div class="stat-top"><span class="label">${s.label}</span>
      <div class="stat-icon" style="background:color-mix(in srgb, ${s.color} 18%, transparent); color:${s.color}"><i class="fa-solid ${s.icon}"></i></div>
    </div>
    <div class="stat-value num">${s.value}</div>
    <div class="spark-wrap"><canvas id="spark${i}"></canvas></div>
    <div class="stat-foot ${s.up?'up':'down'}"><i class="fa-solid fa-arrow-${s.up?'up':'down'}"></i>${s.change}<span class="muted"> vs previous period</span></div>
  </div>`;
}

function buildStatCards(){
  const t = DATA.totals, d = DATA.deltas;
  const fmtChange = (v)=> (v==null ? '—' : (v>0?'+':'')+v+'%');
  return [
    { label:'Sessions', value: fmtNum(t.sessions), icon:'fa-arrow-right-arrow-left', color:'var(--blue)', change:fmtChange(d.sessions), up: d.sessions>=0 },
    { label:'Users', value: fmtNum(t.users), icon:'fa-users', color:'var(--accent)', change:fmtChange(d.users), up: d.users>=0 },
    { label:'Bounce Rate', value: t.bounceRate+'%', icon:'fa-arrow-trend-down', color:'var(--purple)', change:fmtChange(d.bounceRate), up: d.bounceRate<=0 },
    { label:'Conversions', value: fmtNum(t.conversions), icon:'fa-bullseye', color:'var(--green)', change:fmtChange(d.conversions), up: d.conversions>=0 }
  ];
}

function renderMetrics(){
  const stats = buildStatCards();
  document.getElementById('statGrid').innerHTML = stats.map(statCardHTML).join('');
  document.getElementById('statGridTraffic').innerHTML = stats.map((s,i)=>statCardHTML(s,i+10)).join('');
}

/* ============ RENDER: TABLES & LISTS ============ */
function renderPagesTable(){
  const tbody = document.querySelector('#pagesTable tbody');
  tbody.innerHTML = DATA.pages.map(p=>`
    <tr>
      <td>${p.path}</td>
      <td class="num-cell">${fmtNum(p.views)}</td>
      <td class="num-cell">${p.avgTime}</td>
      <td class="num-cell">${p.bounce}%</td>
    </tr>`).join('');
}

function renderSourcesTable(){
  const tbody = document.querySelector('#sourcesTable tbody');
  tbody.innerHTML = DATA.sources.map(s=>{
    const rate = Math.round((s.conv/s.sessions)*1000)/10;
    return `<tr>
      <td>${s.name}</td>
      <td class="num-cell">${fmtNum(s.sessions)}</td>
      <td class="num-cell">${s.conv}</td>
      <td class="num-cell ${rate>=2?'trend-up':''}">${rate}%</td>
    </tr>`;
  }).join('');
}

function countryRowHTML(c){
  return `<div class="rank-row">
    <div class="rank-flag">${c.code}</div>
    <div class="rank-info">
      <div class="rank-name">${c.name}</div>
      <div class="rank-track"><div class="rank-fill" style="width:${c.value}%; background:var(--blue);"></div></div>
    </div>
    <div class="rank-value">${c.value}%</div>
  </div>`;
}
function renderCountries(){
  const html = DATA.countries.map(countryRowHTML).join('');
  document.getElementById('countryList').innerHTML = html;
  document.getElementById('countryListFull').innerHTML = html;
}

function renderDevices(){
  document.getElementById('deviceSplit').innerHTML = DATA.devices.map(d=>`
    <div class="device-row">
      <div class="device-icon" style="background:color-mix(in srgb, ${d.color} 18%, transparent); color:${d.color}"><i class="fa-solid ${d.icon}"></i></div>
      <div class="device-info">
        <div class="device-top"><span>${d.name}</span><span class="pct">${d.pct}%</span></div>
        <div class="rank-track"><div class="rank-fill" style="width:${d.pct}%; background:${d.color};"></div></div>
      </div>
    </div>`).join('');
}

/* ============ REAL-TIME COUNTER ============ */
let liveInterval = null;
function startLiveCounter(){
  if(liveInterval) clearInterval(liveInterval);
  liveInterval = setInterval(()=>{
    const el = document.getElementById('liveCount');
    if(!el) return;
    let cur = parseInt(el.textContent, 10) || DATA.realtimeNow;
    const delta = Math.random() > 0.5 ? 1 : -1;
    cur = Math.max(1, Math.min(24, cur + (Math.random() > 0.6 ? delta : 0)));
    el.textContent = cur;
  }, 3000);
}

/* ============ CHARTS ============ */
let chartInstances = [];
function destroyCharts(){ chartInstances.forEach(c=>c.destroy()); chartInstances=[]; }
function themeColors(){
  const dark = theme==='dark';
  return { grid: dark?'rgba(255,255,255,0.06)':'rgba(15,35,64,0.07)', text: dark?'#92a5c2':'#51637e' };
}

function buildTrafficChart(canvasId){
  const el = document.getElementById(canvasId); if(!el) return;
  const c = themeColors();
  const ctx = el.getContext('2d');
  const gradBlue = ctx.createLinearGradient(0,0,0,230);
  gradBlue.addColorStop(0,'rgba(46,134,255,0.30)'); gradBlue.addColorStop(1,'rgba(46,134,255,0)');
  const gradOrange = ctx.createLinearGradient(0,0,0,230);
  gradOrange.addColorStop(0,'rgba(255,106,61,0.25)'); gradOrange.addColorStop(1,'rgba(255,106,61,0)');
  const labels = DATA.series.map(s=> s.date.slice(5));
  const chart = new Chart(ctx, { type:'line', data:{ labels, datasets:[
    { label:'Sessions', data: DATA.series.map(s=>s.sessions), borderColor:'#2e86ff', backgroundColor:gradBlue, fill:true, tension:.35, pointRadius:0, borderWidth:2.5 },
    { label:'Users', data: DATA.series.map(s=>s.users), borderColor:'#ff6a3d', backgroundColor:gradOrange, fill:true, tension:.35, pointRadius:0, borderWidth:2 }
  ]}, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, interaction:{mode:'index', intersect:false},
    scales:{ x:{ grid:{display:false}, ticks:{color:c.text, font:{size:10}, maxTicksLimit:8} }, y:{ grid:{color:c.grid}, ticks:{color:c.text, font:{size:10.5}} } } } });
  chartInstances.push(chart);
}

function buildChannelChart(canvasId){
  const el = document.getElementById(canvasId); if(!el) return;
  const c = themeColors();
  const chart = new Chart(el.getContext('2d'), { type:'doughnut',
    data:{ labels: DATA.channels.map(ch=>ch.name), datasets:[{ data: DATA.channels.map(ch=>ch.value), backgroundColor: DATA.channels.map(ch=>ch.color), borderWidth:0 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ position:'right', labels:{ color:c.text, boxWidth:9, font:{size:10.5}, padding:10 } } } } });
  chartInstances.push(chart);
}

function buildNewReturningChart(){
  const el = document.getElementById('newReturningChart'); if(!el) return;
  const c = themeColors();
  const newV = Math.round(DATA.totals.users*0.68), retV = DATA.totals.users - newV;
  const chart = new Chart(el.getContext('2d'), { type:'bar',
    data:{ labels:['New','Returning'], datasets:[{ data:[newV, retV], backgroundColor:['#2e86ff','#9b7bff'], borderRadius:10, maxBarThickness:70 }]},
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ x:{ grid:{color:c.grid}, ticks:{color:c.text} }, y:{ grid:{display:false}, ticks:{color:c.text, font:{size:12.5}} } } } });
  chartInstances.push(chart);
}

function buildHourlyChart(){
  const el = document.getElementById('hourlyChart'); if(!el) return;
  const c = themeColors();
  const chart = new Chart(el.getContext('2d'), { type:'bar',
    data:{ labels: Array.from({length:24}, (_,i)=> i+':00'), datasets:[{ data: DATA.hourly, backgroundColor:'#2e86ff', borderRadius:5, maxBarThickness:16 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ x:{ grid:{display:false}, ticks:{color:c.text, font:{size:9.5}, maxTicksLimit:12} }, y:{ grid:{color:c.grid}, ticks:{color:c.text} } } } });
  chartInstances.push(chart);
}

function buildSparklines(){
  const s = DATA.series;
  const sparkData = [
    s.slice(-8).map(d=>d.sessions),
    s.slice(-8).map(d=>d.users),
    s.slice(-8).map((_,i)=> 45 - i*1.1 + rand(0,3)),
    s.slice(-8).map(d=> Math.round(d.sessions*0.02)),
  ];
  const colors = ['#2e86ff','#ff6a3d','#9b7bff','#34d399'];
  [0,1,2,3].forEach(i=>{
    ['spark'+i, 'spark'+(i+10)].forEach(id=>{
      const el = document.getElementById(id); if(!el) return;
      const chart = new Chart(el.getContext('2d'), { type:'line', data:{ labels: sparkData[i].map((_,x)=>x), datasets:[{ data:sparkData[i], borderColor:colors[i], borderWidth:2, pointRadius:0, tension:.4 }]},
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{enabled:false}}, scales:{x:{display:false}, y:{display:false}} } });
      chartInstances.push(chart);
    });
  });
}

function refreshCharts(){
  if(!DATA) return;
  destroyCharts();
  const builders = [
    ()=> buildTrafficChart('trafficChart'),
    ()=> buildTrafficChart('trafficChart2'),
    ()=> buildChannelChart('channelChart'),
    ()=> buildChannelChart('channelChart2'),
    ()=> buildNewReturningChart(),
    ()=> buildHourlyChart(),
    ()=> buildSparklines(),
  ];
  builders.forEach(fn=>{ try{ fn(); }catch(err){ console.error('Chart render failed:', err); } });
}

/* ============ AI INSIGHTS ============ */
const aiPanel = document.getElementById('aiPanel');
const aiBody = document.getElementById('aiBody');
function openAI(){ aiPanel.classList.add('show'); }
function closeAI(){ aiPanel.classList.remove('show'); }
document.getElementById('aiFab').addEventListener('click', ()=> aiPanel.classList.contains('show') ? closeAI() : openAI());
document.getElementById('aiClose').addEventListener('click', closeAI);

function addAIMessage(text, from){
  const div = document.createElement('div');
  div.className = 'ai-msg ' + from;
  div.textContent = text;
  aiBody.appendChild(div);
  aiBody.scrollTop = aiBody.scrollHeight;
}

function generateInsight(query){
  const q = query.toLowerCase();
  const bestChannel = [...DATA.channels].sort((a,b)=>b.value-a.value)[0];
  const bestSource = [...DATA.sources].sort((a,b)=> (b.conv/b.sessions) - (a.conv/a.sessions))[0];
  const worstPage = [...DATA.pages].sort((a,b)=>b.bounce-a.bounce)[0];
  const topCountry = DATA.countries[0];
  const topPage = [...DATA.pages].sort((a,b)=>b.views-a.views)[0];

  if(q.includes('channel') || q.includes('source')){
    return `"${bestChannel.name}" drives the most traffic — ${bestChannel.value}% of sessions. "${bestSource.name}" converts best at ${Math.round((bestSource.conv/bestSource.sessions)*1000)/10}%.`;
  }
  if(q.includes('bounce')){
    return `"${worstPage.path}" has the highest bounce rate at ${worstPage.bounce}%. Worth checking whether the content matches what visitors expect when they land there.`;
  }
  if(q.includes('page') || q.includes('top')){
    return `Your top page is "${topPage.path}" with ${fmtNum(topPage.views)} views and an average time of ${topPage.avgTime}.`;
  }
  if(q.includes('countr') || q.includes('geo')){
    return `${topCountry.value}% of visitors come from ${topCountry.name}, followed by a solid international spread.`;
  }
  if(q.includes('conversion')){
    return `${DATA.totals.conversions} conversions this period, ${DATA.deltas.conversions>0?'+':''}${DATA.deltas.conversions}% vs the previous period.`;
  }
  return "I can help with channels, bounce rate, top pages, geography, or conversions — ask about any of those, or try a suggestion below.";
}

const suggestions = ['Best channel?', 'Where are bounces high?', 'Top page?', 'How are conversions?'];
document.getElementById('aiChips').innerHTML = suggestions.map(s=>`<div class="ai-chip" data-q="${s}">${s}</div>`).join('');
document.querySelectorAll('.ai-chip').forEach(chip=> chip.addEventListener('click', ()=> sendAI(chip.dataset.q)));

function sendAI(text){
  if(!text) return;
  addAIMessage(text, 'user');
  document.getElementById('aiInput').value='';
  setTimeout(()=> addAIMessage(generateInsight(text), 'bot'), 450);
}
document.getElementById('aiSend').addEventListener('click', ()=> sendAI(document.getElementById('aiInput').value.trim()));
document.getElementById('aiInput').addEventListener('keydown', e=>{ if(e.key==='Enter') sendAI(e.target.value.trim()); });
addAIMessage("Hi! I'm analyzing the Acme Store demo data. Ask me about channels, conversions, top pages, or geography.", 'bot');

/* ============ EXPORT DROPDOWN (demo — no real file is generated) ============ */
const exportBtn = document.getElementById('exportBtn');
const exportMenu = document.getElementById('exportMenu');
const exportLabel = document.getElementById('exportLabel');
document.addEventListener('click', (e)=>{
  if(exportBtn.contains(e.target)){ exportMenu.classList.toggle('show'); }
  else if(!exportMenu.contains(e.target)){ exportMenu.classList.remove('show'); }
});
document.querySelectorAll('.export-item').forEach(item=>{
  item.addEventListener('click', ()=>{
    const format = item.dataset.format;
    exportMenu.classList.remove('show');
    const originalLabel = 'Export Report';
    exportLabel.textContent = 'Done!';
    exportBtn.classList.add('done');
    showToast(`${format} report ready (demo — no file generated)`, 'fa-circle-check');
    setTimeout(()=>{
      exportLabel.textContent = originalLabel;
      exportBtn.classList.remove('done');
    }, 1600);
  });
});

/* ============ LOGIN GATE (client-side demo only) ============ */
const appRoot = document.getElementById('appRoot');
const loginGate = document.getElementById('loginGate');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginSubmit = document.getElementById('loginSubmit');
const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'admin';

function showGate(){
  appRoot.classList.add('gated');
  loginGate.classList.remove('hidden');
  loginError.classList.remove('show');
  if(liveInterval){ clearInterval(liveInterval); liveInterval = null; }
}
function hideGate(){
  appRoot.classList.remove('gated');
  loginGate.classList.add('hidden');
  loginError.classList.remove('show');
}

loginForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  if(username === DEMO_USERNAME && password === DEMO_PASSWORD){
    hideGate();
    loadData(false);
    startLiveCounter();
  }else{
    loginError.textContent = 'Invalid username or password';
    loginError.classList.add('show');
  }
});

document.getElementById('logoutBtn').addEventListener('click', ()=> showGate());

/* ============ TOP ACTIONS ============ */
document.getElementById('refreshBtn').addEventListener('click', ()=>{ loadData(true); showToast('Data refreshed'); });
document.getElementById('mainSearch').addEventListener('input', ()=>{ /* reserved for future filtering */ });
document.getElementById('rangeSelect').addEventListener('change', (e)=>{
  currentDays = parseInt(e.target.value, 10) || 28;
  loadData(true);
});

/* ============ INIT ============ */
function renderAll(){
  document.querySelectorAll('.chart-wrap .skeleton-block').forEach(el => el.remove());
  renderMetrics();
  renderPagesTable();
  renderSourcesTable();
  renderCountries();
  renderDevices();
  refreshCharts();
  if(DATA && DATA.realtimeNow != null){ document.getElementById('liveCount').textContent = DATA.realtimeNow; }
}

showGate();
