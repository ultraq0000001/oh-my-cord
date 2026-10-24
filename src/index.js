#!/usr/bin/env node

const RealtekNICTarget = require('./targets/realtek-nic');
const RouterTPLinkTarget = require('./targets/router-tp-link');
const NullTarget = require('./targets/null-target');
const RealtekTDR = require('./rtk-tdr');
const NICInspector = require('./nic-inspector');
const { readRouterConfig } = require('./utils');

async function main() {
  console.log('=== oh-my-cord ===\n');

  const nicInspector = new NICInspector();
  const adapters = nicInspector.listAdapters();
  console.log('Network adapters:');
  adapters.forEach(a => console.log(`  - ${a.name} (${a.description}) status=${a.status} speed=${a.linkSpeed} mac=${a.macAddress}`));

  // adapter selection via CLI arg or auto-detect Realtek
  let selected = process.argv[2] || null;
  if (!selected) {
    const realtek = adapters.find(a => (a.description || '').toLowerCase().includes('realtek'));
    selected = realtek ? realtek.name : (adapters[0] ? adapters[0].name : null);
  }
  console.log('\nSelected adapter:', selected);
  if (selected) console.log('Link status:', JSON.stringify(nicInspector.getLinkStatus(selected), null, 2));

  const nicTarget = new RealtekNICTarget();
  console.log('NIC target:', JSON.stringify(await nicTarget.getLinkState(), null, 2));

  let routerTarget = null;
  try {
    const config = readRouterConfig();
    if (!config) throw new Error('no router config');
    routerTarget = new RouterTPLinkTarget(config);
    const r = await routerTarget.connect();
    console.log('Router target:', JSON.stringify(r));
    if (r && r.ok) console.log('Router status:', JSON.stringify(await routerTarget.getLinkState(), null, 2));
    else { console.log('Router unavailable - running TDR-only mode'); routerTarget = null; }
  } catch (e) {
    console.log('Router unavailable - running TDR-only mode');
    routerTarget = null;
  }

  console.log('\n=== Realtek TDR (8-wire cable test) ===');
  const tdr = new RealtekTDR();
  tdr.setAdapter(selected);
  console.log('DLLs found:', tdr.hasDLLs);
  if (tdr.hasDLLs) {
    const tdrResult = await tdr.testCable();
    console.log('TDR result:', JSON.stringify(tdrResult, null, 2));
  }
}

main();
