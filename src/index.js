#!/usr/bin/env node

const RealtekNICTarget = require('./targets/realtek-nic');
const RouterTPLinkTarget = require('./targets/router-tp-link');
const NullTarget = require('./targets/null-target');
const RealtekTDR = require('./rtk-tdr');
const { readRouterConfig } = require('./utils');

async function main() {
  console.log('=== oh-my-cord ===\n');

  const nicTarget = new RealtekNICTarget();
  console.log('NIC target:', JSON.stringify(await nicTarget.getLinkState(), null, 2));

  let routerTarget = null;
  try {
    const config = readRouterConfig();
    routerTarget = new RouterTPLinkTarget(config);
    const r = await routerTarget.connect();
    console.log('Router target:', JSON.stringify(r));
    if (r.ok) console.log('Router status:', JSON.stringify(await routerTarget.getLinkState(), null, 2));
  } catch (e) {
    console.log('Router optional, skipping:', e.message);
  }

  console.log('\n=== Realtek TDR (8-wire cable test) ===');
  const tdr = new RealtekTDR();
  console.log('DLLs found:', tdr.hasDLLs);
  if (tdr.hasDLLs) {
    const tdrResult = await tdr.testCable();
    console.log('TDR result:', JSON.stringify(tdrResult, null, 2));
  }
}

main();
