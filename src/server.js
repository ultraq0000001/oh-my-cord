const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8'));
const PORT = config.server?.port || 3000;
const reportsDir = path.join(process.cwd(), config.paths.reports || 'reports');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

const RealtekTDR = require('./rtk-tdr');
const NICInspector = require('./nic-inspector');
const tdr = new RealtekTDR();
const nic = new NICInspector();
let selectedAdapter = null;

function broadcast(msg) {
  const data = JSON.stringify(msg);
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(data); });
}

function saveReport(mode, result) {
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const file = path.join(reportsDir, `${mode}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify({ mode, timestamp: new Date().toISOString(), result }, null, 2));
  return file;
}

async function runTdr(mode, ws) {
  broadcast({ type: 'status', mode, status: 'running' });
  broadcast({ type: 'terminal', line: `> Starting ${mode}...` });
  const result = await tdr.testCable();
  broadcast({ type: 'terminal', line: `> TDR result: ${JSON.stringify(result)}` });
  if (result && result.pairs) {
    result.pairs.forEach(p => {
      broadcast({ type: 'pair', pair: p.pair, status: p.status_text || p.error, length: p.length_raw });
    });
  }
  saveReport(mode, result);
  broadcast({ type: 'status', mode, status: 'done', result });
  return result;
}

app.get('/api/status', (req, res) => {
  res.json({ ok: true, hasDLLs: tdr.hasDLLs, dllDir: tdr.dllDir });
});

app.post('/api/test/wiremap', async (req, res) => { res.json(await runTdr('wiremap', null)); });
app.post('/api/test/stress', async (req, res) => {
  broadcast({ type: 'status', mode: 'stress', status: 'running' });
  broadcast({ type: 'terminal', line: '> Stress test (placeholder) - measuring link...' });
  const result = await tdr.testCable();
  saveReport('stress', result);
  broadcast({ type: 'status', mode: 'stress', status: 'done', result });
  res.json(result);
});
app.post('/api/test/runall', async (req, res) => {
  const r1 = await runTdr('wiremap', null);
  broadcast({ type: 'terminal', line: '> Running stress phase...' });
  const r2 = await tdr.testCable();
  saveReport('runall', { wiremap: r1, stress: r2 });
  broadcast({ type: 'status', mode: 'runall', status: 'done', result: { wiremap: r1, stress: r2 } });
  res.json({ wiremap: r1, stress: r2 });
});

app.get('/api/reports', (req, res) => {
  if (!fs.existsSync(reportsDir)) return res.json([]);
  const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json')).sort().reverse();
  const out = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(reportsDir, f), 'utf8')); } catch (e) { return null; }
  }).filter(Boolean);
  res.json(out);
});

app.get('/api/adapters', (req, res) => {
  res.json(nic.listAdapters());
});

app.post('/api/adapter/select', (req, res) => {
  const name = req.body && req.body.name;
  selectedAdapter = name;
  tdr.setAdapter(name);
  res.json({ ok: true, selectedAdapter: name, linkStatus: nic.getLinkStatus(name) });
});

app.get('/api/link-status', (req, res) => {
  const name = (req.query && req.query.name) || selectedAdapter;
  res.json(nic.getLinkStatus(name));
});

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'hello', msg: 'connected' }));
});

server.listen(PORT, () => {
  console.log(`OH-MY-CORD web UI on http://localhost:${PORT}`);
});