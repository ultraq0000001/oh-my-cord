const { execSync } = require('child_process');

function readCounters() {
  try {
    const out = execSync('powershell -Command "Get-NetAdapterStatistics | Select-Object Name,ReceivedBytes,SentBytes,ReceivedUnicastPackets,SentUnicastPackets,ReceivedErrors,SentErrors | ConvertTo-Json"', { encoding: 'utf8' });
    return JSON.parse(out);
  } catch (e) {
    return { error: e.message };
  }
}

function getLinkState() {
  try {
    const out = execSync('powershell -Command "Get-NetAdapter | Select-Object Name,Status,LinkSpeed | ConvertTo-Json"', { encoding: 'utf8' });
    return JSON.parse(out);
  } catch (e) {
    return { error: e.message };
  }
}

async function runStressTest(durationMs = 5000, packetSize = 1024) {
  const before = readCounters();
  const beforeLink = getLinkState();
  let packetsSent = 0;
  const start = Date.now();
  const end = start + durationMs;
  const linkStates = [beforeLink];
  while (Date.now() < end) {
    try {
      execSync(`ping -n 1 -l ${packetSize} 127.0.0.1`, { stdio: 'ignore' });
      packetsSent++;
    } catch (e) {}
    try {
      const ls = getLinkState();
      linkStates.push(ls);
    } catch (e) {}
  }
  const after = readCounters();
  const afterLink = getLinkState();
  // detect link flaps
  let linkFlaps = 0;
  for (let i = 1; i < linkStates.length; i++) {
    if (JSON.stringify(linkStates[i]) !== JSON.stringify(linkStates[i - 1])) linkFlaps++;
  }
  const errors = (after && after.ReceivedErrors ? after.ReceivedErrors : 0) + (after && after.SentErrors ? after.SentErrors : 0);
  const packetsReceived = after && after.ReceivedUnicastPackets ? after.ReceivedUnicastPackets : 0;
  return {
    duration: Date.now() - start,
    packetsSent,
    packetsReceived,
    errors,
    linkFlaps,
    pass: errors === 0 && linkFlaps === 0,
  };
}

function detectLinkFlap() {
  const s = getLinkState();
  return { state: s, timestamp: new Date().toISOString() };
}

function getCounters() { return readCounters(); }

module.exports = { runStressTest, getCounters, detectLinkFlap };