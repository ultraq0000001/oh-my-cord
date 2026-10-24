const ws = new WebSocket(`ws://${location.host}/ws`);
const wsStatus = document.getElementById('wsStatus');
ws.onopen = () => { wsStatus.textContent = 'connected'; wsStatus.style.color = 'var(--fg)'; };
ws.onclose = () => { wsStatus.textContent = 'disconnected'; wsStatus.style.color = 'var(--red)'; };
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'pair') updatePair(msg.pair, msg.status, msg.length);
  if (msg.type === 'terminal') appendTerminal(msg.line);
  if (msg.type === 'status') appendTerminal(`[${msg.mode}] ${msg.status}`);
};

function updatePair(pair, status, length) {
  const card = document.querySelector(`[data-pair="${pair}"]`);
  if (!card) return;
  const ind = card.querySelector('.indicator');
  const st = card.querySelector('.status');
  const ln = card.querySelector('.length');
  const isOk = /ok|normal/i.test(status);
  ind.className = 'indicator ' + (isOk ? 'ok' : 'bad');
  st.textContent = status;
  ln.textContent = length != null ? length : '--';
}

function appendTerminal(line) {
  const t = document.getElementById('terminal');
  if (!t) return;
  t.textContent += line + '\n';
  t.scrollTop = t.scrollHeight;
}

// build pair cards
const grid = document.getElementById('pairGrid');
for (let i=0;i<4;i++){
  const card = document.createElement('div');
  card.className = 'pair-card';
  card.setAttribute('data-pair', i);
  card.innerHTML = `<div><span class="indicator"></span><strong>Pair ${i+1}</strong></div><div class="status">--</div><div class="length">--</div>`;
  grid.appendChild(card);
}

// view switching
document.querySelectorAll('nav button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById(b.dataset.view).classList.add('active');
    if (b.dataset.view === 'reports') loadReports();
  });
});

async function post(url){ const r = await fetch(url,{method:'POST'}); return r.json(); }
document.getElementById('btnWiremap').addEventListener('click', ()=>post('/api/test/wiremap'));
document.getElementById('btnStress').addEventListener('click', ()=>post('/api/test/stress'));
document.getElementById('btnRunall').addEventListener('click', ()=>post('/api/test/runall'));

async function loadReports(){
  const r = await fetch('/api/reports');
  const data = await r.json();
  const el = document.getElementById('reportsList');
  el.innerHTML = data.map(d=>`<pre>${JSON.stringify(d,null,2)}</pre>`).join('');
}

// dll status
fetch('/api/status').then(r=>r.json()).then(d=>{ document.getElementById('dllStatus').textContent = d.hasDLLs?'DLLs found':'DLLs missing'; });